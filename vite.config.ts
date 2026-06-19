import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    tailwindcss()
  ],
  server: {
    allowedHosts: [
      'ess.rahmandev.my.id'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      // Beritahu Vite bahwa modul ini ada di luar (global window)
      external: ['@mediapipe/face_mesh', '@mediapipe/camera_utils'],
    },
  },
})