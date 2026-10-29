export interface Company {
    id: number
    name: string
    address: string
    branch: Branch | null
    created_at: string
    updated_at: string

}

export interface Branch {
    id: number
    company_id: number
    address:  string | null
    latitude: string
    longitude: string
    radius: number
    work_start_time: string
    work_end_time: string
    min_check_in_time: string | null
    max_check_in_time: string | null
    min_check_out_time: string | null
    max_check_out_time: string | null
    require_liveness: boolean
    require_geolocation: boolean
    require_face_recognation: boolean
}

export interface CompanyResponse {
    success: boolean
    message: string
    data: Company
}