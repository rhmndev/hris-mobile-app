export interface Company {
    id: number
    name: string
    address: string
    latitude: string
    longitude: string
    radius: number
    work_start_time: string
    work_end_time: string
    created_at: string
    updated_at: string

}

export interface CompanyResponse {
    success: boolean
    message: string
    data: Company
}