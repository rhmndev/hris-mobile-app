<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
// import { FaceMesh } from '@mediapipe/face_mesh'
// import { Camera } from '@mediapipe/camera_utils'

type FaceMesh = any;
type Camera = any;


const emit = defineEmits<{
  (e: 'success', photoBase64: string): void
  (e: 'cancel'): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

type Step = 'instruction' | 'align' | 'blink' | 'left' | 'right' | 'finalize' | 'success' | 'failed'
const step = ref<Step>('instruction')

const instruction = ref('Siapkan wajah Anda di dalam frame')
const countdown = ref(20)

const blinkCount = ref(0)
const requiredBlinks = 2

// Hard lock: head turn only after blink done
const blinkDone = computed(() => blinkCount.value >= requiredBlinks)

// Blink strict state
const bothEyesClosed = ref(false)
const closedSince = ref<number | null>(null)
const lastBlinkAt = ref(0)

// baseline
const baselineRatio = ref<number | null>(null)
const baselineSamples = ref<number[]>([])
const baselineReady = computed(() => baselineRatio.value !== null)

// gating step
const stepEnteredAt = ref<number>(0)
const holdFrames = ref(0)

let faceMesh: FaceMesh | null = null
let camera: Camera | null = null
let countdownTick: number | null = null

type Landmark = { x: number; y: number; z?: number }
type Results = { multiFaceLandmarks?: Landmark[][] }

const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y)

const LEFT_EYE = { p1: 33, p2: 160, p3: 158, p4: 133, p5: 153, p6: 144 }
const RIGHT_EYE = { p1: 362, p2: 385, p3: 387, p4: 263, p5: 373, p6: 380 }

function ear(lm: Landmark[], eye: typeof LEFT_EYE): number {
  const p1 = lm[eye.p1]
  const p2 = lm[eye.p2]
  const p3 = lm[eye.p3]
  const p4 = lm[eye.p4]
  const p5 = lm[eye.p5]
  const p6 = lm[eye.p6]

  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return NaN

  const vertical = dist(p2, p6) + dist(p3, p5)
  const horizontal = dist(p1, p4)
  if (horizontal <= 1e-6) return NaN

  return vertical / (2 * horizontal)
}


function headTurnRatio(lm: Landmark[]): number | null {
  const nose = lm[1]
  const leftCheek = lm[234]
  const rightCheek = lm[454]
  if (!nose || !leftCheek || !rightCheek) return null
  const a = nose.x - leftCheek.x
  const b = rightCheek.x - nose.x
  if (b <= 0.0001) return null
  return a / b
}

function median(nums: number[]) {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

function stopLoops() {
  if (countdownTick) {
    clearInterval(countdownTick)
    countdownTick = null
  }
}

function startCountdown(seconds: number) {
  countdown.value = seconds
  if (countdownTick) clearInterval(countdownTick)
  countdownTick = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      // Untuk step finalize, jika waktu habis tetap capture photo
      if (step.value === 'finalize') {
        onSuccess()
      } else {
        onFailed('Waktu habis. Silakan coba lagi.')
      }
    }
  }, 1000)
}

function enterStep(next: Step, text: string, seconds: number) {
  step.value = next
  instruction.value = text
  stepEnteredAt.value = Date.now()
  holdFrames.value = 0
  startCountdown(seconds)
}

function resetAll(keepCamera = true) {
  stopLoops()
  step.value = 'instruction'
  instruction.value = 'Siapkan wajah Anda di dalam frame'
  countdown.value = 20

  blinkCount.value = 0
  bothEyesClosed.value = false
  closedSince.value = null
  lastBlinkAt.value = 0

  baselineRatio.value = null
  baselineSamples.value = []

  stepEnteredAt.value = Date.now()
  holdFrames.value = 0

  if (!keepCamera) stopCamera()
}

// async function initFaceMesh() {
//   faceMesh = new FaceMesh({
//     locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
//   })
//   faceMesh.setOptions({
//     maxNumFaces: 1,
//     refineLandmarks: true,
//     minDetectionConfidence: 0.7,
//     minTrackingConfidence: 0.7,
//   })
//   faceMesh.onResults(onResults as any)
// }

