<script setup lang="ts">
    import { useRouter } from 'vue-router'
    import BottomNavigation from '../components/BottomNavigation.vue'
    import { useAuthStore } from '../stores/auth'
    import { authService, userService } from '../services';
    import { onMounted, ref } from 'vue';

    const router = useRouter();
    const authStore = useAuthStore();
    const loading = ref(false);
    const isLoggingOut = ref(false);
    const profilePhotoSource = ref<string | null>(null);

    const fetchUserData = async () => {
        loading.value = true;
        try {
            const response = await authService.getMe();
            authStore.updateUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            if (error instanceof Error && error.message.includes('401')) {
                await authStore.logout();
                router.push('/login');
            }
        } finally {
            loading.value = false;
        }
    }

    const fetchProfilePhoto = async () => {
        try {
            const res = await userService.getProfilePhoto();
            profilePhotoSource.value = res.data.profile_photo_base64 || res.data.profile_photo_url || null;
        } catch (error) {
            console.error('Failed to fetch profile photo:', error);
        }
    }

    onMounted(() => {
        fetchUserData();
        fetchProfilePhoto();
    });

    const handleLogout = async () => {
        isLoggingOut.value = true; // Aktifkan loading
        try {
            await authStore.logout();
            // Beri sedikit delay (opsional) agar user melihat spinner-nya
            await new Promise(resolve => setTimeout(resolve, 800));
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            isLoggingOut.value = false;
        }
    }

    const goBack = () => {
        router.push('/home')
    }
</script>

<template>
    <div class="min-h-screen bg-base-200 pb-24">
        <!-- Header -->
         <div class="bg-primary text-primary-content pt-12 px-4 pb-8">
            <div class="flex items-center gap-4 mb-6">
                <button class="btn btn-ghost btn-circle" @click="goBack">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 class="text-xl font-semibold">Profile</h1>
            </div>
            <div class="flex flex-col items-center">
                <div class="avatar placeholder mb-4">
                    <div class="bg-blue-400 text-white rounded-full w-24">
                        <!-- <span class="text-6xl font-bold flex items-center justify-center h-full">{{ authStore.user?.name.charAt(0) }}</span> -->
                        <img v-if="profilePhotoSource" :src="profilePhotoSource" alt="Profile Photo" class="w-full h-full object-cover rounded-full">
                        <span v-else class="text-6xl font-bold flex items-center justify-center h-full">{{ authStore.user?.name.charAt(0) }}</span>
                    </div>
                </div>
                <h2 class="text-lg font-semibold">{{ authStore.user?.name }}</h2>
                <p class="text-sm opacity-80 mb-4">{{ authStore.user?.email }}</p>
            </div>
         </div>

        <!-- Profile Info -->
        <div class="p-4 -mt-4">
            <div class="card bg-base-100 shadow">
                <div class="card-body p-0">
                <!-- Email -->
                <div class="flex items-center gap-4 p-4 border-b border-base-200">
                    <div class="bg-primary/10 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    </div>
                    <div class="flex-1">
                    <p class="text-xs text-base-content/60">Email</p>
                    <p class="font-medium">{{ authStore.user?.email }}</p>
                    </div>
                </div>

                <!-- Employee ID -->
                <div class="flex items-center gap-4 p-4">
                    <div class="bg-primary/10 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    </div>
                    <div class="flex-1">
                    <p class="text-xs text-base-content/60">Employee ID</p>
                    <p class="font-medium">{{ authStore.user?.employee_id }}</p>
                    </div>
                </div>
                </div>
            </div>

            <!-- Logout Button -->
        <button class="btn btn-error btn-outline w-full mt-6" @click="handleLogout" :disabled="isLoggingOut">
            <span v-if="isLoggingOut" class="loading loading-spinner"></span>
                <template v-else>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </template>
        </button>

            <!-- App Version -->
            <p class="text-center text-xs text-base-content/40 mt-8">Version App v1.0.0</p>
        </div>


        <!-- Bottom Navigation -->
         <BottomNavigation />
    </div>

</template>