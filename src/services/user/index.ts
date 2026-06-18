import { httpClient, API_ORIGIN } from '../https'
import type { UserProfilePhotoResponse, UploadProfilePhotoResponse } from './types'
import type { UpdateProfileRequest, UpdateProfileResponse } from '../auth/types'

class UserService {
    async getProfilePhoto(): Promise<UserProfilePhotoResponse> {
        const response = await httpClient.get<UserProfilePhotoResponse>('/user/profile-photo')
        const photoUrl = response.data.profile_photo_url
        if (photoUrl && !/^https?:\/\//.test(photoUrl)) {
            response.data.profile_photo_url = new URL(photoUrl, API_ORIGIN).toString();
        }
        return response;
    }

    async uploadProfilePhoto(photoBase64: string): Promise<UploadProfilePhotoResponse> {
        return httpClient.post<UploadProfilePhotoResponse>('/user/profile-photo', {
            photo: photoBase64,
        })
    }

    async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
        return httpClient.put<UpdateProfileResponse>('/user/profile', data)
    }
}

export const userService = new UserService();
export * from './types';
