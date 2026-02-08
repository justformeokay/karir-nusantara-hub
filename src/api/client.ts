// API Client Configuration
import { ErrorLogger } from '@/utils/errorLogger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(isFormData: boolean = false): HeadersInit {
    const token = localStorage.getItem('admin_token');
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    // Only set Content-Type if not FormData (browser will handle it)
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      ErrorLogger.error('ApiClient', '401 Unauthorized - Session expired', {
        url: response.url,
        status: response.status,
        headers: {
          'content-type': response.headers.get('content-type'),
        },
      });
      
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      // Use setTimeout to avoid redirect during render
      setTimeout(() => {
        window.location.href = '/login';
      }, 0);
      throw new Error('Session expired');
    }

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      ErrorLogger.error('ApiClient', `HTTP ${response.status} Error`, {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });

      const error = typeof errorBody === 'object' && errorBody !== null 
        ? (errorBody as any).message || (errorBody as any).error || `HTTP ${response.status}`
        : errorBody || `HTTP ${response.status}`;
      
      throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
    }

    if (response.status === 204) {
      return { success: true } as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options?: RequestOptions & { data?: unknown }): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: options?.data ? JSON.stringify(options.data) : undefined,
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async uploadFile<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(true), // isFormData = true
      body: formData,
      ...options,
    });
    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();

// Helper function to get full URL for static files (e.g., documents)
export function getStaticFileUrl(relativePath?: string): string {
  if (!relativePath) return '';
  
  // If already a full URL, return as is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Remove leading slash if present
  const path = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  
  // Combine with API base URL
  return `${API_BASE_URL}/${path}`;
}
