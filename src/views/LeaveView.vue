<script setup lang='ts'>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BottomNavigation from '../components/BottomNavigation.vue';
import { leaveService, type LeaveRequestItem, type LeaveStatus, type LeaveType } from '../services';


const DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
})

const STATUS_META: Record<LeaveStatus, {label: string, color: string}> = {
    pending: {label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800'},
    approved: {label: 'Disetujui', color: 'bg-green-100 text-green-800'},
    rejected: {label: 'Ditolak', color: 'bg-red-100 text-red-800'},
}

const TYPE_ACCENT_CLASS: Record<LeaveType, string> = {
    cuti_tahunan: 'bg-base-200 text-base-content/70',
    cuti_sakit: 'bg-green-100 text-green-800',
}

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const leaveRequests = ref<LeaveRequestItem[]>([]);
const previewAttachmenmt = ref<{url: string; isPdf: boolean} | null>(null);

const fetchLeaveRequest = async () => {
    loading.value = true;
    error.value = null;

    try {
        const response = await leaveService.getLeaveRequests();
        leaveRequests.value = response.data;
    } catch (err) {
        console.log('Failed to fetch leave requests:', err);
        error.value = 'Gagal memuat data cuti, Silahkan dicoba lagi.';
    } finally {
        loading.value = false;
    }
}

</script>

<template>
    <div class="min-h-screen bg-base-200 pb-safe-bottom">
        <!-- header -->
        <div class="bg-primary px-4 pt-12 pb-6 text-primary-content">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <h1 class="text-xl font-semibold">Daftar Cuti</h1>
                    <p class="mt-1 text-sm opacity-80">Pengajuan Cuti Anda</p>
                </div>
                <button class="btn btn-sm bg-base-100 text-base-content border-0">Ajukan Cuti</button>
            </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-4">
            <!-- Error State -->
            <div v-if="error" class="alert alert-error shadow-sm">
                <span>{{ error }}</span>
            </div>

            <!-- Success State -->
            <div v-if="success" class="alert alert-error shadow-sm">
                <span>{{ success }}</span>
            </div>

            <!-- Refresh State -->
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="font-semi-bold text-base-content">Riwayat Pengajuan</h2>
                    <p class="text-xs text-base-content">{{ leaveRequests.length }} pengajuan</p>
                </div>
                <div class="btn btn-sm btn-ghost">Refresh Otak</div>
            </div>
            <!-- loading spinner -->
             <div class="flex justify-center py-10">
                <span class="loading loading-spinner loading-lg text-primary"></span>
             </div>

        </div>

            

        
    </div>
</template>