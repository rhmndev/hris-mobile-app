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
}

export interface CompanyResponse {
    success: boolean
    message: string
    data: Company
}