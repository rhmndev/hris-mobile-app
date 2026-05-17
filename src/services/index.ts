/**
 * Services Entry Point
 * Export all services from one place
 */

export { httpClient } from './https'
export { authService } from './auth'
export { attendanceService } from './attendance'
export { companyService } from './company'
export { userService } from './user'
export { leaveService } from './leave'

// Re-export types
export type { User, LoginRequest, LoginResponse } from './auth'
export type {
  Attendance,
  CheckInOutRequest,
  CheckInOutResponse,
  TodayAttendanceResponse,
  AttendanceHistoryResponse,
} from './attendance'

export type { Company, CompanyResponse } from './company'
export type { UserProfilePhotoResponse} from './user'

export type {
  LeaveRequestItem,
  LeaveRequestListResponse,
  CreateLeaveRequestPayload,
  CreateLeaveRequestResponse,
  LeaveType,
  LeaveStatus
} from './leave'