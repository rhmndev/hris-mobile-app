import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      // Beritahu Vite bahwa modul ini ada di luar (global window)
      external: ['@mediapipe/face_mesh', '@mediapipe/camera_utils'],
    },
  },
})
