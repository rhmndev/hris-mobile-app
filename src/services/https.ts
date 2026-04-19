/**
 * Base HTTP Client
 * Handles all HTTP requests with authentication and error handling
 */

const API_BASE_URL = 'https://process-stench-galvanize.ngrok-free.dev/api'

class HttpClient {
  private baseURL: string

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

  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred')
    }

    return data as T
  }

  async post<T>(endpoint: string, body?: object): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred')
    }

    return data as T
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(false), // Don't include Content-Type for FormData
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred')
    }

    return data as T
  }

  /**
   * Convert base64 string to Blob for file uploads
   */
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