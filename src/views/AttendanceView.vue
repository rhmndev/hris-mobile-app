<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {  Geolocation } from '@capacitor/geolocation';
import { attendanceService, type Attendance } from '../services';

const router = useRouter()

// Mockup state
const todayAttendance = ref<Attendance | null>(null)
const loading = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const currentTime = ref(new Date())
const photoBase64 = ref<string | null>(null)
const location = ref<{ latitude: number; longitude: number } | null>(null)

// Update time every second
setInterval(() => {
  currentTime.value = new Date()
}, 1000)

const formattedTime = computed(() => {
  const hours = currentTime.value.getHours().toString().padStart(2, '0')
  const minutes = currentTime.value.getMinutes().toString().padStart(2, '0')
  const seconds = currentTime.value.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
})

const formattedDate = computed(() => {
  return currentTime.value.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const hasCheckedIn = computed(() => !!todayAttendance.value?.check_in_time)

const canSubmit = computed(() => {
  return photoBase64.value && location.value && !submitting.value
})

const fetchTodayAttendance = async () => {
  loading.value = true
  try {
    const res = await attendanceService.getToday()
    todayAttendance.value = res.data
  } catch (err) {
    console.error('Failed to fetch today attendance:', err)
  } finally {
    loading.value = false
  }
}

const getCurrentLocation = async () => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    })
    location.value = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }
    console.log('Current location:', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    })
  } catch (error) {
    console.error('Failed to get current location:', error)
    location.value = null
  }
}

const takePhoto = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'user'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const result = reader.result
          const base64String = result.includes(',') ? result.split(',')[1] : result
          photoBase64.value = base64String
        }
      }
        reader.readAsDataURL(file)
    }
  }
  input.click()
}

const handleCheckIn = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  error.value = null
  success.value = null

  try {
    const res = await attendanceService.checkIn({
      photo: photoBase64.value!,
      latitude: location.value!.latitude,
      longitude: location.value!.longitude,
    })

    success.value = res.message || 'Check-in berhasil!'
    todayAttendance.value = res.data
    photoBase64.value = null

    setTimeout(() => {
      router.push('/home');
    }, 2000);

  } catch (err) {
    console.error('Failed to check in:', err)
    error.value = 'Gagal melakukan check-in, silahkan dicoba lagi.'
  } finally {
    submitting.value = false
  }
}

const handleCheckOut = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  error.value = null
  success.value = null

  try {
    const res = await attendanceService.checkOut({
      photo: photoBase64.value!,
      latitude: location.value!.latitude,
      longitude: location.value!.longitude,
    })

    success.value = res.message || 'Check-out berhasil!'
    todayAttendance.value = res.data
    photoBase64.value = null

  } catch (err) {
    console.error('Failed to check out:', err)
    error.value = 'Gagal melakukan check-out, silahkan dicoba lagi.'
  }
    setTimeout(() => {
      router.push('/home');
    }, 2000);
  }

const goBack = () => router.push('/home')

onMounted (() => {
  fetchTodayAttendance()
  getCurrentLocation()
})
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Header -->
    <div class="bg-primary text-primary-content pt-12 px-4 pb-6">
      <div class="flex items-center gap-4 mb-4">
        <button class="btn btn-ghost btn-circle" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-xl font-semibold">{{ hasCheckedIn ? 'Check Out' : 'Check In' }}</h1>
      </div>

      <!-- Time Display -->
      <div class="text-center">
        <p class="text-5xl font-bold tabular-nums">{{ formattedTime }}</p>
        <p class="text-sm opacity-80 mt-2">{{ formattedDate }}</p>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Check In/Out Form -->
      <div v-else class="space-y-4">
        <!-- Location Status -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4">
            <div class="flex items-center gap-3">
              <div class="p-3 rounded-full" :class="location ? 'bg-success/10' : 'bg-warning/10'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" :class="location ? 'text-success' : 'text-warning'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="font-medium">Lokasi</p>
                <p v-if="location" class="text-sm text-base-content/60">
                  {{ location.latitude.toFixed(6) }}, {{ location.longitude.toFixed(6) }}
                </p>
                <p v-else class="text-sm text-base-content/60">Mendapatkan lokasi...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Photo Section -->
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4">
            <p class="font-medium mb-3">Foto Selfie</p>

            <!-- Photo Preview -->
            <div v-if="photoBase64" class="relative aspect-4/3 rounded-lg overflow-hidden bg-base-200">
              <img
                :src="`data:image/jpeg;base64,${photoBase64}`"
                alt="Selfie"
                class="w-full h-full object-cover"
              />
              <button class="btn btn-circle btn-sm btn-error absolute top-2 right-2" @click="photoBase64 = null">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Take Photo Button -->
            <button v-else class="btn btn-outline btn-primary w-full h-32" @click="takePhoto">
              <div class="flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Ambil Foto</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Error Alert -->
        <div v-if="error" class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- Success Alert -->
        <div v-if="success" class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ success }}</span>
        </div>

        <!-- Submit Button -->
        <button
          v-if="!hasCheckedIn"
          class="btn btn-primary btn-lg w-full"
          :disabled="!canSubmit"
          @click="handleCheckIn"
        >
          <span v-if="submitting" class="loading loading-spinner"></span>
          {{ submitting ? 'Memproses...' : 'Check In' }}
        </button>

        <button
          v-else
          class="btn btn-secondary btn-lg w-full"
          :disabled="!canSubmit"
          @click="handleCheckOut"
        >
          <span v-if="submitting" class="loading loading-spinner"></span>
          {{ submitting ? 'Memproses...' : 'Check Out' }}
        </button>
      </div>
    </div>
  </div>
</template>
