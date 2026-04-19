<script setup lang="ts">
    import { useRouter, useRoute } from 'vue-router'

    const router = useRouter()
    const route = useRoute()

    const navItems = [
         {
            name: 'home',
            path: '/home',
            label: 'Home',
            icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
        },
        {
            name: 'report',
            path: '/report',
            label: 'Report',
            icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        },
        {
            name: 'profile',
            path: '/profile',
            label: 'Profile',
            icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
        }
    ]

    const isActive = (path: string) => route.path == path

    const navigateTo = (path: string) => {
        router.push(path)
    }

</script>

<template>
    <div class="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 shadow-lg">
        <div class="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
            <button 
                v-for="item in navItems"
                :key="item.name"
                class="flex flex-col items-center justify-center flex-1 py-2"
                :class="isActive(item.path) ? 'text-primary' : 'text-base-content/60'"
                @click="navigateTo(item.path)"
            >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        class="h-6 w-6" 
                        :fill="isActive(item.path) ? 'currentColor' : 'none'" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
                </svg>
                <span class="text-xs mt-1 font-medium">{{ item.label }}</span>
            </button>
            
        </div>
        <div class="h-safe-bottom bg-bas-100"></div>
    </div>
</template>