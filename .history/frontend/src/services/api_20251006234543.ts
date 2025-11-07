const API_BASE_URL = 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Try multiple token storage locations for compatibility
    let token = localStorage.getItem('token') ||
                localStorage.getItem('authToken');

    // If no token found, try to get from current user data
    if (!token) {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const userData = JSON.parse(currentUser);
          token = userData.token || userData.authToken;
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
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `API request failed: ${response.statusText} (${response.status}) - ${errorText}`;

      if (response.status === 401) {
        // Clear all stored authentication data on authentication error
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        console.warn('Authentication failed - cleared stored tokens. Please login again.');
      }
      throw new Error(errorMessage);
    }

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      const errorMessage = result.message || 'API request failed';
      if (response.status === 401) {
        // Clear all stored authentication data on authentication error
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        console.warn('Authentication failed - cleared stored tokens. Please login again.');
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
    return this.request<any>(`/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  }

  async deleteLead(leadId: string): Promise<void> {
    return this.request<void>(`/leads/${leadId}`, {
      method: 'DELETE',
    });
  }

  async login(email: string, password: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!result.success && response.status !== 401) {
      throw new Error(result.message || 'Login failed');
    }

    return result;
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
}

export const apiService = new ApiService();


