<script setup lang="ts">
    import { useRouter } from 'vue-router'
    import BottomNavigation from '../components/BottomNavigation.vue'
    import { useAuthStore } from '../stores/auth'
    import { authService, userService } from '../services';
    import { onMounted, ref, reactive, computed } from 'vue';
    import type { UpdateProfileRequest } from '../services/auth/types';
    import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
    import { validateFacePhoto, type FaceValidationResult } from '../utils/faceRecognation';

    const router = useRouter();
    const authStore = useAuthStore();
    const loading = ref(false);
    const isLoggingOut = ref(false);
    const profilePhotoSource = ref<string | null>(null);
    const isEditing = ref(false);
    const isSaving = ref(false);
    const saveSuccess = ref(false);
    const saveError = ref<string | null>(null);

    // Photo upload state
    const showPhotoOptions = ref(false);
    const showPhotoPreview = ref(false);
    const pendingPhotoBase64 = ref<string | null>(null);
    const isValidatingFace = ref(false);
    const isUploadingPhoto = ref(false);
    const faceValidation = ref<FaceValidationResult | null>(null);
    const photoError = ref<string | null>(null);
    const photoSuccess = ref<string | null>(null);

    const editForm = reactive<UpdateProfileRequest>({
        name: '',
        email: '',
        phone_personal: '',
        address: '',
        date_of_birth: '',
        identity_number: '',
        bank_account_number: '',
        bank_name: '',
    });

    const user = computed(() => authStore.user);
    const empDes = computed(() => user.value?.employee_designation);

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

    const startEditing = () => {
        const u = user.value;
        editForm.name = u?.name || '';
        editForm.email = u?.email || '';
        editForm.phone_personal = u?.phone_personal || '';
        editForm.address = u?.address || '';
        editForm.date_of_birth = u?.date_of_birth ? u.date_of_birth.substring(0, 10) : '';
        editForm.identity_number = u?.identity_number || '';
        editForm.bank_account_number = u?.bank_account_number || '';
        editForm.bank_name = u?.bank_name || '';
        isEditing.value = true;
        saveSuccess.value = false;
        saveError.value = null;
    }

    const cancelEditing = () => {
        isEditing.value = false;
        saveError.value = null;
    }

    const saveProfile = async () => {
        isSaving.value = true;
        saveError.value = null;
        saveSuccess.value = false;
        try {
            const payload: UpdateProfileRequest = {};
            if (editForm.name) payload.name = editForm.name;
            if (editForm.email) payload.email = editForm.email;
            if (editForm.phone_personal !== undefined) payload.phone_personal = editForm.phone_personal;
            if (editForm.address !== undefined) payload.address = editForm.address;
            if (editForm.date_of_birth) payload.date_of_birth = editForm.date_of_birth;
            if (editForm.identity_number !== undefined) payload.identity_number = editForm.identity_number;
            if (editForm.bank_account_number !== undefined) payload.bank_account_number = editForm.bank_account_number;
            if (editForm.bank_name !== undefined) payload.bank_name = editForm.bank_name;

            const response = await userService.updateProfile(payload);
            authStore.updateUser(response.data);
            isEditing.value = false;
            saveSuccess.value = true;
            setTimeout(() => { saveSuccess.value = false; }, 3000);
        } catch (error) {
            console.error('Failed to save profile:', error);
            saveError.value = error instanceof Error ? error.message : 'Gagal menyimpan profil';
        } finally {
            isSaving.value = false;
        }
    }

    const formatTime = (time: string | null | undefined) => {
        if (!time) return '-';
        return time.substring(0, 5);
    }

    const formatDate = (date: string | null | undefined) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    const statusLabel = (status: string | null | undefined) => {
        const map: Record<string, string> = { aktif: 'Aktif', kontrak: 'Kontrak', magang: 'Magang', resign: 'Resign' };
        return map[status || ''] || status || '-';
    }

    const handleLogout = async () => {
        isLoggingOut.value = true;
        try {
            await authStore.logout();
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

    // ── Photo Upload Functions ────────────────────────────────────────────────

    const openPhotoOptions = () => {
        photoError.value = null;
        photoSuccess.value = null;
        showPhotoOptions.value = true;
    }

    const closePhotoOptions = () => {
        showPhotoOptions.value = false;
    }

    const takePhoto = async () => {
        showPhotoOptions.value = false;
        try {
            const image = await Camera.getPhoto({
                quality: 85,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Camera,
                width: 640,
                height: 640,
                correctOrientation: true,
            });
            if (image.base64String) {
                const base64 = `data:image/${image.format || 'jpeg'};base64,${image.base64String}`;
                await handlePhotoSelected(base64);
            }
        } catch (error: any) {
            // User cancelled – ignore
            if (error?.message?.toLowerCase?.().includes('cancel')) return;
            photoError.value = 'Gagal mengambil foto. Pastikan kamera tersedia.';
        }
    }

    const pickFromGallery = async () => {
        showPhotoOptions.value = false;
        try {
            const image = await Camera.getPhoto({
                quality: 85,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Photos,
                width: 640,
                height: 640,
                correctOrientation: true,
            });
            if (image.base64String) {
                const base64 = `data:image/${image.format || 'jpeg'};base64,${image.base64String}`;
                await handlePhotoSelected(base64);
            }
        } catch (error: any) {
            if (error?.message?.toLowerCase?.().includes('cancel')) return;
            photoError.value = 'Gagal memilih foto dari galeri.';
        }
    }

    const handlePhotoSelected = async (base64: string) => {
        pendingPhotoBase64.value = base64;
        faceValidation.value = null;
        photoError.value = null;
        isValidatingFace.value = true;
        showPhotoPreview.value = true;

        try {
            const result = await validateFacePhoto(base64);
            faceValidation.value = result;
        } catch (error) {
            faceValidation.value = {
                valid: false,
                message: error instanceof Error ? error.message : 'Gagal memvalidasi wajah.',
                faceCount: 0,
                confidence: 0,
            };
        } finally {
            isValidatingFace.value = false;
        }
    }

    const cancelPhotoPreview = () => {
        showPhotoPreview.value = false;
        pendingPhotoBase64.value = null;
        faceValidation.value = null;
    }

    const confirmUploadPhoto = async () => {
        if (!pendingPhotoBase64.value || !faceValidation.value?.valid) return;

        isUploadingPhoto.value = true;
        photoError.value = null;
        try {
            const res = await userService.uploadProfilePhoto(pendingPhotoBase64.value);
            authStore.updateUser(res.data);
            // Refresh the displayed photo
            await fetchProfilePhoto();
            showPhotoPreview.value = false;
            pendingPhotoBase64.value = null;
            faceValidation.value = null;
            photoSuccess.value = 'Foto profil berhasil diperbarui!';
            setTimeout(() => { photoSuccess.value = null; }, 4000);
        } catch (error) {
            photoError.value = error instanceof Error ? error.message : 'Gagal mengunggah foto profil.';
        } finally {
            isUploadingPhoto.value = false;
        }
    }
</script>

<template>
    <div class="min-h-screen bg-base-200 pb-24 pb-safe-bottom">
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
                <div class="relative mb-4">
                    <div class="avatar placeholder">
                        <div class="bg-blue-400 text-white rounded-full w-24">
                            <img v-if="profilePhotoSource" :src="profilePhotoSource" alt="Profile Photo" class="w-full h-full object-cover rounded-full">
                            <span v-else class="text-6xl font-bold flex items-center justify-center h-full">{{ user?.name?.charAt(0) }}</span>
                        </div>
                    </div>
                    <!-- Camera icon overlay -->
                    <button
                        class="absolute bottom-0 right-0 bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white active:scale-95 transition-transform"
                        @click="openPhotoOptions"
                        title="Ubah Foto Profil"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
                <h2 class="text-lg font-semibold">{{ user?.name }}</h2>
                <p class="text-sm opacity-80 mb-1">{{ user?.email }}</p>
                <span v-if="empDes?.designation" class="text-xs bg-white/20 px-3 py-1 rounded-full mt-1">
                    {{ empDes.designation.name }}
                </span>
            </div>
         </div>

        <!-- Content -->
        <div class="p-4 -mt-4 space-y-4">

            <!-- Photo Success Message -->
            <div v-if="photoSuccess" class="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{{ photoSuccess }}</span>
            </div>

            <!-- Photo Error Message -->
            <div v-if="photoError" class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{{ photoError }}</span>
            </div>

            <!-- Success Message -->
            <div v-if="saveSuccess" class="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Profil berhasil diperbarui!</span>
            </div>

            <!-- Error Message -->
            <div v-if="saveError" class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{{ saveError }}</span>
            </div>

            <!-- Employee Info Card (always visible) -->
            <div class="card bg-base-100 shadow">
                <div class="card-body p-0">
                    <!-- Employee ID -->
                    <div class="flex items-center gap-4 p-4">
                        <div class="bg-primary/10 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                        </div>
                        <div class="flex-1">
                            <p class="text-base text-base-content/60">Employee ID</p>
                            <p class="font-medium">{{ user?.employee_id || '-' }}</p>
                        </div>
                    </div>

                    <!-- Branch -->
                    <div class="flex items-center gap-4 p-4 border-t border-base-200">
                        <div class="bg-primary/10 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div class="flex-1">
                            <p class="text-base text-base-content/60">Branch</p>
                            <p class="font-medium">{{ user?.branch?.name || '-' }}</p>
                        </div>
                    </div>

                    <!-- Shift Schedule -->
                    <div class="flex items-center gap-4 p-4 border-t border-base-200">
                        <div class="bg-primary/10 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="flex-1">
                            <p class="text-base text-base-content/60">Jadwal Shift</p>
                            <p class="font-medium">
                                <template v-if="empDes?.shift">
                                    {{ empDes.shift.name }} ({{ formatTime(empDes.shift.clock_in_time) }} - {{ formatTime(empDes.shift.clock_out_time) }})
                                </template>
                                <template v-else>-</template>
                            </p>
                        </div>
                    </div>

                    <!-- Join Date -->
                    <div class="flex items-center gap-4 p-4 border-t border-base-200">
                        <div class="bg-primary/10 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div class="flex-1">
                            <p class="text-base text-base-content/60">Tanggal Bergabung</p>
                            <p class="font-medium">{{ formatDate(user?.join_date) }}</p>
                        </div>
                    </div>

                    <!-- Status -->
                    <div class="flex items-center gap-4 p-4 border-t border-base-200">
                        <div class="bg-primary/10 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="flex-1">
                            <p class="text-base text-base-content/60">Status Karyawan</p>
                            <p class="font-medium">{{ statusLabel(user?.employee_status) }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Data Diri Card -->
            <div class="card bg-base-100 shadow">
                <div class="card-body">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="card-title text-base">Data Diri</h3>
                        <button v-if="!isEditing" class="btn btn-sm btn-primary btn-outline" @click="startEditing">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                    </div>

                    <!-- Display Mode -->
                    <template v-if="!isEditing">
                        <div class="space-y-3">
                            <div>
                                <p class="text-xs text-base-content/50">Nama Lengkap</p>
                                <p class="font-medium">{{ user?.name || '-' }}</p>
                            </div>
                            <div>
                                <p class="text-xs text-base-content/50">No. KTP</p>
                                <p class="font-medium">{{ user?.identity_number || '-' }}</p>
                            </div>
                            <div>
                                <p class="text-xs text-base-content/50">Tanggal Lahir</p>
                                <p class="font-medium">{{ formatDate(user?.date_of_birth) }}</p>
                            </div>
                            <div>
                                <p class="text-xs text-base-content/50">Alamat</p>
                                <p class="font-medium">{{ user?.address || '-' }}</p>
                            </div>
                            <div>
                                <p class="text-xs text-base-content/50">No. HP Personal</p>
                                <p class="font-medium">{{ user?.phone_personal || '-' }}</p>
                            </div>
                            <div>
                                <p class="text-xs text-base-content/50">Tanggal Bergabung</p>
                                <p class="font-medium">{{ formatDate(user?.join_date) }}</p>
                            </div>
                            <div class="border-t border-base-200 pt-3">
                                <p class="text-xs text-base-content/50">Rekening Bank</p>
                                <p class="font-medium">
                                    <template v-if="user?.bank_account_number">
                                        {{ user.bank_name }} - {{ user.bank_account_number }}
                                    </template>
                                    <template v-else>-</template>
                                </p>
                            </div>
                        </div>
                    </template>

                    <!-- Edit Mode -->
                    <template v-else>
                        <div class="space-y-3">
                            <div>
                                <label class="label label-text">Nama Lengkap</label>
                                <input type="text" v-model="editForm.name" class="input input-bordered input-sm w-full" />
                            </div>
                            <div>
                                <label class="label label-text">Email</label>
                                <input type="email" v-model="editForm.email" class="input input-bordered input-sm w-full" />
                            </div>
                            <div>
                                <label class="label label-text">No. KTP</label>
                                <input type="text" v-model="editForm.identity_number" class="input input-bordered input-sm w-full" placeholder="Masukkan No. KTP" />
                            </div>
                            <div>
                                <label class="label label-text">Tanggal Lahir</label>
                                <input type="date" v-model="editForm.date_of_birth" class="input input-bordered input-sm w-full" />
                            </div>
                            <div>
                                <label class="label label-text">Alamat</label>
                                <textarea v-model="editForm.address" class="textarea textarea-bordered textarea-sm w-full" rows="2" placeholder="Masukkan alamat"></textarea>
                            </div>
                            <div>
                                <label class="label label-text">No. HP Personal</label>
                                <input type="tel" v-model="editForm.phone_personal" class="input input-bordered input-sm w-full" placeholder="Masukkan no. HP" />
                            </div>
                            <div>
                                <label class="label label-text">Nama Bank</label>
                                <input type="text" v-model="editForm.bank_name" class="input input-bordered input-sm w-full" placeholder="Contoh: BCA, Mandiri" />
                            </div>
                            <div>
                                <label class="label label-text">No. Rekening</label>
                                <input type="text" v-model="editForm.bank_account_number" class="input input-bordered input-sm w-full" placeholder="Masukkan no. rekening" />
                            </div>
                            <div class="flex gap-2 pt-2">
                                <button class="btn btn-primary btn-sm flex-1" @click="saveProfile" :disabled="isSaving">
                                    <span v-if="isSaving" class="loading loading-spinner loading-xs"></span>
                                    {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
                                </button>
                                <button class="btn btn-ghost btn-sm flex-1" @click="cancelEditing" :disabled="isSaving">
                                    Batal
                                </button>
                            </div>
                        </div>
                    </template>
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
            <p class="text-center text-xs text-base-content/40 mt-4">Version App v1.0.0</p>
        </div>

        <!-- Photo Options Modal -->
        <Teleport to="body">
            <div v-if="showPhotoOptions" class="fixed inset-0 z-50 flex items-end justify-center bg-black/50" @click.self="closePhotoOptions">
                <div class="bg-base-100 w-full rounded-t-3xl p-6 animate-slide-up">
                    <div class="w-12 h-1 bg-base-300 rounded-full mx-auto mb-5"></div>
                    <h3 class="text-lg font-semibold mb-1 text-center">Ubah Foto Profil</h3>
                    <p class="text-sm text-base-content/60 text-center mb-6">
                        Foto ini akan digunakan sebagai referensi pengenalan wajah untuk absensi.
                    </p>
                    <div class="space-y-3">
                        <button
                            class="btn btn-primary w-full justify-start gap-3"
                            @click="takePhoto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Ambil Foto
                        </button>
                        <button
                            class="btn btn-outline w-full justify-start gap-3"
                            @click="pickFromGallery"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Pilih dari Galeri
                        </button>
                        <button
                            class="btn btn-ghost w-full text-base-content/60"
                            @click="closePhotoOptions"
                        >
                            Batal
                        </button>
                    </div>
                    <!-- Tips -->
                    <div class="mt-5 p-3 bg-info/10 rounded-xl">
                        <p class="text-xs text-info font-semibold mb-1">Tips Upload Foto</p>
                        <ul class="text-xs text-base-content/70 space-y-0.5 list-disc list-inside">
                            <li>Pastikan hanya ada satu wajah dalam foto</li>
                            <li>Pencahayaan cukup, wajah menghadap kamera</li>
                            <li>Hindari foto blur atau terlalu gelap</li>
                            <li>Kelayakan foto akan divalidasi otomatis dengan AI</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Photo Preview & Validation Modal -->
        <Teleport to="body">
            <div v-if="showPhotoPreview" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div class="bg-base-100 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
                    <!-- Photo Preview -->
                    <div class="bg-base-200 flex items-center justify-center" style="min-height: 280px;">
                        <img
                            v-if="pendingPhotoBase64"
                            :src="pendingPhotoBase64"
                            alt="Preview"
                            class="w-full h-72 object-cover"
                        />
                    </div>

                    <!-- Validation Result -->
                    <div class="p-5 space-y-4">
                        <h3 class="font-semibold text-center">Validasi Foto</h3>

                        <!-- Loading state -->
                        <div v-if="isValidatingFace" class="flex flex-col items-center gap-2 py-2">
                            <span class="loading loading-spinner loading-md text-primary"></span>
                            <p class="text-sm text-base-content/60">Memvalidasi wajah dengan AI...</p>
                        </div>

                        <!-- Validation Result -->
                        <template v-else-if="faceValidation">
                            <!-- Valid -->
                            <div v-if="faceValidation.valid" class="alert alert-success py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <p class="text-sm font-medium">Wajah Terdeteksi</p>
                                    <p class="text-xs opacity-80">Kepercayaan: {{ Math.round(faceValidation.confidence * 100) }}%</p>
                                </div>
                            </div>

                            <!-- Invalid -->
                            <div v-else class="alert alert-warning py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <p class="text-sm">{{ faceValidation.message }}</p>
                            </div>
                        </template>

                        <!-- Actions -->
                        <div class="flex gap-2">
                            <button
                                class="btn btn-primary flex-1"
                                @click="confirmUploadPhoto"
                                :disabled="!faceValidation?.valid || isUploadingPhoto"
                            >
                                <span v-if="isUploadingPhoto" class="loading loading-spinner loading-xs"></span>
                                {{ isUploadingPhoto ? 'Uploading...' : 'Upload Foto' }}
                            </button>
                            <button
                                class="btn btn-ghost flex-1"
                                @click="cancelPhotoPreview"
                                :disabled="isUploadingPhoto"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Bottom Navigation -->
         <BottomNavigation />
    </div>

</template>
<style>
 .pb-safe-bottom {
    padding-bottom: calc(4rem + env(safe-area-inset-bottom, 16px));
 }

 @keyframes slide-up {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
 }
 .animate-slide-up {
    animation: slide-up 0.25s ease-out;
 }
</style>
