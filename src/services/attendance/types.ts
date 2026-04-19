/**
 * Attendance Service Types
 */

export interface Attendance {
  id: number
  attendance_date: string
  check_in_time: string | null
  check_in_latitude: number | null
  check_in_longitude: number | null
  check_in_photo: string | null
  check_out_time: string | null
  check_out_latitude: number | null
  check_out_longitude: number | null
  check_out_photo: string | null
  status: string
  is_late: boolean
  has_checked_out: boolean
  created_at: string
}

export interface TodayAttendanceResponse {
  success: boolean
  message: string
  data: Attendance | null
}

export interface AttendanceHistoryResponse {
  success: boolean
  message: string
  data: Attendance[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface CheckInOutRequest {
  latitude: number
  longitude: number
  photo: string // base64 encoded
}

export interface CheckInOutResponse {
  success: boolean
  message: string
  data: Attendance
}