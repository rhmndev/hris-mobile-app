export interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    employee_id: string | null;
    role: string;
    branch: Branch | null;
    email_verified_at: string | null;
    created_at: string;
}

export interface Branch {
    id: number;
    company_id: number;
    name: string;
    address: string | null;
    latitude: string;
    longitude: string;
    radius: number;
    work_start_time: string;
    work_end_time: string;
    require_liveness: boolean;
    require_geolocation: boolean;
    require_face_recognation: boolean;
    created_at: string;
    updated_at: string;
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