<script setup lang="ts">
    import { onMounted, ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { useAuthStore} from '../stores/auth';

    const router = useRouter();
    const isVisible = ref(true);
    const authStore = useAuthStore();

    onMounted(async () => {
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
            }, 300);
        }, 2000);
    });
</script>

<template>
    <div class="min-h-screen bg-base-100 flex flex-col items-center justify-center transition-opacity duration-300" :class="{ 'opacity-0': !isVisible}">

        <h1 class="text-3xl font-bold text-primary">DCCI HRIS</h1>
        <p class="text-base-content/60 mt-2">HRIS System</p>
        <span class="loading loading-rings loading-lg mt-4 text-primary"></span>
    </div>

</template>