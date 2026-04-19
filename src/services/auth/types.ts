export interface LoginRequest {
    email: string
    password: string
}

export interface User {
    id: number
    name: string
    email: string
    phone: string
    employee_id: string
    role: string
    email_verified_at: string | null
    created_at: string
}

export interface LoginResponse {
    success: boolean
    message: string
    date: {
        user: User
        access_token: string
    }
}

export interface LogoutResponse {
    success: boolean
    message: string
}

export interface GetMeResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
    };
}