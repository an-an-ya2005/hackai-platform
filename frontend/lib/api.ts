interface Application {
  id: string;
  title: string;
  description: string;
  problemStatement: string;
  solution: string;
  techStack: string[];
  teamSize: number;
  teamMembers: string[];
  githubRepo?: string;
  demoUrl?: string;
  status: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ApplicationsResponse {
  applications: Application[];
  total: number;
  totalPages: number;
  currentPage: number;
}

interface Notification {
  id: string;
  type: 'APPLICATION_STATUS_CHANGE' | 'NEW_APPLICATION_SUBMITTED' | 'APPLICATION_REVIEW_ASSIGNED' | 'APPLICATION_REVIEW_COMPLETED' | 'SYSTEM_ANNOUNCEMENT' | 'DEADLINE_REMINDER';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    name: string;
    email: string;
  };
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BrochureMetadata {
  fileName: string;
  size: number;
  uploadedAt: string;
}

interface AIStage {
  id?: string;
  type?: string;
  stage?: string;
  result?: string;
  processedAt?: string;
  createdAt?: string;
  feedback?: string;
  score?: number;
  metadata?: Record<string, unknown> | null;
  errorMessage?: string;
}

interface AIReviewStatus {
  stages: AIStage[];
  lastUpdated?: string;
}

export class ApiClient {
  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private static async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAuthToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.href = '/auth/signin';
        }
        throw new Error('Unauthorized - Please sign in again');
      }
      if (response.status === 404) {
        throw new Error('Resource not found');
      }
      if (response.status === 403) {
        throw new Error('Access forbidden');
      }
      
      // Try to get error message from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
      } catch {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    }

    return response;
  }

  static async getUserApplications(page: number = 1, limit: number = 10): Promise<ApplicationsResponse> {
    const response = await this.fetchWithAuth(`/api/applications/my-applications?page=${page}&limit=${limit}`);
    return response.json();
  }

  static async getApplication(id: string): Promise<Application> {
    const response = await this.fetchWithAuth(`/api/applications/${id}`);
    return response.json();
  }

  static async createApplication(data: Partial<Application>): Promise<Application> {
    const response = await this.fetchWithAuth('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  static async updateApplication(id: string, data: Partial<Application>): Promise<Application> {
    const response = await this.fetchWithAuth(`/api/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  static async deleteApplication(id: string): Promise<void> {
    await this.fetchWithAuth(`/api/applications/${id}`, {
      method: 'DELETE',
    });
  }

  static async submitApplication(id: string): Promise<Application> {
    const response = await this.fetchWithAuth(`/api/applications/${id}/submit`, {
      method: 'POST',
    });
    return response.json();
  }

  static async getAIReviewStatus(id: string): Promise<AIReviewStatus> {
    const response = await this.fetchWithAuth(`/api/applications/${id}/ai-review-status`);
    return response.json();
  }

  // Admin-only methods
  static async getAllApplications(): Promise<ApplicationsResponse> {
    // Simplified approach - just fetch all applications without complex parameters
    const url = `/api/applications`;
    console.log('API Request URL (simplified):', url);
    console.log('Auth token present:', !!this.getAuthToken());
    
    try {
      const response = await this.fetchWithAuth(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response success - applications count:', data.applications?.length || 0);
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  static async updateApplicationStatus(id: string, status: string): Promise<Application> {
    const response = await this.fetchWithAuth(`/api/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.json();
  }

  // Notification endpoints
  static async getNotifications(page = 1, limit = 20, read?: boolean): Promise<NotificationsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (read !== undefined) {
      params.append('read', read.toString());
    }
    
    const response = await this.fetchWithAuth(`/api/notifications?${params}`);
    return response.json();
  }

  static async getUnreadCount(): Promise<number> {
    const response = await this.fetchWithAuth('/api/notifications/unread-count');
    return response.json(); // Backend returns plain number
  }

  static async markNotificationAsRead(id: string): Promise<Notification> {
    const response = await this.fetchWithAuth(`/api/notifications/${id}/mark-read`, {
      method: 'POST',
    });
    return response.json();
  }

  static async markAllNotificationsAsRead(): Promise<{ count: number }> {
    const response = await this.fetchWithAuth('/api/notifications/mark-all-read', {
      method: 'POST',
    });
    return response.json();
  }

  static async deleteNotification(id: string): Promise<void> {
    await this.fetchWithAuth(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  static async getBrochureMetadata(): Promise<BrochureMetadata | null> {
    const response = await this.fetchWithAuth('/api/brochure');
    const responseBody = await response.text();
    if (!responseBody.trim()) {
      return null;
    }

    return JSON.parse(responseBody) as BrochureMetadata | null;
  }

  static async getBrochureFile(): Promise<Blob> {
    const response = await this.fetchWithAuth('/api/brochure/file');
    return response.blob();
  }

  static async uploadBrochure(file: File): Promise<BrochureMetadata> {
    const formData = new FormData();
    formData.append('brochure', file);

    const response = await this.fetchWithAuth('/api/brochure', {
      method: 'PUT',
      body: formData,
    });
    return response.json();
  }
}

export type { Application, ApplicationsResponse, Notification, NotificationsResponse };
