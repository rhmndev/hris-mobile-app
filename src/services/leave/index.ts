import {httpClient} from '../https'

import type {
    CreateLeaveRequestPayload,
    CreateLeaveRequestResponse,
    LeaveRequestListResponse
} from './types'

class LeaveService {
    async getLeaveRequests(): Promise<LeaveRequestListResponse> {
        return httpClient.get<LeaveRequestListResponse>('/leave-requests')
    }

  async createLeaveRequest(payload: CreateLeaveRequestPayload): Promise<CreateLeaveRequestResponse> {
    const formData = new FormData()
    formData.append('type', payload.type)
    formData.append('start_date', payload.start_date)
    formData.append('end_date', payload.end_date)
    formData.append('reason', payload.reason)

    if (payload.attachment) {
      formData.append('attachment', payload.attachment)
    }

    return httpClient.postFormData<CreateLeaveRequestResponse>('/leave-requests', formData)
  }

  async deleteLeaveRequest(id: number): Promise<void> {
    await httpClient.delete(`/leave-requests/${id}`)
  }
}

export const leaveService = new LeaveService()
export * from './types'