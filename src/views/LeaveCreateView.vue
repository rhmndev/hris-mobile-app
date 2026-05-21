<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router';
import { leaveService, attendanceService, type LeaveType } from '../services';
// import { sub } from '@tensorflow/tfjs-core';

const router = useRouter()
const MAX_ATTACHEMENT_SIZE_BYTES = 2 * 1024 * 1024 

const submitting = ref(false)
const error = ref<string | null>(null)
const attachmentFile = ref<File | null>(null)
const showDialog = ref(false)
const dialogConfig = ref<{
  title: string
  message: string
  type: 'error' | 'warning' | 'success'
  canProceed: boolean
}>({
  title: '',
  message: '',
  type: 'error',
  canProceed: false
})

const existingLeaveRequests = ref<any[]>([])
const todayAttendance = ref<any>(null)
const validationErrors = ref<string[]>([])

const todayDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const form = ref<{
    type: LeaveType,
    startDate: string,
    endDate: string,
    reason: string
}>({
    type: 'cuti_tahunan',
    startDate: '',
    endDate: '',
    reason: ''
})

// Load initial data
const loadInitialData = async () => {
    try {
        const [leaveRes, attendanceRes] = await Promise.all([
            leaveService.getLeaveRequests(),
            attendanceService.getToday()
        ])
        existingLeaveRequests.value = leaveRes.data || []
        todayAttendance.value = attendanceRes.data
    } catch (err) {
        console.error('Error loading data:', err)
    }
}

// Check overlap dengan kehadiran hari ini
const checkAttendanceOverlap = (startDate: string, endDate: string): boolean => {
    if (!todayAttendance.value || !todayAttendance.value.check_in) {
        return false
    }
    
    const today = todayDate.value
    const start = new Date(startDate)
    const end = new Date(endDate)
    const todayDateObj = new Date(today)
    
    return start <= todayDateObj && todayDateObj <= end
}

// Check overlap dengan pengajuan cuti sebelumnya
const checkLeaveOverlap = (startDate: string, endDate: string): { overlaps: any[], hasConflict: boolean } => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const overlappingLeaves = existingLeaveRequests.value.filter(leave => {
        const leaveStart = new Date(leave.start_date)
        const leaveEnd = new Date(leave.end_date)
        
        // Cek apakah ada overlap (termasuk tanggal yang sama)
        return !(end < leaveStart || start > leaveEnd)
    }).filter(leave => leave.status !== 'rejected') // Abaikan yang sudah rejected
    
    return {
        overlaps: overlappingLeaves,
        hasConflict: overlappingLeaves.length > 0
    }
}

// Validasi tanggal
const validateDates = (): string[] => {
    const errors: string[] = []
    
    if (!form.value.startDate || !form.value.endDate) {
        return errors
    }
    
    const start = new Date(form.value.startDate)
    const end = new Date(form.value.endDate)
    const today = new Date(todayDate.value)
    
    if (start > end) {
        errors.push('Tanggal mulai harus lebih awal dari tanggal selesai')
    }
    
    if (start < today) {
        errors.push('Tanggal mulai tidak boleh di masa lalu')
    }
    
    return errors
}

// Watch untuk real-time validation
watch([() => form.value.startDate, () => form.value.endDate], () => {
    validationErrors.value = validateDates()
}, { deep: true })

const leaveTypes: Array<{ value: LeaveType; label: string; helper: string}> = [
    {value: 'cuti_tahunan', label: 'Cuti Tahunan', helper: 'Gunakan untuk pengajuan cuti tahunan yang terencana'},
    {value: 'cuti_sakit', label: 'Cuti Sakit', helper: 'Gunakan bila tidak dapat bekerja karena kondisi kesehatan'}
]

const selectedTypeMeta = computed(() => {
    return leaveTypes.find((item) => item.value === form.value.type) ?? leaveTypes[0]!
})

const handleAttachmentChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0] ?? null

    if (file && file.size > MAX_ATTACHEMENT_SIZE_BYTES) {
        attachmentFile.value = null
        error.value = 'Ukuran file terlalu besar. Maksimal 2 MB.'
        target.value = ''
        return
    }

    error.value = null
    attachmentFile.value = file

}

