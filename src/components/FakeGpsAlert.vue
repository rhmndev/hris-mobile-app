<script setup lang="ts">
    defineProps<{
        show: boolean
    }>()
    defineEmits<{
        (e: 'close'): void
    }>()
</script>

<template>
    <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
  <div class="card bg-base-100 shadow-2xl max-w-sm w-full border border-error">
    
    <div class="card-body p-6 text-center">
      
      <div class="flex justify-center mb-4">
        <div class="p-4 rounded-full bg-error/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>

      <h2 class="text-xl font-semibold text-error mb-3">
        Fake GPS Detected!
      </h2>

      <p class="text-base-content/70 text-sm mb-6 leading-relaxed">
        Lokasi Anda berada di luar radius absensi. Pastikan untuk mematikan fake GPS dan coba lagi.
      </p>

      <button class="btn btn-primary btn-block" @click="$emit('close')">
        Tutup
      </button>

    </div>
  </div>
</div>
</template>