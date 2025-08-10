import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success?: boolean;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T = unknown>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get<ApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async patch<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.patch<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Auth specific methods
  async login(email: string, password: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: unknown }>> {
    return this.post('/auth/login', { email, password });
  }

  async register(userData: { email: string; password: string; name: string }): Promise<ApiResponse<{ user: unknown }>> {
    return this.post('/auth/register', userData);
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.post('/auth/refresh', { refreshToken });
  }

  async logout(): Promise<ApiResponse> {
    return this.post('/auth/logout');
  }

  // Admin specific methods
  async getSystemStats(): Promise<ApiResponse<unknown>> {
    return this.get('/admin/dashboard/stats');
  }

  async getRecentActivities(): Promise<ApiResponse<unknown[]>> {
    return this.get('/admin/dashboard/activities');
  }

  async getSystemAlerts(): Promise<ApiResponse<unknown[]>> {
    return this.get('/admin/dashboard/alerts');
  }

  async getUsers(page = 1, limit = 10): Promise<ApiResponse<{ users: unknown[]; total: number; page: number; limit: number }>> {
    return this.get(`/admin/users?page=${page}&limit=${limit}`);
  }

  async createUser(userData: unknown): Promise<ApiResponse<unknown>> {
    return this.post('/admin/users', userData);
  }

  async updateUser(userId: string, userData: unknown): Promise<ApiResponse<unknown>> {
    return this.put(`/admin/users/${userId}`, userData);
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.delete(`/admin/users/${userId}`);
  }

  // Error handling
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Une erreur est survenue';
      return new Error(message);
    }
    return new Error('Une erreur inattendue est survenue');
  }

  // Upload file method
  async uploadFile(file: File, endpoint: string): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const apiService = new ApiService();
export default apiService;
