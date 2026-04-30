<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {  Geolocation } from '@capacitor/geolocation';
import { attendanceService, companyService, userService, type Attendance, type Company } from '../services';
import LivenessDetection from '../components/LivenessDetection.vue';
import MapPreview from '../components/MapPreview.vue';
import {MockLocation} from '@dewakoding/capacitor-mock-location';
import FakeGpsAlert from '../components/FakeGpsAlert.vue';
import {compareFaceImages} from '../utils/faceRecognation';

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
const company = ref<Company | null>(null);
const profilePhotoSource = ref<string | null>(null);
const faceVerificationStatus = ref<'idle' | 'checking' | 'verified' | 'failed'>('idle');
const faceVerificationError = ref<string | null>(null);
const profilePhotoMissingMessage = 'Foto profile tidak ditemukan, silahkan upload foto profile terlebih dahulu untuk melakukan presensi.';
let timer: any = null


const showLivenessDetection = ref(false);
const showFakeGpsAlert = ref(false);

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

//calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000; // Radius of the Earth in meters

  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a = 
  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *  Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// isWithinRadius
const isWithinRadius = computed(() => {
  if (!location.value || !company.value) return false

  const companyLat = parseFloat(company.value.latitude);
  const companyLon = parseFloat(company.value.longitude);
  const radius = company.value.radius;

  const distance = calculateDistance(
    location.value.latitude,
    location.value.longitude,
    companyLat,
    companyLon
  )

  return distance <= radius;
})

// canTakePhoto
const canTakePhoto = computed(() => {
  return isWithinRadius.value && location.value != null;
})

const canSubmit = computed(() => {
  return !!photoBase64.value && !!location.value && !submitting.value && !error.value && faceVerificationStatus.value === 'verified';
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

const fetchCompany = async () => {
  try {
    const res = await companyService.getCompany();
    company.value = res.data;
  } catch (error) {
    console.error('Failed to fetch company data:', error);
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

const resetFaceVerification = () => {
  faceVerificationStatus.value = 'idle';
  faceVerificationError.value = null;
  error.value = null;
  success.value = null;
};

const verifyFaceMatch = async (selfieBase64: string) => {
  console.log('>>>', 'Starting face verification...')
  resetFaceVerification();
  faceVerificationStatus.value = 'checking';
  if (!profilePhotoSource.value) {
    faceVerificationStatus.value = 'failed';
    faceVerificationError.value = profilePhotoMissingMessage;
    return;
  }
  try {
    const result = await compareFaceImages(profilePhotoSource.value, selfieBase64);
    if (!result.match) {
      console.log('>>>', 'Face verification failed. Face does not match.');
      faceVerificationStatus.value = 'failed';
      faceVerificationError.value = "Verifikasi wajah gagal. Wajah tidak sesuai dengan foto profil Anda.";
      error.value = faceVerificationError.value;
      return
    } 

    faceVerificationStatus.value = 'verified';
    if (error.value === profilePhotoMissingMessage) {
      error.value = null;
    }

    success.value = 'Verifikasi wajah berhasil. Wajah sesuai dengan foto profil Anda.';
    console.log('>>>', 'Face verification successful: Face matched.');
  } catch (errorMessage) {
    console.error('Error during face verification:', errorMessage);
    faceVerificationStatus.value = 'failed';
    faceVerificationError.value = "Terjadi kesalahan saat memverifikasi wajah. Silakan coba lagi.";
    error.value = faceVerificationError.value;
  }
}

const checkFakeGps = async (): Promise<boolean> => {
  try {
     const { isMock } = await MockLocation.checkMockLocation()

  if (isMock) {
    showFakeGpsAlert.value = true;
    return true;
  } 
    return false

  } catch (error) {
    console.error('Error checking fake GPS: ', error);
    return false;
  }
} 


const getCurrentLocation = async () => {
  const isFakeGps = await checkFakeGps();

  if (isFakeGps) {
    location.value = null;
    return;
  }

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

const openLivenessDetection = async () => {
  if (!canTakePhoto.value) {
    error.value = 'Anda tidak dapat melakukan presensi karena berada di luar radius perusahaan.';
    return;
  }

  showLivenessDetection.value = true;
};

const onLivenessSuccess = async (photo : string) => {
  photoBase64.value = photo;
  showLivenessDetection.value = false;
  await verifyFaceMatch(photo);
}


const onLivenessCancel = () => {
  showLivenessDetection.value = false;
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
    error.value = 'Gagal melakukan check-out, silahkan dicoba lagi atau Anda sudah Check In'
  }
    setTimeout(() => {
      router.push('/home');
    }, 3000);
  }

const goBack = () => router.push('/home')

const handleFakeGpsAlertClose = async () => {
  showFakeGpsAlert.value = false;
 
  const isFakeGps = await checkFakeGps();
  if (!isFakeGps) {
     await getCurrentLocation();
  }
}

onMounted (() => {
  fetchTodayAttendance()
  getCurrentLocation()
  fetchCompany()
  fetchProfilePhoto()
  timer = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);


})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    console.log("Interval jam berhasil dihentikan.");
  }
});

watch(location, () => {
  if (location.value && company.value) {
    const companyLat = parseFloat(company.value.latitude);
    const companyLon = parseFloat(company.value.longitude);
    const radius = company.value.radius;
    const distance = calculateDistance(
      location.value.latitude,
      location.value.longitude,
      companyLat,
      companyLon
    );

    if (distance > radius) {
      error.value = 'Anda berada di luar radius absensi. Lokasi anda terletak di ' + location.value.latitude.toFixed(6) + ', ' + location.value.longitude.toFixed(6);
    } else {
      error.value = null;
    }
  }
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

            <div class="mt-3">
              <MapPreview 
              v-if="location"
              :company-latitude="company ? parseFloat(company.latitude) : null"
              :company-longitude="company ? parseFloat(company.longitude) : null"
              :company-radius="company ? company.radius : 200"
              :latitude="location.latitude"
              :longitude="location.longitude"
              :height="'250px'"/>
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
            <button
              v-else 
              class="btn btn-outline btn-primary w-full h-32" 
              @click="openLivenessDetection" :class="{ 'btn btn-disabled opacity-50': !canTakePhoto }">
              <div class="flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Ambil Foto</span>
              </div>
            </button>
            <div class="alert alert-warning" v-if="location && !isWithinRadius && company">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Anda berada di luar radius absensi. Lokasi anda terletak di {{ location.latitude.toFixed(6) }}, {{ location.longitude.toFixed(6) }}</span>
            </div>
            
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
          <span v-if="submitting" class="loading loading-spinner" ></span>
          {{ submitting ? 'Memproses...' : 'Check Out' }}
        </button>
      </div>
    </div>
    
    <LivenessDetection
      v-if="showLivenessDetection"
      class="z-[100]" 
      @success="onLivenessSuccess"
      @cancel="onLivenessCancel"
    />

    <FakeGpsAlert
      v-if="showFakeGpsAlert"
      :show="showFakeGpsAlert"
      @close="handleFakeGpsAlertClose"/>


  </div>
</template>