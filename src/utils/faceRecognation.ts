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