const submitLeaveRequest = async () => {
    error.value = null

    // Basic validation
    if (!form.value.startDate || !form.value.endDate || !form.value.reason) {
        error.value = 'Semua field harus diisi'
        return
    }

    // Date validation
    const dateErrors = validateDates()
    if (dateErrors.length > 0) {
        error.value = dateErrors[0]
        return
    }

    if (attachmentFile.value && attachmentFile.value.size > MAX_ATTACHEMENT_SIZE_BYTES) {
        error.value = 'Ukuran file terlalu besar. Maksimal 2 MB.'
        return
    }

    // Check for conflicts
    const hasAttendanceConflict = checkAttendanceOverlap(form.value.startDate, form.value.endDate)
    const leaveOverlapResult = checkLeaveOverlap(form.value.startDate, form.value.endDate)

    if (hasAttendanceConflict || leaveOverlapResult.hasConflict) {
        // Show dialog with conflict details
        let message = ''
        if (hasAttendanceConflict) {
            message += 'Permintaan tumpang tindih dengan Kehadiran hari ini.\n\n'
        }
        if (leaveOverlapResult.hasConflict) {
            message += 'Permintaan tumpang tindih dengan pengajuan cuti sebelumnya:\n'
            leaveOverlapResult.overlaps.forEach(leave => {
                const startDate = new Date(leave.start_date).toLocaleDateString('id-ID')
                const endDate = new Date(leave.end_date).toLocaleDateString('id-ID')
                message += `  • ${leave.type} (${startDate} - ${endDate})\n`
            })
            message += '\n'
        }

        message += 'Apakah Anda yakin ingin melanjutkan pengajuan?'

        showDialog.value = true
        dialogConfig.value = {
            title: 'Peringatan: Tumpang Tindih Ditemukan',
            message: message,
            type: 'warning',
            canProceed: true
        }
        return
    }

    await proceedSubmit()
}

// Proceed submit setelah konfirmasi dialog
const proceedSubmit = async () => {
    submitting.value = true
    showDialog.value = false

    try {
        const response = await leaveService.createLeaveRequest({
            type: form.value.type,
            start_date: form.value.startDate,
            end_date: form.value.endDate,
            reason: form.value.reason.trim(),
            attachment: attachmentFile.value,
        })
        
        dialogConfig.value = {
            title: 'Sukses!',
            message: response.message || 'Pengajuan cuti berhasil dikirim. Silakan tunggu persetujuan dari manager.',
            type: 'success',
            canProceed: false
        }
        showDialog.value = true

        // Redirect setelah 2 detik
        setTimeout(() => {
            router.push({
                path: '/leave',
                query: {success: response.message}
            })
        }, 2000)
    } catch (err: any) {
        console.error(err)
        dialogConfig.value = {
            title: 'Gagal',
            message: err.response?.data?.message || 'Gagal mengajukan cuti. Silakan coba lagi.',
            type: 'error',
            canProceed: false
        }
        showDialog.value = true
    } finally {
        submitting.value = false
    }
}

const goBack = () => {
    router.push('/leave')
}

// Load data on component mount
loadInitialData()

</script>

