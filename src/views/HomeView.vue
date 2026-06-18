<script setup lang="ts">
    import { computed, ref, onMounted, onUnmounted } from 'vue';
    import { useRouter } from 'vue-router';
    import AttendanceCard from '../components/AttendanceCard.vue';
    import BottomNavigation from '../components/BottomNavigation.vue';
    import { useAuthStore } from '../stores/auth';
    import { attendanceService, leaveService, type Attendance, type Company } from '../services';
    import { API_ORIGIN } from '../services/https';
    
    

    const router = useRouter();
    const authStore = useAuthStore();

    const todayAttendance = ref<Attendance | null>(null);
    const attendanceHistory = ref<Attendance []>([]);
    const leaveData = ref<any>(null);
    const loading = ref(true);
    const currentTime = ref(new Date());
    const company = ref<Company | null>(null);
    
    const user = computed(() => authStore.user);
    const empDes = computed(() => user.value?.employee_designation);
    

    let isMounted = false
    let timeInterval: number | null = null

    const branchValidation = computed(() => {
            const branch = company.value?.branch;

        return {
            requireLiveness: branch?.require_liveness ?? true,
            requireGeolocation: branch?.require_geolocation ?? true,
            requireFaceRecognation: branch?.require_face_recognation ?? true
        }
        })
    const requireSelfie = computed(() => {
  return branchValidation.value.requireLiveness || branchValidation.value.requireFaceRecognation
})

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

    const leaveQuotaPercentage = computed(() => {
        if (!leaveData.value) return 0;
        const quota = leaveData.value.total_quota || 12;
        const used = leaveData.value.used_quota || 0;
        const remaining = Math.max(0, quota - used);
        return Math.round((remaining / quota) * 100);
    })

    const remainingLeavesDays = computed(() => {
        if (!leaveData.value) return 0;
        const quota = leaveData.value.total_quota || 12;
        const used = leaveData.value.used_quota || 0;
        return Math.max(0, quota - used);
    })

    const fetchData = async () => {
    loading.value = true;

    try {
        const [todayRes, historyRes, leaveRes] = await Promise.all([
            attendanceService.getToday(),
            attendanceService.getHistory(),
            leaveService.getLeaveRequests().catch(() => ({ data: null }))
        ]);

        if (!isMounted) return;

        todayAttendance.value = todayRes.data;
        attendanceHistory.value = historyRes.data;
        
        if (leaveRes.data) {
            const approved = leaveRes.data.filter((leave: any) => leave.status === 'approved');
            const usedDays = approved.reduce((total: number, leave: any) => {
                const start = new Date(leave.start_date);
                const end = new Date(leave.end_date);
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                return total + days;
            }, 0);
            
            leaveData.value = {
                total_quota: 12,
                used_quota: usedDays,
                approved_count: approved.length
            };
        }

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

    const goToLeave = () => {
        router.push('/leave')
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
                        <!-- <p class="font-semibold text-sm">{{ authStore.user?. || "Role"}}</p> -->
                        <span v-if="empDes?.designation" class="font-semibold text-sm">
                    {{ empDes.designation.name }}
                </span>
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
                    <div v-if="requireSelfie" class="text-center">
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

        <div class="grid grid-cols-2 gap-4 mt-4">
            <!-- Quota Leave Request Card -->
            <div class="card bg-base-100 shadow-md rounded-2xl border border-base-300">
                <div class="card-body p-5 flex flex-col items-center justify-center">
                    <div class="relative w-28 h-28 mb-3">
                        <svg class="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="4"></circle>
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" stroke-width="4" stroke-dasharray="282.7" :stroke-dashoffset="`${282.7 * (1 - leaveQuotaPercentage / 100)}`" stroke-linecap="round" class="transition-all duration-500"></circle>
                        </svg>
                        <div class="absolute inset-7 flex items-center justify-center flex-col">
                            <p class="text-xl font-bold text-base-content">{{ remainingLeavesDays }}</p>
                            <p class="text-xs text-base-content/60">hari</p>
                        </div>
                    </div>
                    <p class="text-sm font-semibold text-base-content text-center">Sisa Cuti</p>
                    <p class="text-xs text-base-content/70 text-center mt-1">{{ leaveQuotaPercentage }}% dari 12 hari</p>
                </div>
            </div>

            <!-- Leave -->
            <div class="card bg-base-100 shadow-md rounded-2xl border border-base-300 cursor-pointer hover:shadow-lg transition-shadow" @click="goToLeave">
                <div class="card-body p-5 flex flex-col items-center justify-center">
                    <div class="w-14 h-14 bg-base-200 rounded-full flex items-center justify-center mb-3">
                        <svg class="w-7 h-7 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <p class="text-sm font-semibold text-base-content text-center">Kelola Cuti</p>
                    <p class="text-xs text-base-content/70 text-center mt-1">Lihat status</p>
                </div>
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