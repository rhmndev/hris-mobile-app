export interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    employee_id: string | null;
    role: string;
    email_verified_at: string | null;
    created_at: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        access_token: string; // Sudah sesuai dengan 'access_token' di Laravel
    };
}

export interface LogoutResponse {
    success: boolean;
    message: string;
}

export interface GetMeResponse {
    success: boolean;
    message: string;
    data: User;
}