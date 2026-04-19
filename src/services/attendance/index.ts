/**
 * Attendance Service
 * Handles attendance-related API calls
 */

import { httpClient } from '../https'
import type {
  TodayAttendanceResponse,
  AttendanceHistoryResponse,
  CheckInOutRequest,
  CheckInOutResponse,
} from './types'

class AttendanceService {
  /**
   * Get today's attendance for current user
   */
  async getToday(): Promise<TodayAttendanceResponse> {
    return httpClient.get<TodayAttendanceResponse>('/attendance/today')
  }

  /**
   * Get attendance history with pagination
   */
  async getHistory(page: number = 1): Promise<AttendanceHistoryResponse> {
    return httpClient.get<AttendanceHistoryResponse>(`/attendance/history?page=${page}`)
  }

  /**
   * Check in attendance
   */
  async checkIn(data: CheckInOutRequest): Promise<CheckInOutResponse> {
    const formData = new FormData()
    formData.append('latitude', data.latitude.toString())
    formData.append('longitude', data.longitude.toString())

    // Convert base64 to Blob for proper multipart upload
    const photoBlob = httpClient.base64ToBlob(data.photo)
    formData.append('photo', photoBlob, 'selfie.jpg')

    return httpClient.postFormData<CheckInOutResponse>('/attendance/check-in', formData)
    
}

/**
   * Check out attendance
   */
async checkOut(data: CheckInOutRequest): Promise<CheckInOutResponse> {
    const formData = new FormData()
    formData.append('latitude', data.latitude.toString())
    formData.append('longitude', data.longitude.toString())

    // Convert base64 to Blob for proper multipart upload
    const photoBlob = httpClient.base64ToBlob(data.photo)
    formData.append('photo', photoBlob, 'selfie.jpg')

    return httpClient.postFormData<CheckInOutResponse>('/attendance/check-out', formData)
  }
}

export const attendanceService = new AttendanceService()

// Re-export types for convenience
export * from './types'