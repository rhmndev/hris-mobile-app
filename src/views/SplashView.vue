<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { DotLottieVue } from '@lottiefiles/dotlottie-vue';
import { SplashScreen } from '@capacitor/splash-screen';
import playPauseAnim from '../assets/Phone_Apps.json';

const router = useRouter();
const isVisible = ref(true);
const authStore = useAuthStore();

onMounted(async () => {
    try {
        await SplashScreen.hide();
    } catch (e) {
        console.warn('Capacitor tidak terdeteksi (Running on Browser)');
    }

    if (authStore.token) {
        await authStore.initAuth();
    }

    setTimeout(() => {
        isVisible.value = false; 
        
        setTimeout(() => {
            if (authStore.isAuthenticated) {
                router.push('/home');
            } else {
                router.push('/login');
            }
        }, 100);
    }, 5000);
});
</script>

<template>
    <div 
        class="min-h-screen bg-base-100 flex flex-col items-center justify-center transition-opacity duration-100" 
        :class="{ 'opacity-0': !isVisible}"
    >
        <!-- Lottie Animation Center -->
        <DotLottieVue
            style="height: 220px; width: 220px;"
            autoplay
            loop
            :data="playPauseAnim"
        />

        <h1 class="text-3xl font-bold text-primary mt-6">DCCI HRIS</h1>
        <span class="loading loading-rings loading-lg mt-4 text-primary"></span>

            <!-- App Version -->
            <p class="text-center text-xs text-base-content/40 mt-8">Version App v1.0.0</p>
    </div>

            
</template>