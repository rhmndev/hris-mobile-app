export type LeaveType = 'cuti_tahunan' | 'cuti_sakit'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveRequestItem {
    id: number
    type: LeaveType
    type_label: string
    start_date: string
    end_date: string
    total_days: number
    reason: string
    attachment_url: string | null
    status: LeaveStatus
    review_notes: string | null
    reviewed_at: string | null
    reviewed_by_name: string | null
    created_at: string | null
}

export interface LeaveRequestListResponse {
  success: boolean
  message: string
  data: LeaveRequestItem[]
}

export interface CreateLeaveRequestPayload {
  type: LeaveType
  start_date: string
  end_date: string
  reason: string
  attachment?: File | null
}

export interface CreateLeaveRequestResponse {
  success: boolean
  message: string
  data: LeaveRequestItem
}