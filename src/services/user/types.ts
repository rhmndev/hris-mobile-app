export interface UserProfilePhotoResponse {
    success: boolean
    data: {
        profile_photo_url: string
        profile_photo_base64: string
    }
    message: string
}

export interface UploadProfilePhotoResponse {
    success: boolean
    message: string
    data: import('../auth/types').User
}