<template>
    <div class="min-h-screen bg-base-200 pb-8">

        <!-- Header -->
        <div class="bg-primary px-4 pt-12 pb-6 text-primary-content">
            <div class="mx-auto max-w-lg">
                <div class="flex items-center gap-4">
                    <button class="btn btn-ghost btn-circle" @click="goBack">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 class="text-xl font-semibold">Ajukan Cuti</h1>
                        <p class="text-sm opacity-80">Isi form pengajuan cuti</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content -->
         <div class="px-4 pt-4">
            <div class="mx-auto max-w-lg">
                <div v-if="error" class="alert alert-error mb-4 shadow-sm">
                    <span>{{error}}</span>
                </div>

                <!-- Validation Errors -->
                <div v-if="validationErrors.length > 0" class="mb-4 space-y-2">
                    <div v-for="(err, idx) in validationErrors" :key="idx" class="alert alert-warning shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0-6a4 4 0 00-4 4m8 0a4 4 0 01-4 4m0-12a4 4 0 014 4m-8 0a4 4 0 00-4 4" />
                        </svg>
                        <span>{{err}}</span>
                    </div>
                </div>

                <div class="card bg-base-100">
                    <div class="card-body p-5 space-y-4">
                        <div class="grid grid-cols-2 gap-2">
                            <button 
                                v-for="type in leaveTypes"
                                :key="type.value"
                                type="button"
                                class="btn btn-sm h-auto min-h-0 py-3"
                                :class="form.type === type.value ? 'btn-primary' : 'btn-ghost border border-base-300'"
                                @click="form.type = type.value">
                                {{ type.label }}
                            </button>
                        </div>

                        <p class="text-sm text-base-content/60">{{ selectedTypeMeta.helper }}</p>

                        <!-- Tanggal -->
                        <div class="grid grid-cols-2 gap-3">
                            <label for="" class="form-control">
                                <span class="label-text mb-2 block text-base-content/70">
                                    Tanggal Mulai
                                </span>
                                <input type="date" class="input input-bordered w-full" v-model="form.startDate" :min="todayDate">
                            </label>
                            <label for="" class="form-control">
                                <span class="label-text mb-2 block text-base-content/70">
                                    Tanggal Selesai
                                </span>
                                <input type="date" class="input input-bordered w-full" v-model="form.endDate" :min="todayDate">
                            </label>
                        </div>

                        <!-- Alasan -->
                        <label for="" class="form-control">
                            <span class="label-text mb-2 block text-base-content/70">Alasan</span>
                            <textarea 
                                v-model="form.reason" 
                                rows="5"
                                class="textarea textarea-bordered"
                                placeholder="Tulis alasan pengajuan">

                            </textarea>
                        </label>

                        <!-- Upload gambar -->
                        <label for="" class="form-control">
                            <span class="label-text mb-2 block text-base-content/70">Upload Gambar (optional)</span>
                            <input 
                                type="file" 
                                accept=".jpg, .jpeg, .png, .pdf"
                                class="file-input file-input-bordered w-full"
                                @change="handleAttachmentChange"
                                />
                            <span class="mt-2 text-xs text-base-content/50">Format: JPG, JPEG, PNG, PDF. Maksimal 2 MB</span>
                           
                        </label>

                        <!-- Button -->
                         <button 
                            class="btn btn-primary w-full"
                            :disabled="submitting || validationErrors.length > 0"
                            @click="submitLeaveRequest"
                        >{{ submitting ? 'Mengirim...' : 'Ajukan Cuti' }}</button>
                    </div>
                </div>
            </div>
         </div>

        <!-- Dialog Modal -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div class="modal modal-open">
                <div class="modal-box w-full max-w-sm">
                    <div class="flex items-start gap-3">
                        <div v-if="dialogConfig.type === 'error'" class="text-error text-2xl">⚠️</div>
                        <div v-else-if="dialogConfig.type === 'warning'" class="text-warning text-2xl">⚠️</div>
                        <div v-else class="text-success text-2xl">✓</div>
                        
                        <div class="flex-1">
                            <h3 class="font-bold text-lg mb-2">{{ dialogConfig.title }}</h3>
                            <p class="text-sm whitespace-pre-wrap text-base-content/80">{{ dialogConfig.message }}</p>
                        </div>
                    </div>

                    <div class="modal-action mt-6 gap-2">
                        <button 
                            class="btn btn-ghost btn-sm"
                            @click="showDialog = false"
                            :disabled="submitting">
                            {{ dialogConfig.canProceed ? 'Batal' : 'Tutup' }}
                        </button>
                        <button 
                            v-if="dialogConfig.canProceed"
                            class="btn btn-primary btn-sm"
                            @click="proceedSubmit"
                            :disabled="submitting">
                            {{ submitting ? 'Mengirim...' : 'Lanjutkan' }}
                        </button>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop" @click.prevent></form>
            </div>
        </div>
    </div>
</template>