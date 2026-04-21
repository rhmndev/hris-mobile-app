import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authService, type User } from '../services'
import router from '../router'

const USER_STORAGE_KEY = 'auth_user'

const saveUserToStorage = (user: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

const loadUserFromStorage = (): User | null => {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    if (stored) {
        try {
            return JSON.parse(stored) as User
        } catch {
            return null
        }
    }
    return null
}

const clearUserFromStorage = () => {
    localStorage.removeItem(USER_STORAGE_KEY)
}


export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(loadUserFromStorage())
    const token = ref<string | null>(localStorage.getItem('auth_token'))
    const isLoading = ref<boolean>(false)
    const error = ref<string | null>(null)

    const isAuthenticated = computed(() => !!token.value && !!user.value)

    const initAuth = async () => {
        if (!user.value) {
            user.value = loadUserFromStorage()
        }
        if (token.value) {
            try {
                const response = await authService.getMe()
                console.log('>>>', response)
                user.value = response.data
                saveUserToStorage(user.value)
            } catch (err) {
                console.error('Failed to fetch user info:', err)
                logout()
            }
        }
    }

    const login = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null

    try {
        const response = await authService.login({ email, password })
        
        // Ambil dari response.data.access_token (sesuai JSON Laravel di atas)
        const receivedToken = response.data.access_token
        
        if (receivedToken) {
            token.value = receivedToken
            localStorage.setItem('auth_token', receivedToken)
            saveUserToStorage(response.data.user)
            user.value = response.data.user
            return { success: true }
        } else {
            throw new Error('Token tidak ditemukan dalam respon')
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        error.value = errorMessage
        return { success: false, message: errorMessage }
    } finally {
        isLoading.value = false
    }
}

    const logout = async () => {
        try {
            if (token.value) {
                await authService.logout()
            }
        } catch (err) {

        } finally {
            token.value = null
            user.value = null
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            clearUserFromStorage()

            router.push('/login')
        }
    }

    const updateUser = (userData: User) => {
        user.value = userData
        saveUserToStorage(userData)
    }

    return {
        user,
        token,
        isLoading,
        error,
        isAuthenticated,
        initAuth,
        login,
        logout,
        updateUser
    }   
})