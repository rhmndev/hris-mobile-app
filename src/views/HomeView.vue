<script setup lang="ts">
    import { computed, ref, onMounted, onUnmounted } from 'vue';
    import { useRouter } from 'vue-router';
    import AttendanceCard from '../components/AttendanceCard.vue';
    import BottomNavigation from '../components/BottomNavigation.vue';
    import { useAuthStore } from '../stores/auth';
    import { attendanceService, type Attendance } from '../services';
    import { API_ORIGIN } from '../services/https';
    
    

    const router = useRouter();
    const authStore = useAuthStore();

    const todayAttendance = ref<Attendance | null>(null);
    const attendanceHistory = ref<Attendance []>([]);
    const loading = ref(true);
    const currentTime = ref(new Date());
    let isMounted = false
    let timeInterval: number | null = null

    const buildImageUrl = (path: string | null): string => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${API_ORIGIN}/storage/${path}`;
    }

    const checkInPhotoUrl = computed(() => {
        return buildImageUrl(todayAttendance.value?.check_in_photo || null);
    })

    const checkOutPhotoUrl = computed(() => {
        return buildImageUrl(todayAttendance.value?.check_out_photo || null);
    })

    const formatDate = computed(() => {
        return currentTime.value.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year:  'numeric'
        })
    })

    const formatTime = (timeString: string | null): string => {
        if (!timeString) return '--:--';
        
       try {
            const date = new Date(timeString);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
       } catch {
            const timeMatch = timeString.match(/(\d{2}):(\d{2}):\d{2}/);
            if (timeMatch) {
                return `${timeMatch[1]}:${timeMatch[2]}`;
            }
       }
       return '--:--';
    }

    const checkInTime = computed(() => {
        if (todayAttendance.value?.check_in_time) {
            return formatTime(todayAttendance.value.check_in_time);
        }
        return '--:--';
    });

    const checkOutTime = computed(() => {
        if (todayAttendance.value?.check_out_time) {
            return formatTime(todayAttendance.value.check_out_time);
        }
        return '--:--';
    });

    const hasCheckedIn = computed(() => {
        return !!todayAttendance.value?.check_in_time
    })

    const hasCheckedOut = computed(() => {
        return !!todayAttendance.value?.check_out_time
    })

    const recentAttendance = computed(() => {
        if (!Array.isArray(attendanceHistory.value)) {
            return [];
        }
        return attendanceHistory.value.slice(0,5);
    })

    const fetchData = async () => {
    loading.value = true;

    try {
        const [todayRes, historyRes] = await Promise.all([
            attendanceService.getToday(),
            attendanceService.getHistory()
        ]);

        if (!isMounted) return;

        todayAttendance.value = todayRes.data;
        attendanceHistory.value = historyRes.data;

    } catch (error) {
        console.error('Error fetching attendance data:', error);

        if (!isMounted) return;

        todayAttendance.value = null;
        attendanceHistory.value = [];

    } finally {
        if (isMounted) {
            loading.value = false;
        }
    }
};
    const goToAttendance = () => {
        router.push('/attendance')
    }

    onMounted(() => {
        isMounted = true;
        fetchData();
        // timeInterval = window.setInterval(() => {
        //     if (isMounted) {
        //         currentTime.value = new Date();
        //     }
        // }, 1000);
     
        // const refreshInterval = window.setInterval(() => {
        //     if (isMounted) {
        //         fetchData();
        //     }
        // }, 30000);
        // (globalThis as any).attendanceRefreshInterval = refreshInterval;
    })

    onUnmounted(() => {
        isMounted = false;
        if (timeInterval !== null) {
            clearInterval(timeInterval);
            timeInterval = null;
        }
        // Clear refresh interval
        if ((globalThis as any).attendanceRefreshInterval) {
            clearInterval((globalThis as any).attendanceRefreshInterval);
        }
    })
</script>

<template>
    <div class="min-h-screen bg-base-200 pb-24 pb-safe-bottom" >
        <!-- Header Section -->
        <div class="bg-primary text-primary-content pt-12 pb-6 px-4 rounded-b-3xl">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div>
                        <p class="font-semibold text-lg">{{ authStore.user?.name || "User"}}</p>
                        <p class="font-semibold text-sm">{{ authStore.user?.role || "Role"}}</p>
                    </div>
                </div>
                <div class="text-right">
                    <!-- <p class="text-sm font-mendium">Hari ini</p> -->
                    <p class="text-base font-medium">Hari ini</p>
                    <p class="text-sm font-medium">{{ formatDate }}</p>
                </div> 

            </div>
            <p class="text-sm mb-3 opacity-90">Kehadiran Hari ini</p>

             <!-- Time Card Section -->
        <div class="card bg-base-100 text-base-content shadow-lg">
            <div class="card-body p-4">
                <!-- Check In dan Check Out Time  -->
                <div class="grid grid-cols-2 gap-6 mb-4">
                    <!-- Check In Column -->
                    <div class="text-center">
                        <p class="text-sm text-base-content/60 mb-2">Check In</p>
                        <p class="text-3xl font-bold text-primary mb-3">{{ checkInTime }}</p>
                        <div class="flex items-center justify-center">
                            <img v-if="checkInPhotoUrl" :src="checkInPhotoUrl" alt="Check In Photo" class="w-20 h-20 object-cover rounded-full border-2 border-primary">
                            <div v-else class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                                <span class="text-xs text-gray-500">No Photo</span>
                            </div>
                        </div>
                    </div>
                    <!-- Check Out Column -->
                    <div class="text-center">
                        <p class="text-sm text-base-content/60 mb-2">Check Out</p>
                        <p class="text-3xl font-bold text-primary mb-3">{{ checkOutTime }}</p>
                        <div class="flex items-center justify-center">
                            <img v-if="checkOutPhotoUrl" :src="checkOutPhotoUrl" alt="Check Out Photo" class="w-20 h-20 object-cover rounded-full border-2 border-success">
                            <div v-else class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                                <span class="text-xs text-gray-500">No Photo</span>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Button Section -->
                <button 
                v-if="!hasCheckedIn"    
                class="btn btn-success btn-lg w-full" 
                @click="goToAttendance">
                    Check In
                </button>
                <button 
                v-else
                class="btn btn-secondary btn-lg w-full"
                @click="goToAttendance" 
                :disabled="hasCheckedOut">
                {{ hasCheckedOut ? 'Sudah Check Out' : 'Check Out' }}
                </button>

            </div>
        </div>
    </div>
       
        <!-- Recent Attendance Section --> 
        <div class="p-4">
            <h2 class="text-base-content font-semibold mb-3">Kehadiran Terbaru</h2>
            <div v-show="loading" class="flex justify-center py-8">
                <span class="loading loading-spinner loading-lg text-primary"></span>
            </div>
            <div v-show="!loading && recentAttendance.length === 0" class="flex justify-center py-8">
                <p class="text-sm text-base-content/70">Tidak ada data kehadiran terbaru.</p>
            </div>
            <div v-show="!loading && recentAttendance.length > 0" class="space-y-3">
                <AttendanceCard
                    v-for="attendance in recentAttendance" 
                    :key="attendance.id" 
                    :attendance="attendance"
                    />
            </div> 
        </div>

        <!-- Bottom Navigation Section -->
        <BottomNavigation />

    </div>

</template>

<style>
 .pb-safe-bottom {
    padding-bottom: calc(4rem + env(safe-area-inset-bottom, 16px));
 }
</style>