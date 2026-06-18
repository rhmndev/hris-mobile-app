import * as faceapi from 'face-api.js'

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights'
const DEFAULT_THRESHOLD = 0.55

let modelsLoaded = false
let modelsLoadingPromise: Promise<void> | null = null

function normalizeImageSource(source: string): string {
  if (source.startsWith('data:') || source.startsWith('http') || source.startsWith('blob:')) {
    return source
  }
  if (source.startsWith('base64,')) {
    return `data:image/jpeg;${source}`
  }
  return `data:image/jpeg;base64,${source}`
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Gagal memuat gambar untuk verifikasi wajah.'))
    img.src = normalizeImageSource(source)
  })
}

export async function ensureFaceModelsLoaded(): Promise<void> {
  if (modelsLoaded) return
  if (!modelsLoadingPromise) {
    modelsLoadingPromise = Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).then(() => {
      modelsLoaded = true
    })
  }
  await modelsLoadingPromise
}

async function getDescriptor(source: string): Promise<Float32Array | null> {
  const img = await loadImage(source)
  const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
  if (!detection) return null
  return detection.descriptor
}

export interface FaceValidationResult {
  valid: boolean
  message: string
  faceCount: number
  confidence: number
}

/**
 * Validates a photo for use as a profile face recognition reference.
 * Checks:
 *  - Exactly one face is detected
 *  - Detection confidence is above threshold (0.5)
 */
export async function validateFacePhoto(
  source: string,
  minConfidence: number = 0.5
): Promise<FaceValidationResult> {
  await ensureFaceModelsLoaded()

  const img = await loadImage(source)

  // Detect ALL faces (not just single) to count them
  const detections = await faceapi.detectAllFaces(img).withFaceLandmarks()

  const faceCount = detections.length

  if (faceCount === 0) {
    return { valid: false, message: 'Tidak ada wajah terdeteksi. Pastikan wajah Anda terlihat jelas.', faceCount, confidence: 0 }
  }

  if (faceCount > 1) {
    return { valid: false, message: 'Terdeteksi lebih dari satu wajah. Pastikan hanya ada satu orang dalam foto.', faceCount, confidence: 0 }
  }

  // Single face – check confidence score
  const score = detections[0].detection.score
  if (score < minConfidence) {
    return {
      valid: false,
      message: `Kualitas deteksi wajah terlalu rendah (${Math.round(score * 100)}%). Pastikan pencahayaan cukup dan wajah menghadap kamera.`,
      faceCount,
      confidence: score,
    }
  }

  return {
    valid: true,
    message: 'Foto valid untuk digunakan sebagai referensi wajah.',
    faceCount,
    confidence: score,
  }
}

export async function compareFaceImages(
  capturedBase64: string,
  profileSource: string,
  threshold: number = DEFAULT_THRESHOLD
): Promise<{ match: boolean; distance?: number }> {
  await ensureFaceModelsLoaded()

  const [capturedDesc, profileDesc] = await Promise.all([
    getDescriptor(capturedBase64),
    getDescriptor(profileSource),
  ])

  if (!capturedDesc || !profileDesc) {
    return { match: false }
  }

  const distance = faceapi.euclideanDistance(capturedDesc, profileDesc)
  return { match: distance <= threshold, distance }
}