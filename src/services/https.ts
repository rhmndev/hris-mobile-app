import { useAuthStore } from '../stores/auth';
import router from '../router';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const API_ORIGIN = new URL(API_BASE_URL).origin

class HttpClient {
  private baseURL: string
    defaults: any;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  private getHeaders(includeContentType: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    }

    if (includeContentType) {
      headers['Content-Type'] = 'application/json'
    }

    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      const authStore = useAuthStore();
     if (router.currentRoute.value.path !== '/login') {
          authStore.logout();
          router.push('/login')
        }
      throw new Error('Akun tidak valid atau sesi telah berakhir. Silakan login kembali.');
    }

    let data: any
    try {
      data = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw new Error(`HTTP error! with status: ${response.status} - ${response.statusText}`);
      }
      throw error;
    }

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }
    
    return data as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body?: object): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    return this.handleResponse<T>(response);
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(false), 
      body: formData,
    })

   return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, body?: object): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    return this.handleResponse<T>(response);
  }

  
  base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }
}

export const httpClient = new HttpClient()