<script setup lang="ts">
import { onMounted, ref} from 'vue'
import { useRoute, useRouter } from 'vue-router';
import BottomNavigation from '../components/BottomNavigation.vue';
import { leaveService, type LeaveRequestItem, type LeaveStatus, type LeaveType } from '../services';

const DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
})

const STATUS_META: Record<LeaveStatus, {label: string, className: string}> = {
    pending: { label: 'Menunggu', className: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Disetujui', className: 'bg-green-100 text-green-800' },
    rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-800' },
}

const TYPE_ACCENT_CLASS: Record<LeaveType, string> = {
    cuti_tahunan: 'bg-base-200 text-base-content/70',
    cuti_sakit: 'bg-green-100 text-green-800',
}

const route = useRoute();
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const leaveRequests = ref<LeaveRequestItem[]>([])
const previewAttachment = ref<{url: string; isPdf: boolean} | null>(null)

const fetchLeaveRequest = async () => {
    loading.value = true
    error.value = null

    try {
        const response = await leaveService.getLeaveRequests()
        leaveRequests.value = response.data
    } catch (err) {
        console.log('Fetch leave request error', err)
        error.value = 'Gagal memuat data cuti. Silakan coba lagi.'
    } finally {
        loading.value = false
    }
}

const deleteLeaveRequest = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengajuan cuti ini?')) {
        return
    }

    try {
        await leaveService.deleteLeaveRequest(id)
        await fetchLeaveRequest()
        success.value = 'Pengajuan cuti berhasil dihapus.'
    } catch(err) {
        error.value = 'Gagal menghapus pengajuan cuti. Silakan coba lagi.'
    }
}

const openCreatePage = () => {
    router.push('/leave/create')
}

const clearSuccess = () => {
    success.value = null
    if (route.query.success) {
        router.replace({path: 'leave'})
    }
}

const formatDate = (value: string | null) => {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return DATE_FORMATTER.format(date)
}

const formatRange = (item: LeaveRequestItem) => {
  if (item.start_date === item.end_date) return formatDate(item.start_date)
  return `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`
}

const statusMeta = (status: LeaveStatus) => STATUS_META[status]
const typeAccentClass = (type: LeaveType) => TYPE_ACCENT_CLASS[type]

const isPdfAttachment = (url: string) => {
  const normalizedUrl = url.split('?')[0]?.toLowerCase() ?? ''
  return normalizedUrl.endsWith('.pdf')
}

const openAttachmentPreview = (url: string) => {
  previewAttachment.value = {
    url,
    isPdf: isPdfAttachment(url),
  }
}

const closeAttachmentPreview = () => {
  previewAttachment.value = null
}



onMounted(() => {
    const successMessage = route.query.success

    if (typeof successMessage === 'string') {
        success.value = successMessage
    }
    fetchLeaveRequest()
})

</script>

