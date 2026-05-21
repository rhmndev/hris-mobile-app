<script setup lang="ts">
    import { ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { useAuthStore } from '../stores/auth';

    const router = useRouter();
    const authStore = useAuthStore();

    const email = ref('');
    const password = ref('');
    const showPassword = ref(false);
    const localError = ref<string | null>(null);
    const isLoading = ref(false);

    const handleLogin = async () => {
        localError.value = null;

        if (!email.value || !password.value) {
            localError.value = 'Email dan Password harus diisi';

            return;
        }
        isLoading.value = true;
        const result = await authStore.login(email.value, password.value);

        if (result.success) {
            isLoading.value = false;
            router.push('/home');
        } else {
            isLoading.value = false;
            localError.value = result.message || 'Login gagal. Silahkan coba lagi.';
        }
    }


</script>

<template>
    <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div class="card w-full max-w-sm bg-base-100 shadow-xl">
            <div class="card-body flex flex-col items-center">
                <h2 class="text-2xl font-bold text-center">Employee Self Service</h2>
                <p class="text-center text-base-content/60 mb-4">Silahkan masuk dengan akun milik Anda</p>

                <img src="../assets/images/logo_primary.png" alt="Login" class="w-full mb-6" />

                <form @submit.prevent="handleLogin" class="w-full">
                    <!-- Email -->
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Email</legend>
                        <input 
                            v-model="email" 
                            type="email" 
                            placeholder="namakamu@email.com" 
                            class="input w-full" 
                            required
                        />
                    </fieldset>

                    <!-- Password -->
                    <fieldset class="fieldset mt-4">
                        <legend class="fieldset-legend">Password</legend>
                        <div class="join w-full">
                            <input 
                                v-model="password" 
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="Masukan Password Anda" 
                                class="input join-item flex-1" 
                                required
                            />

                            <button 
                                type="button" 
                                class="btn join-item" 
                                @click="showPassword = !showPassword">
                                {{ showPassword ? 'Hide' : 'Show' }}
                            </button>
                        </div>
                    </fieldset>

                    <!-- Error Message -->
                    <div v-if="localError || authStore.error" class="alert alert-error mt-4">
                        <div>
                            <span>{{ localError }}</span>
                        </div>
                    </div>

                    <!-- Login Button -->
                    <div class="mt-6">
                        <button type="submit" class="btn btn-primary w-full" :disabled="authStore.isLoading">
                            <span v-if="authStore.isLoading" class="loading loading-spinner loading-sm"></span>
                            {{ isLoading ? 'Memproses....' : 'Login' }}
                        </button>
                    </div>

                </form>

            </div>

        </div>

    </div>
</template>