// async function startCamera() {
//   if (!videoRef.value) return
//   camera = new Camera(videoRef.value, {
//     onFrame: async () => {
//       if (!faceMesh || !videoRef.value) return
//       await faceMesh.send({ image: videoRef.value })
//     },
//     width: 640,
//     height: 480,
//   })
//   await camera.start()
// }

async function initFaceMesh() {
    const MPFaceMesh = (window as any).FaceMesh;
  
  if (!MPFaceMesh) {
    console.error("Library MediaPipe belum termuat!");
    return;
  }

  // Buat instance tanpa lewat import
  faceMesh = new MPFaceMesh({
    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  })
  faceMesh.onResults(onResults as any)
}


async function startCamera() {
  if (!videoRef.value) return;

  const MPCamera = (window as any).Camera;
  if (!MPCamera) return;

  // Inisialisasi instance ke variabel camera
  camera = new MPCamera(videoRef.value, {
    onFrame: async () => {
      // Tambahkan check 'faceMesh' di sini agar tidak error saat processing frame
      if (faceMesh) {
        await faceMesh.send({ image: videoRef.value! });
      }
    },
    width: 640,
    height: 480,
  });

  // --- FIX ERROR 'camera' is possibly 'null' ---
  if (camera) {
    await camera.start();
  }
}


function stopCamera() {
  try { camera?.stop() } catch {}
  camera = null
}

function startVerification() {
  enterStep('align', 'Posisikan wajah lurus (netral) di dalam frame', 20)
}

function retry() {
  resetAll(true)
}

function cancel() {
  resetAll(false)
  emit('cancel')
}

// function capturePhoto(): string {
//   if (!videoRef.value || !canvasRef.value) return ''
//   const video = videoRef.value
//   const canvas = canvasRef.value
//   const ctx = canvas.getContext('2d')
//   if (!ctx) return ''

//   const w = video.videoWidth || 640
//   const h = video.videoHeight || 480
//   canvas.width = w
//   canvas.height = h

//   ctx.save()
//   ctx.translate(w, 0)
//   ctx.scale(-1, 1)
//   ctx.drawImage(video, 0, 0, w, h)
//   ctx.restore()

//   const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
//   return dataUrl.split(',')[1] || ''
// }