<template>
    <div class="min-h-screen bg-base-200 pb-safe-bottom">
        <!-- Header -->
        <div class="bg-primary px-4 pt-12 pb-6 text-primary-content">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <h1 class="text-xl font-semibold">Daftar Cuti</h1>
                    <p class="mt-1 text-sm opacity-80">Pengajuan Cuti Anda</p>
                </div>
                <button class="btn btn-sm bg-base-100 text-base-content border-0" @click="openCreatePage">Ajukan Cuti</button>
            </div>
        </div>
        <!-- Content -->
        <div class="p-4 space-y-4">
            <!-- error state -->
            <div v-if="error" class="alert alert-error shadow-sm">
                <span>{{ error }}</span>
            </div>

            <!-- success state -->
            <div v-if="success" class="alert alert-success shadow-sm">
                <span>{{ success }}</span>
                <button class="ml-auto text-sm font-medium" @click="clearSuccess">Tutup</button>
            </div>

            <!-- refresh state -->
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="font-semibold text-base-content">Riwayat Pengajuan</h2>
                    <p class="text-xs text-base-content">{{ leaveRequests.length }} pengajuan</p>
                </div>
                <button class="btn btn-sm btn-gosht" @click="fetchLeaveRequest">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>

                </button>
            </div>

             <!-- loading spinner -->
            <div v-if="loading"
             class="flex justify-center py-10">
                <span class="loading loading-spinner loading-lg text-primary"></span>
            </div>

            <!-- empty state -->
            <div v-else-if="leaveRequests.length === 0"
             class="card bg-base-100 shadow">
                <div class="card-body items-center py-8 text-center text-sm text-base-content">
                    Belum ada pengajuan cuti
                </div>
            </div>

            <!-- list of leave request -->
                   <div v-else class="space-y-3">
            <div
                v-for="item in leaveRequests"
                :key="item.id"
                class="overflow-hidden rounded-[22px] border border-base-300/70 bg-base-100 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                >
                <div class="h-1.5 w-full bg-base-300"></div>
                <div class="p-4">
                    <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <div class="mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" :class="typeAccentClass(item.type)">
                        {{ item.type_label }}
                        </div>
                        <p class="text-lg font-semibold leading-tight text-base-content">{{ item.type_label }}</p>
                        <p class="mt-1 text-sm leading-6 text-base-content/60">{{ formatRange(item) }}</p>
                        <p class="text-sm font-medium text-base-content/70">{{ item.total_days }} hari</p>
                    </div>
                    <span
                        class="inline-flex shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1"
                        :class="statusMeta(item.status).className"
                    >
                        {{ statusMeta(item.status).label }}
                    </span>
                    </div>

                    <div class="mt-4 rounded-2xl bg-base-200/70 px-4 py-3">
                    <p class="text-xs font-medium uppercase tracking-wide text-base-content/50">Alasan</p>
                    <p class="mt-1 text-sm leading-6 text-base-content/80">{{ item.reason }}</p>
                    </div>

                    <div class="mt-4 flex flex-wrap gap-2 text-xs">
                    <span class="inline-flex items-center rounded-2xl border border-base-300 bg-base-100 px-3 py-2 font-medium text-base-content/70 shadow-sm">
                        Dibuat {{ formatDate(item.created_at) }}
                    </span>
                    <span
                        v-if="item.reviewed_by_name"
                        class="inline-flex items-center rounded-2xl border border-base-300 bg-base-100 px-3 py-2 font-medium text-base-content/70 shadow-sm"
                    >
                        Reviewer: {{ item.reviewed_by_name }}
                    </span>
                    </div>

                    <div v-if="item.review_notes" class="mt-3 rounded-2xl border border-base-300 bg-base-200 px-4 py-3">
                    <p class="text-xs font-medium uppercase tracking-wide text-base-content/50">Catatan Review</p>
                    <p class="mt-1 text-sm leading-6 text-base-content/80">{{ item.review_notes }}</p>
                    </div>
                    <div class="flex gap-2 mt-4">
                        <button
                            v-if="item.attachment_url"
                            type="button"
                            class="inline-flex items-center text-sm font-medium text-base-content/80"
                            @click="openAttachmentPreview(item.attachment_url)"
                            >
                            Lihat lampiran
                            <svg xmlns="http://www.w3.org/2000/svg" class="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button 
                            v-if="item.status === 'pending'"
                            type="button"
                            class="inline-flex items-center text-sm font-medium text-error ml-2"
                            @click="deleteLeaveRequest(item.id)"
                        >
                            Hapus
                        </button>
                    </div>

                   
                </div>
            </div>
            </div>
        </div>

        <!-- Image Preview Modal -->
        <div
            v-if="previewAttachment"
            class="fixed inset-0 z-[70] bg-black/70 p-4"
            @click.self="closeAttachmentPreview"
            >
            <div class="mx-auto flex h-full w-full max-w-4xl items-center justify-center">
                <div class="flex h-[85vh] w-full flex-col overflow-hidden rounded-[28px] bg-base-100 shadow-2xl">
                <div class="flex items-center justify-between border-b border-base-300 px-4 py-3">
                    <div>
                    <h3 class="font-semibold text-base-content">Lampiran</h3>
                    <p class="text-xs text-base-content/60">
                        {{ previewAttachment?.isPdf ? 'Preview PDF di popup.' : 'Preview gambar di popup.' }}
                    </p>
                    </div>
                    <div class="flex items-center gap-2">
                    <a
                        :href="previewAttachment?.url"
                        target="_blank"
                        rel="noreferrer"
                        class="btn btn-sm btn-ghost"
                    >
                        Buka
                    </a>
                    <button type="button" class="btn btn-sm btn-ghost btn-circle" @click="closeAttachmentPreview">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    </div>
                </div>

                <div class="flex-1 overflow-auto bg-base-200 p-4">
                    <div
                    v-if="previewAttachment?.isPdf"
                    class="mx-auto h-full overflow-auto rounded-2xl bg-base-100 shadow-sm"
                    >
                    <iframe
                        :src="previewAttachment?.url"
                        class="h-full w-full border-0"
                    ></iframe>
                    </div>

                    <div v-else class="flex min-h-full items-center justify-center overflow-auto rounded-2xl bg-base-100 p-4 shadow-sm">
                    <img
                        :src="previewAttachment?.url"
                        alt="Lampiran leave"
                        class="max-h-full max-w-full object-contain"
                    />
                    </div>
                </div>
                </div>
            </div>
        </div>


    <BottomNavigation />
    </div>
</template>
<style scoped>
    .pb-safe-bottom {
        padding-bottom: calc(4rem + env(safe-area-inset-bottom, 16px));
    }
</style>