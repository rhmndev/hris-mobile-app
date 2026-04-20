import { httpClient } from "../https"
import type { LoginRequest, LoginResponse, LogoutResponse, GetMeResponse } from "./types"

class AuthService {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        return httpClient.post<LoginResponse>('/login', credentials)
    }

    async logout(): Promise<LogoutResponse> {
        return httpClient.post<LogoutResponse>('/auth/logout')
    }

    async getMe(): Promise<GetMeResponse> {
        return httpClient.get<GetMeResponse>('/auth/me')
    }
}

export const authService = new AuthService()
export * from './types'