function capturePhoto(): string {
  if (!videoRef.value || !canvasRef.value) return ''

  const video = videoRef.value
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const w = video.videoWidth || 640
  const h = video.videoHeight || 480

  canvas.width = w
  canvas.height = h

  const ellipseWidth = w * 0.5
  const ellipseHeight = ellipseWidth * (80 / 64)

  const centerX = w / 2
  const centerY = h / 2

  ctx.save()
  ctx.translate(w, 0)
  ctx.scale(-1, 1)

  ctx.beginPath()
  ctx.ellipse(centerX, centerY, ellipseWidth / 2, ellipseHeight / 2, 0, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(video, 0, 0, w, h)

  ctx.restore()

  const dataUrl = canvas.toDataURL('image/png')
  return dataUrl.split(',')[1] || ''
}

function onSuccess() {
  stopLoops()
  step.value = 'success'
  instruction.value = 'Verifikasi berhasil!'
  const photoBase64 = capturePhoto()
  setTimeout(() => {
    stopCamera()
    emit('success', photoBase64)
  }, 800)
}

function onFailed(msg: string) {
  stopLoops()
  step.value = 'failed'
  instruction.value = msg
}

/**
 * MAIN
 */
function onResults(results: Results) {
  if (!['align', 'blink', 'left', 'right', 'finalize'].includes(step.value)) return

  const faces = results.multiFaceLandmarks
  if (!faces || faces.length === 0) {
    // wajah hilang -> reset hold supaya ga false trigger
    holdFrames.value = 0
    bothEyesClosed.value = false
    closedSince.value = null
    return
  }

  const lm = faces[0]
  if (!lm || lm.length < 455) return

  // ========= ALIGN (baseline)
  if (step.value === 'align') {
    const ratio = headTurnRatio(lm)
    if (ratio === null) return

    // baseline hanya diambil kalau wajah "cukup netral" (stabil)
    baselineSamples.value.push(ratio)
    if (baselineSamples.value.length > 24) baselineSamples.value.shift()

    if (baselineSamples.value.length >= 18) {
      baselineRatio.value = median(baselineSamples.value)

      // lanjut blink
      blinkCount.value = 0
      bothEyesClosed.value = false
      closedSince.value = null
      lastBlinkAt.value = 0

      enterStep('blink', `Kedipkan mata ${requiredBlinks} kali`, 20)
    }
    return
  }

  // ========= BLINK (STRICT)
  if (step.value === 'blink') {
    const leftEAR = ear(lm, LEFT_EYE)
    const rightEAR = ear(lm, RIGHT_EYE)

    // thresholds strict (tuning)
    const CLOSED_T = 0.19
    const OPEN_T = 0.24

    const now = Date.now()
    const isClosedNow = leftEAR < CLOSED_T && rightEAR < CLOSED_T
    const isOpenNow = leftEAR > OPEN_T && rightEAR > OPEN_T

    // require closed hold >= 120ms (anti false blink dari motion blur)
    if (isClosedNow && !bothEyesClosed.value) {
      bothEyesClosed.value = true
      closedSince.value = now
      return
    }

    if (bothEyesClosed.value) {
      // kalau sudah closed, tunggu sampai reopen
      if (isOpenNow && closedSince.value !== null) {
        const closedDuration = now - closedSince.value
        bothEyesClosed.value = false
        closedSince.value = null

        // strict: minimal durasi mata tertutup
        if (closedDuration < 120) return

        // debounce antar blink
        if (now - lastBlinkAt.value < 500) return

        lastBlinkAt.value = now
        blinkCount.value++

        instruction.value = blinkCount.value >= requiredBlinks
          ? 'Bagus! Lanjut putar kepala...'
          : `Bagus! Kedipkan lagi (${blinkCount.value}/${requiredBlinks})`

        if (blinkDone.value) {
          setTimeout(() => enterStep('left', 'Sekarang PUTAR kepala ke KIRI', 15), 700)
        }
      }
    }

    return
  }

  // ========= HEAD TURN (ONLY if blink done)
  if (!blinkDone.value) return
  if (!baselineReady.value) return

  const ratio = headTurnRatio(lm)
  if (ratio === null) return

  const base = baselineRatio.value ?? ratio
  const delta = ratio - base

  // gating: jangan validasi terlalu cepat
  if (Date.now() - stepEnteredAt.value < 900) return

  const TURN_DELTA = 0.27 // stricter
  const LEFT_OK = delta <= -TURN_DELTA
  const RIGHT_OK = delta >= TURN_DELTA

  if (step.value === 'left') {
    if (LEFT_OK) {
      holdFrames.value++
      if (holdFrames.value >= 3) {
        setTimeout(() => enterStep('right', 'Mantap! Sekarang PUTAR kepala ke KANAN', 15), 600)
      }
    } else {
      holdFrames.value = 0
    }
    return
  }

  if (step.value === 'right') {
    if (RIGHT_OK) {
      holdFrames.value++
      if (holdFrames.value >= 3) {
        // Masuk ke step finalize untuk memberi waktu user meluruskan kepala
        enterStep('finalize', 'Luruskan kepala Anda kembali ke posisi netral', 5)
      }
    } else {
      holdFrames.value = 0
    }
    return
  }

  // ========= FINALIZE (wait for head to return to neutral)
  if (step.value === 'finalize') {
    if (!baselineReady.value) {
      // Fallback jika baseline tidak ready
      setTimeout(() => onSuccess(), 2000)
      return
    }

    const ratio = headTurnRatio(lm)
    if (ratio === null) return

    const base = baselineRatio.value ?? ratio
    const delta = Math.abs(ratio - base)

    // Cek apakah kepala sudah kembali ke posisi netral (delta kecil)
    const NEUTRAL_THRESHOLD = 0.15
    if (delta < NEUTRAL_THRESHOLD) {
      holdFrames.value++
      if (holdFrames.value >= 5) {
        // Kepala sudah lurus, tunggu sebentar lalu capture
        setTimeout(() => onSuccess(), 500)
      }
    } else {
      holdFrames.value = 0
    }
    return
  }
}

onMounted(async () => {
  resetAll(true)
  await initFaceMesh()
  await startCamera()
})

onUnmounted(() => {
  stopLoops()
  stopCamera()
  faceMesh = null
})
</script>

<template>
  <div class="fixed inset-0 bg-black z-[9999] flex flex-col">
    <div class="bg-black/80 text-white p-4 flex items-center justify-between">
      <button class="btn btn-ghost btn-circle text-white" @click="cancel">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <h2 class="text-lg font-semibold">Verifikasi Wajah</h2>
      <div class="w-12"></div>
    </div>

    <div class="flex-1 relative overflow-hidden bg-black">
      <!-- Video full screen untuk processing (tetap full untuk face detection) -->
      <video 
        ref="videoRef" 
        class="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
        autoplay 
        playsinline 
        muted
      ></video>
      <canvas ref="canvasRef" class="hidden"></canvas>

      <!-- Overlay hitam dengan hole elips di tengah (sesuai dengan border w-64 h-80) -->
      <div 
        class="absolute inset-0 pointer-events-none"
        style="background: radial-gradient(ellipse 128px 160px at 50% 50%, transparent 0%, transparent 98%, rgba(0,0,0,0.98) 99%, rgba(0,0,0,0.98) 100%);"
      ></div>

      <!-- Border overlay -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          class="w-64 h-80 border-4 rounded-full pointer-events-none z-10"
          :class="{
            'border-white/50': step === 'instruction' || step === 'align',
            'border-yellow-400 animate-pulse': step === 'blink' || step === 'left' || step === 'right',
            'border-blue-400 animate-pulse': step === 'finalize',
            'border-green-500': step === 'success',
            'border-red-500': step === 'failed'
          }"
        ></div>
      </div>

      <div v-if="step === 'align' || step === 'blink' || step === 'left' || step === 'right' || step === 'finalize'"
        class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="bg-black/70 px-6 py-4 rounded-2xl text-white text-xl font-bold text-center">
          <div v-if="step === 'align'">LURUSKAN WAJAH (NETRAL)</div>
          <div v-else-if="step === 'blink'">KEDIPKAN MATA</div>
          <div v-else-if="step === 'left'">PUTAR KE KIRI</div>
          <div v-else-if="step === 'right'">PUTAR KE KANAN</div>
          <div v-else-if="step === 'finalize'">LURUSKAN KEPALA KEMBALI</div>
          <div class="text-white/70 text-sm font-normal mt-2">Pastikan wajah tetap di dalam frame</div>
        </div>
      </div>

      <div v-if="step !== 'instruction' && step !== 'success' && step !== 'failed'"
        class="absolute top-4 right-4 bg-black/60 text-white px-4 py-2 rounded-full">
        <span class="text-2xl font-bold">{{ countdown }}s</span>
      </div>

      <div v-if="step === 'blink'" class="absolute top-4 left-4 bg-black/60 text-white px-4 py-2 rounded-full">
        <span class="text-lg">👁️ {{ blinkCount }}/{{ requiredBlinks }}</span>
      </div>
    </div>

    <div class="bg-black/80 text-white p-6">
      <p class="text-center text-lg mb-4">{{ instruction }}</p>

      <div class="flex justify-center gap-4">
        <button v-if="step === 'instruction'" class="btn btn-primary btn-lg" @click="startVerification">
          Mulai Verifikasi
        </button>

        <div v-else-if="step === 'align' || step === 'blink' || step === 'left' || step === 'right' || step === 'finalize'"
          class="flex items-center gap-2">
          <span class="loading loading-dots loading-lg text-primary"></span>
          <span>
            {{
              step === 'align' ? 'Mendeteksi wajah...' :
              step === 'blink' ? 'Mendeteksi kedipan...' :
              step === 'left' ? 'Mendeteksi putar kiri...' :
              step === 'right' ? 'Mendeteksi putar kanan...' :
              'Menunggu kepala lurus...'
            }}
          </span>
        </div>

        <div v-else-if="step === 'success'" class="flex items-center gap-2 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-lg font-semibold">Berhasil!</span>
        </div>

        <div v-else-if="step === 'failed'" class="flex gap-3">
          <button class="btn btn-warning btn-lg" @click="retry">Coba Lagi</button>
          <button class="btn btn-ghost btn-lg text-white" @click="cancel">Tutup</button>
        </div>
      </div>

      <p class="text-center text-white/70 text-sm mt-4">
        Tips: pencahayaan cukup, wajah menghadap kamera, dan jangan gerak cepat saat kedip.
      </p>
    </div>
  </div>
</template>