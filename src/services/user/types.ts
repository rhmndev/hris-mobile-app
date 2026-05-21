export interface UserProfilePhotoResponse {
    success: boolean
    data: {
        profile_photo_url: string
        profile_photo_base64: string
    }
    message: string
}