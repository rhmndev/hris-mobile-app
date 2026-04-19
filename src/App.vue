<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'


</script>

<template>
  <h1 class="text-3xl font-bold text-red-500 text-center mt-10">
    Alhamdulillah Sudah Running
  </h1>
  <h3 class="text-lg text-gray-600 text-center mt-4">
    Selamat Datang di Aplikasi Vue.js
  </h3>

  <div class="card card-side bg-base-100 shadow-sm">
  <figure>
    <img
      src="https://img.daisyui.com/images/stock/photo-1635805737707-575885ab0820.webp"
      alt="Movie" />
  </figure>
  <div class="card-body">
    <h2 class="card-title">New movie is released!</h2>
    <p>Click the button to watch on Jetflix app.</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Watch</button>
    </div>
  </div>
</div>

<div class="card bg-neutral text-neutral-content w-96">
  <div class="card-body items-center text-center">
    <h2 class="card-title">Cookies!</h2>
    <p>We are using cookies for no reason.</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Accept</button>
      <button class="btn btn-ghost">Deny</button>
    </div>
  </div>
</div>
</template>