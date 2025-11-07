const API_BASE_URL = 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'API request failed');
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
}

export const apiService = new ApiService();


