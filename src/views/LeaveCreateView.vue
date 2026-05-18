<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router';
import { leaveService, type LeaveType } from '../services';
// import { sub } from '@tensorflow/tfjs-core';

const router = useRouter()
const MAX_ATTACHEMENT_SIZE_BYTES = 2 * 1024 * 1024 

const submitting = ref(false)
const error = ref<string | null>(null)
const attachmentFile = ref<File | null>(null)

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

    if (!form.value.startDate || !form.value.endDate || !form.value.reason) {
        error.value = 'Semua field harus diisi'
        return
    }

    if (attachmentFile.value && attachmentFile.value.size > MAX_ATTACHEMENT_SIZE_BYTES) {
        error.value = 'Ukuran file terlalu besar. Maksimal 2 MB.'
        return
    }

    submitting.value = true

    try {
        const response = await leaveService.createLeaveRequest({
            type: form.value.type,
            start_date: form.value.startDate,
            end_date: form.value.endDate,
            reason: form.value.reason.trim(),
            attachment: attachmentFile.value,
        })
        router.push({
            path: '/leave',
            query: {success: response.message}
        })
    } catch (err) {
        console.log(err)
        error.value = 'Gagal mengajukan cuti. Silakan coba lagi.'
    } finally {
        submitting.value = false
    }
}

const goBack = () => {
    router.push('/leave')
}
</script>

<template>
    <div class="min-h-screen bg-base-200 pb-8">

        <!-- Header -->
        <div class="bg-primary px-4 pt-12 pb-6 text-primary-content">
            <div class="mx-auto max-w-lg">
                <div class="flex items-center gap-4">
                    <button class="btn btn-gosht btn-circle" @click="goBack">
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

                <div class="card bg-base-100">
                    <div class="card-body p-5 space-y-4">
                        <div class="grid grid-cols-2 g">
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
                                <input type="date" class="input input-bordered w-full" v-model="form.startDate">
                            </label>
                             <label for="" class="form-control">
                                <span class="label-text mb-2 block text-base-content/70">
                                    Tanggal Selesai
                                </span>
                                <input type="date" class="input input-bordered w-full" v-model="form.endDate">
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
                            :disabled="submitting"
                            @click="submitLeaveRequest"
                        >Ajukan Cuti</button>
                    </div>
                </div>
            </div>
         </div>
    </div>
</template>