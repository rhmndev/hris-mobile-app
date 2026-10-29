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
    // ESS Profile Fields
    date_of_birth: string | null;
    identity_number: string | null;
    bank_account_number: string | null;
    bank_name: string | null;
    address: string | null;
    phone_personal: string | null;
    join_date: string | null;
    employee_status: string | null;
    profile_photo: string | null;
    employee_designation: EmployeeDesignation | null;
}

export interface EmployeeDesignation {
    id: number;
    user_id: number;
    designation_id: number;
    shift_id: number;
    basic_salary: number;
    allowances: number;
    is_active: boolean;
    effective_date: string | null;
    end_date: string | null;
    designation: Designation | null;
    shift: Shift | null;
}

export interface Designation {
    id: number;
    name: string;
    description: string | null;
}

export interface Shift {
    id: number;
    name: string;
    clock_in_time: string;
    clock_out_time: string;
    early_clock_in_time: string | null;
    allow_clock_out_till: string | null;
    late_tolerance_minutes: number;
    self_clocking: boolean;
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
    min_check_in_time: string | null;
    max_check_in_time: string | null;
    min_check_out_time: string | null;
    max_check_out_time: string | null;
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

export interface UpdateProfileRequest {
    name?: string;
    email?: string;
    phone_personal?: string;
    address?: string;
    date_of_birth?: string;
    identity_number?: string;
    bank_account_number?: string;
    bank_name?: string;
}

export interface UpdateProfileResponse {
    success: boolean;
    message: string;
    data: User;
}
