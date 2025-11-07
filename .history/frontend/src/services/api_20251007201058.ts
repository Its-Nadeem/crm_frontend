const API_BASE_URL = 'http://localhost:5000/api';

// Enhanced API service with better error handling and retry logic
class EnhancedApiService {
    private refreshPromise: Promise<any> | null = null;
    private isRefreshing = false;

    private clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('activeSessions');
        localStorage.removeItem('refreshToken');
    }

    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        // Try multiple token storage locations for compatibility
        let token = localStorage.getItem('token') ||
                    localStorage.getItem('authToken');

        console.log('API Request Debug:', {
            endpoint,
            hasToken: !!token,
            tokenLength: token?.length,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
        });

        // If no token found, try to get from current user data
        if (!token) {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                try {
                    const userData = JSON.parse(currentUser);
                    token = userData.token || userData.authToken;
                    console.log('Retrieved token from currentUser data');
                } catch (e) {
                    console.warn('Failed to parse current user data');
                }
            }
        }

        // Only add authorization header if we have a valid token
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options?.headers,
        };

        if (token && token.length > 10) { // Basic validation for token length
            // Enhanced JWT format validation
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                try {
                    // Try to decode the payload to verify it's valid JSON
                    const payload = JSON.parse(atob(tokenParts[1]));
                    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
                    console.log('Added authorization header with valid token');
                } catch (decodeError) {
                    console.warn('Token payload invalid, clearing corrupted token');
                    this.clearAuthData();
                }
            } else {
                console.warn('Token format invalid, clearing corrupted token');
                this.clearAuthData();
            }
        } else {
            console.warn('No valid token found for API request');
        }

        console.log('Making request to:', `${API_BASE_URL}${endpoint}`);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers,
            credentials: 'include', // Include cookies for refresh token
            ...options,
        });

        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
            let errorText = 'Unknown error';
            try {
                errorText = await response.text();
            } catch (e) {
                errorText = 'Failed to read error response';
            }

            const errorMessage = `API request failed: ${response.statusText} (${response.status}) - ${errorText}`;

            console.error('API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                errorText,
                endpoint
            });

            if (response.status === 401) {
                // Clear all stored authentication data on authentication error
                console.log('Clearing invalid tokens due to 401 error');
                this.clearAuthData();
            }
            throw new Error(errorMessage);
        }

        let result: ApiResponse<T>;
        try {
            const responseText = await response.text();
            if (!responseText.trim()) {
                throw new Error('Empty response from server');
            }
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', {
                error: parseError,
                responseText: await response.text(),
                endpoint
            });
            throw new Error(`Invalid JSON response from server: ${parseError.message}`);
        }

        console.log('API Response success:', result.success);

        if (!result.success) {
            const errorMessage = result.message || 'API request failed';
            console.error('API Response error:', errorMessage);
            if (response.status === 401) {
                // Clear all stored authentication data on authentication error
                console.log('Clearing tokens due to API response 401');
                this.clearAuthData();
            }
            throw new Error(errorMessage);
        }

        return result.data as T;
    }

    async requestWithRetry<T>(endpoint: string, options?: RequestInit, maxRetries = 3): Promise<T> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.request<T>(endpoint, options);
            } catch (error) {
                const isLastAttempt = attempt === maxRetries;
                const isAuthError = error.message.includes('401') || error.message.includes('Unauthorized');

                if (isAuthError && !isLastAttempt) {
                    try {
                        await this.refreshToken();
                        // Retry with new token
                        continue;
                    } catch (refreshError) {
                        if (isLastAttempt) {
                            throw new Error('Authentication failed. Please log in again.');
                        }
                        continue;
                    }
                }

                if (isLastAttempt) {
                    throw error;
                }

                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
        throw new Error('Max retries exceeded');
    }

    private async refreshToken(): Promise<any> {
        if (this.isRefreshing) {
            return this.refreshPromise;
        }

        this.isRefreshing = true;
        this.refreshPromise = this.performTokenRefresh();

        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    private async performTokenRefresh(): Promise<any> {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        if (data.success && data.token) {
            localStorage.setItem('token', data.token);
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            return data;
        } else {
            throw new Error('Invalid refresh response');
        }
    }

    async getTenantContext(): Promise<any> {
        return this.requestWithRetry<any>('/tenant/context');
    }

    async login(email: string, password: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                let errorText = 'Unknown error';
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = 'Failed to read error response';
                }

                let errorMessage = 'Login failed';

                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // If we can't parse JSON, use the raw error text
                    if (errorText && errorText.length > 0 && errorText !== 'Failed to read error response') {
                        errorMessage = errorText;
                    }
                }

                console.error('Login API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                    errorMessage
                });

                if (response.status === 401) {
                    throw new Error('Invalid email or password');
                }

                if (response.status >= 500) {
                    throw new Error('Server error. Please check if the backend server is running.');
                }

                throw new Error(errorMessage);
            }

            let result;
            try {
                const responseText = await response.text();
                if (!responseText.trim()) {
                    throw new Error('Empty response from server');
                }
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Login JSON Parse Error:', parseError);
                throw new Error(`Invalid response from server: ${parseError.message}`);
            }

            if (!result.success) {
                throw new Error(result.message || 'Login failed');
            }

            // Handle both old format (direct user data) and new format ({ success: true, data: userData })
            const userData = result.data || result;

            // Store tokens
            if (userData.token) {
                localStorage.setItem('token', userData.token);
            }
            if (userData.refreshToken) {
                localStorage.setItem('refreshToken', userData.refreshToken);
            }

            return userData;
        } catch (error) {
            if (error.message.includes('ECONNREFUSED') || error.message.includes('Network Error')) {
                throw new Error('Cannot connect to server. Please ensure the backend server is running on port 3000.');
            }
            throw error;
        }
    }

    // All the existing API methods from the original ApiService
    async getLeads(organizationId?: string): Promise<any[]> {
        const endpoint = organizationId ? `/leads?organizationId=${organizationId}` : '/leads';
        return this.requestWithRetry<any[]>(endpoint);
    }

    async getUsers(organizationId?: string): Promise<any[]> {
        const endpoint = organizationId ? `/users?organizationId=${organizationId}` : '/users';
        return this.requestWithRetry<any[]>(endpoint);
    }

    async getStages(organizationId?: string): Promise<any[]> {
        const endpoint = organizationId ? `/stages?organizationId=${organizationId}` : '/stages';
        return this.requestWithRetry<any[]>(endpoint);
    }

    async getTasks(organizationId?: string): Promise<any[]> {
        const endpoint = organizationId ? `/tasks?organizationId=${organizationId}` : '/tasks';
        return this.requestWithRetry<any[]>(endpoint);
    }

    async getOrganizations(): Promise<any[]> {
        return this.requestWithRetry<any[]>('/organizations');
    }

    async getCustomFields(organizationId?: string): Promise<any[]> {
        const endpoint = organizationId ? `/custom-fields?organizationId=${organizationId}` : '/custom-fields';
        return this.requestWithRetry<any[]>(endpoint);
    }

    async createLead(leadData: any): Promise<any> {
        return this.requestWithRetry<any>('/leads', {
            method: 'POST',
            body: JSON.stringify(leadData),
        });
    }

    async updateLead(leadId: string, leadData: any): Promise<any> {
        console.log('API Service - Updating lead:', leadId, leadData);
        try {
            const result = await this.requestWithRetry<any>(`/leads/${leadId}`, {
                method: 'PUT',
                body: JSON.stringify(leadData),
            });
            console.log('API Service - Update successful:', result);
            return result;
        } catch (error) {
            console.error('API Service - Update failed:', error);
            throw error;
        }
    }

    async getLeadById(leadId: string): Promise<any> {
        console.log('API Service - Getting lead by ID:', leadId);
        try {
            const result = await this.requestWithRetry<any>(`/leads/${leadId}`);
            console.log('API Service - Get lead successful:', result);
            return result;
        } catch (error) {
            console.error('API Service - Get lead failed:', error);
            throw error;
        }
    }

    async deleteLead(leadId: string): Promise<void> {
        return this.requestWithRetry<void>(`/leads/${leadId}`, {
            method: 'DELETE',
        });
    }

    async createTask(taskData: any): Promise<any> {
        return this.requestWithRetry<any>('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData),
        });
    }

    async updateTask(taskId: string, taskData: any): Promise<any> {
        return this.requestWithRetry<any>(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(taskData),
        });
    }

    async deleteTask(taskId: string): Promise<void> {
        return this.requestWithRetry<void>(`/tasks/${taskId}`, {
            method: 'DELETE',
        });
    }

    async createNote(noteData: any): Promise<any> {
        return this.requestWithRetry<any>('/notes', {
            method: 'POST',
            body: JSON.stringify(noteData),
        });
    }

    async getNotes(leadId: string): Promise<any[]> {
        return this.requestWithRetry<any[]>(`/notes/${leadId}`);
    }

    async getCalls(leadId: string): Promise<any[]> {
        return this.requestWithRetry<any[]>(`/calls/${leadId}`);
    }

    async createCall(callData: any): Promise<any> {
        return this.requestWithRetry<any>('/calls', {
            method: 'POST',
            body: JSON.stringify(callData),
        });
    }

    async updateUser(userId: string, userData: any): Promise<any> {
        return this.requestWithRetry<any>(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async createStage(stageData: any): Promise<any> {
        return this.requestWithRetry<any>('/stages', {
            method: 'POST',
            body: JSON.stringify(stageData),
        });
    }

    async updateStage(stageId: string, stageData: any): Promise<any> {
        return this.requestWithRetry<any>(`/stages/${stageId}`, {
            method: 'PUT',
            body: JSON.stringify(stageData),
        });
    }

    async deleteStage(stageId: string): Promise<void> {
        return this.requestWithRetry<void>(`/stages/${stageId}`, {
            method: 'DELETE',
        });
    }

    async createCustomField(fieldData: any): Promise<any> {
        return this.requestWithRetry<any>('/custom-fields', {
            method: 'POST',
            body: JSON.stringify(fieldData),
        });
    }

    async updateCustomField(fieldId: string, fieldData: any): Promise<any> {
        return this.requestWithRetry<any>(`/custom-fields/${fieldId}`, {
            method: 'PUT',
            body: JSON.stringify(fieldData),
        });
    }

    async deleteCustomField(fieldId: string): Promise<void> {
        return this.requestWithRetry<void>(`/custom-fields/${fieldId}`, {
            method: 'DELETE',
        });
    }

    async createLeadScoreRule(ruleData: any): Promise<any> {
        return this.requestWithRetry<any>('/lead-score-rules', {
            method: 'POST',
            body: JSON.stringify(ruleData),
        });
    }

    async updateOrganization(orgId: string, orgData: any): Promise<any> {
        return this.requestWithRetry<any>(`/organizations/${orgId}`, {
            method: 'PUT',
            body: JSON.stringify(orgData),
        });
    }

    async createCustomDomain(domainData: any): Promise<any> {
        return this.requestWithRetry<any>('/custom-domains', {
            method: 'POST',
            body: JSON.stringify(domainData),
        });
    }

    async updateBlogPost(postId: string, postData: any): Promise<any> {
        return this.requestWithRetry<any>(`/blog-posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(postData),
        });
    }

    async createBlogPost(postData: any): Promise<any> {
        return this.requestWithRetry<any>('/blog-posts', {
            method: 'POST',
            body: JSON.stringify(postData),
        });
    }

    async deleteBlogPost(postId: string): Promise<void> {
        return this.requestWithRetry<void>(`/blog-posts/${postId}`, {
            method: 'DELETE',
        });
    }

    async bulkUpdateLeads(leadIds: string[], updates: any): Promise<any> {
        return this.requestWithRetry<any>('/leads/bulk', {
            method: 'PUT',
            body: JSON.stringify({ leadIds, updates }),
        });
    }
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiService {
  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('activeSessions');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
     // Try multiple token storage locations for compatibility
     let token = localStorage.getItem('token') ||
                 localStorage.getItem('authToken');

     console.log('API Request Debug:', {
       endpoint,
       hasToken: !!token,
       tokenLength: token?.length,
       tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
     });

     // If no token found, try to get from current user data
     if (!token) {
       const currentUser = localStorage.getItem('currentUser');
       if (currentUser) {
         try {
           const userData = JSON.parse(currentUser);
           token = userData.token || userData.authToken;
           console.log('Retrieved token from currentUser data');
         } catch (e) {
           console.warn('Failed to parse current user data');
         }
       }
     }

     // Only add authorization header if we have a valid token
     const headers: HeadersInit = {
       'Content-Type': 'application/json',
       ...options?.headers,
     };

     if (token && token.length > 10) { // Basic validation for token length
       // Enhanced JWT format validation
       const tokenParts = token.split('.');
       if (tokenParts.length === 3) {
         try {
           // Try to decode the payload to verify it's valid JSON
           const payload = JSON.parse(atob(tokenParts[1]));
           (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
           console.log('Added authorization header with valid token');
         } catch (decodeError) {
           console.warn('Token payload invalid, clearing corrupted token');
           this.clearAuthData();
         }
       } else {
         console.warn('Token format invalid, clearing corrupted token');
         this.clearAuthData();
       }
     } else {
       console.warn('No valid token found for API request');
     }

     console.log('Making request to:', `${API_BASE_URL}${endpoint}`);

     const response = await fetch(`${API_BASE_URL}${endpoint}`, {
       headers,
       ...options,
     });

     console.log('Response status:', response.status, response.statusText);

     if (!response.ok) {
       let errorText = 'Unknown error';
       try {
         errorText = await response.text();
       } catch (e) {
         errorText = 'Failed to read error response';
       }

       const errorMessage = `API request failed: ${response.statusText} (${response.status}) - ${errorText}`;

       console.error('API Error Response:', {
         status: response.status,
         statusText: response.statusText,
         errorText,
         endpoint
       });

       if (response.status === 401) {
         // Clear all stored authentication data on authentication error
         console.log('Clearing invalid tokens due to 401 error');
         localStorage.removeItem('token');
         localStorage.removeItem('authToken');
         localStorage.removeItem('currentUser');
         localStorage.removeItem('sessionId');
         localStorage.removeItem('activeSessions');
       }
       throw new Error(errorMessage);
     }

     let result: ApiResponse<T>;
     try {
       const responseText = await response.text();
       if (!responseText.trim()) {
         throw new Error('Empty response from server');
       }
       result = JSON.parse(responseText);
     } catch (parseError) {
       console.error('JSON Parse Error:', {
         error: parseError,
         responseText: await response.text(),
         endpoint
       });
       throw new Error(`Invalid JSON response from server: ${parseError.message}`);
     }

     console.log('API Response success:', result.success);

     if (!result.success) {
       const errorMessage = result.message || 'API request failed';
       console.error('API Response error:', errorMessage);
       if (response.status === 401) {
         // Clear all stored authentication data on authentication error
         console.log('Clearing tokens due to API response 401');
         localStorage.removeItem('token');
         localStorage.removeItem('authToken');
         localStorage.removeItem('currentUser');
         localStorage.removeItem('sessionId');
         localStorage.removeItem('activeSessions');
       }
       throw new Error(errorMessage);
     }

     return result.data as T;
   }

  async getLeads(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId ? `/leads?organizationId=${organizationId}` : '/leads';
    return this.request<any[]>(endpoint);
  }

  async getUsers(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId ? `/users?organizationId=${organizationId}` : '/users';
    return this.request<any[]>(endpoint);
  }

  async getStages(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId ? `/stages?organizationId=${organizationId}` : '/stages';
    return this.request<any[]>(endpoint);
  }

  async getTasks(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId ? `/tasks?organizationId=${organizationId}` : '/tasks';
    return this.request<any[]>(endpoint);
  }

  async getOrganizations(): Promise<any[]> {
    return this.request<any[]>('/organizations');
  }

  async getCustomFields(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId ? `/custom-fields?organizationId=${organizationId}` : '/custom-fields';
    return this.request<any[]>(endpoint);
  }

  async createLead(leadData: any): Promise<any> {
    return this.request<any>('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(leadId: string, leadData: any): Promise<any> {
    console.log('API Service - Updating lead:', leadId, leadData);
    try {
      const result = await this.request<any>(`/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify(leadData),
      });
      console.log('API Service - Update successful:', result);
      return result;
    } catch (error) {
      console.error('API Service - Update failed:', error);
      throw error;
    }
  }

  async getLeadById(leadId: string): Promise<any> {
    console.log('API Service - Getting lead by ID:', leadId);
    try {
      const result = await this.request<any>(`/leads/${leadId}`);
      console.log('API Service - Get lead successful:', result);
      return result;
    } catch (error) {
      console.error('API Service - Get lead failed:', error);
      throw error;
    }
  }

  async deleteLead(leadId: string): Promise<void> {
    return this.request<void>(`/leads/${leadId}`, {
      method: 'DELETE',
    });
  }

  async bulkUpdateLeads(leadIds: string[], updates: any): Promise<any> {
    return this.request<any>('/leads/bulk', {
      method: 'PUT',
      body: JSON.stringify({ leadIds, updates }),
    });
  }

  async bulkDeleteLeads(leadIds: string[]): Promise<any> {
    return this.request<any>('/leads/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ leadIds }),
    });
  }

  async login(email: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorText = 'Unknown error';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Failed to read error response';
        }

        let errorMessage = 'Login failed';

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use the raw error text
          if (errorText && errorText.length > 0 && errorText !== 'Failed to read error response') {
            errorMessage = errorText;
          }
        }

        console.error('Login API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          errorMessage
        });

        if (response.status === 401) {
          throw new Error('Invalid email or password');
        }

        if (response.status >= 500) {
          throw new Error('Server error. Please check if the backend server is running.');
        }

        throw new Error(errorMessage);
      }

      let result;
      try {
        const responseText = await response.text();
        if (!responseText.trim()) {
          throw new Error('Empty response from server');
        }
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Login JSON Parse Error:', parseError);
        throw new Error(`Invalid response from server: ${parseError.message}`);
      }

      if (!result.success) {
        throw new Error(result.message || 'Login failed');
      }

      // Handle both old format (direct user data) and new format ({ success: true, data: userData })
      return result.data || result;
    } catch (error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('Network Error')) {
        throw new Error('Cannot connect to server. Please ensure the backend server is running on port 5000.');
      }
      throw error;
    }
  }

  // Users CRUD
  async createUser(userData: any): Promise<any> {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: any): Promise<any> {
    return this.request<any>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.request<void>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Stages CRUD
  async createStage(stageData: any): Promise<any> {
    return this.request<any>('/stages', {
      method: 'POST',
      body: JSON.stringify(stageData),
    });
  }

  async updateStage(stageId: string, stageData: any): Promise<any> {
    return this.request<any>(`/stages/${stageId}`, {
      method: 'PUT',
      body: JSON.stringify(stageData),
    });
  }

  async deleteStage(stageId: string): Promise<void> {
    return this.request<void>(`/stages/${stageId}`, {
      method: 'DELETE',
    });
  }

  // Teams CRUD
  async createTeam(teamData: any): Promise<any> {
    return this.request<any>('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  }

  async updateTeam(teamId: string, teamData: any): Promise<any> {
    return this.request<any>(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
  }

  async deleteTeam(teamId: string): Promise<void> {
    return this.request<void>(`/teams/${teamId}`, {
      method: 'DELETE',
    });
  }

  // Tasks CRUD
  async createTask(taskData: any): Promise<any> {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(taskId: string, taskData: any): Promise<any> {
    return this.request<any>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    return this.request<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Custom Fields CRUD
  async createCustomField(fieldData: any): Promise<any> {
    return this.request<any>('/custom-fields', {
      method: 'POST',
      body: JSON.stringify(fieldData),
    });
  }

  async updateCustomField(fieldId: string, fieldData: any): Promise<any> {
    return this.request<any>(`/custom-fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(fieldData),
    });
  }

  async deleteCustomField(fieldId: string): Promise<void> {
    return this.request<void>(`/custom-fields/${fieldId}`, {
      method: 'DELETE',
    });
  }

  // Automation Rules CRUD
  async getAutomationRules(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId ? `/automation-rules?organizationId=${organizationId}` : '/automation-rules';
    return this.request<any[]>(endpoint);
  }

  async createAutomationRule(ruleData: any): Promise<any> {
    return this.request<any>('/automation-rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  }

  async updateAutomationRule(ruleId: string, ruleData: any): Promise<any> {
    return this.request<any>(`/automation-rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData),
    });
  }

  async deleteAutomationRule(ruleId: string): Promise<void> {
    return this.request<void>(`/automation-rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  // Templates CRUD
  async getTemplates(organizationId?: string, type?: string): Promise<any[]> {
    let endpoint = '/templates';
    const params = new URLSearchParams();
    if (organizationId) params.append('organizationId', organizationId);
    if (type) params.append('type', type);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request<any[]>(endpoint);
  }

  async createTemplate(templateData: any): Promise<any> {
    return this.request<any>('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async updateTemplate(templateId: string, templateData: any): Promise<any> {
    return this.request<any>(`/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async deleteTemplate(templateId: string): Promise<void> {
    return this.request<void>(`/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  // Campaigns CRUD
  async getCampaigns(organizationId?: string, type?: string): Promise<any[]> {
    let endpoint = '/campaigns';
    const params = new URLSearchParams();
    if (organizationId) params.append('organizationId', organizationId);
    if (type) params.append('type', type);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request<any[]>(endpoint);
  }

  async createCampaign(campaignData: any): Promise<any> {
    return this.request<any>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
  }

  async updateCampaign(campaignId: string, campaignData: any): Promise<any> {
    return this.request<any>(`/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(campaignData),
    });
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    return this.request<void>(`/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
  }

  // Organizations CRUD
  async createOrganization(orgData: any): Promise<any> {
    return this.request<any>('/organizations', {
      method: 'POST',
      body: JSON.stringify(orgData),
    });
  }

  async updateOrganization(orgId: string, orgData: any): Promise<any> {
    return this.request<any>(`/organizations/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(orgData),
    });
  }

  async deleteOrganization(orgId: string): Promise<void> {
    return this.request<void>(`/organizations/${orgId}`, {
      method: 'DELETE',
    });
  }

  // Blog Posts CRUD
  async getBlogPosts(): Promise<any[]> {
    return this.request<any[]>('/blog-posts');
  }

  async createBlogPost(postData: any): Promise<any> {
    return this.request<any>('/blog-posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async updateBlogPost(postId: string, postData: any): Promise<any> {
    return this.request<any>(`/blog-posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  }

  async deleteBlogPost(postId: string): Promise<void> {
    return this.request<void>(`/blog-posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Coupons CRUD
  async getCoupons(): Promise<any[]> {
    return this.request<any[]>('/coupons');
  }

  async createCoupon(couponData: any): Promise<any> {
    return this.request<any>('/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData),
    });
  }

  // Custom Domains CRUD
  async getCustomDomains(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId ? `/custom-domains?organizationId=${organizationId}` : '/custom-domains';
    return this.request<any[]>(endpoint);
  }

  async createCustomDomain(domainData: any): Promise<any> {
    return this.request<any>('/custom-domains', {
      method: 'POST',
      body: JSON.stringify(domainData),
    });
  }

  // Support Tickets CRUD
  async getSupportTickets(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId ? `/support-tickets?organizationId=${organizationId}` : '/support-tickets';
    return this.request<any[]>(endpoint);
  }

  async createSupportTicket(ticketData: any): Promise<any> {
    return this.request<any>('/support-tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  // Webhook Configs CRUD
  async getWebhookConfigs(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId ? `/webhook-configs?organizationId=${organizationId}` : '/webhook-configs';
    return this.request<any[]>(endpoint);
  }

  async createWebhookConfig(configData: any): Promise<any> {
    return this.request<any>('/webhook-configs', {
      method: 'POST',
      body: JSON.stringify(configData),
    });
  }

  // Additional utility methods
  async getAddons(): Promise<any[]> {
    return this.request<any[]>('/addons');
  }

  async getInquiries(): Promise<any[]> {
    return this.request<any[]>('/inquiries');
  }

  async getIntegrationSettings(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId ? `/integration-settings?organizationId=${organizationId}` : '/integration-settings';
    return this.request<any[]>(endpoint);
  }

  async createIntegrationSetting(settingData: any): Promise<any> {
    return this.request<any>('/integration-settings', {
      method: 'POST',
      body: JSON.stringify(settingData),
    });
  }

  async getLeadScoreRules(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId ? `/lead-score-rules?organizationId=${organizationId}` : '/lead-score-rules';
    return this.request<any[]>(endpoint);
  }

  async createLeadScoreRule(ruleData: any): Promise<any> {
    return this.request<any>('/lead-score-rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  }

  async getSubscriptionPlans(): Promise<any[]> {
    return this.request<any[]>('/subscription-plans');
  }

  // Notes API
  async getNotes(leadId: string): Promise<any[]> {
    return this.request<any[]>(`/notes/${leadId}`);
  }

  async createNote(noteData: any): Promise<any> {
    return this.request<any>('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  async deleteNote(noteId: string): Promise<void> {
    return this.request<void>(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  // Calls API
  async getCalls(leadId: string): Promise<any[]> {
    return this.request<any[]>(`/calls/${leadId}`);
  }

  async createCall(callData: any): Promise<any> {
    return this.request<any>('/calls', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  }

  async deleteCall(callId: string): Promise<void> {
    return this.request<void>(`/calls/${callId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new EnhancedApiService();


