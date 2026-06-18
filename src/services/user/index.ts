import { httpClient, API_ORIGIN } from '../https'
import type { UserProfilePhotoResponse } from './types'
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

    async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
        return httpClient.put<UpdateProfileResponse>('/user/profile', data)
    }
}

export const userService = new UserService();
export * from './types';
