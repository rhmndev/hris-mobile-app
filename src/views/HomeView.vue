<script setup lang="ts">
    import { computed, ref, onMounted} from 'vue';
    import { useRouter } from 'vue-router';
    import AttendanceCard from '../components/AttendanceCard.vue';
    import BottomNavigation from '../components/BottomNavigation.vue';
    import { useAuthStore } from '../stores/auth';
    import { attendanceService, type Attendance } from '../services';
    

    const router = useRouter();
    const authStore = useAuthStore();

    const todayAttendance = ref<Attendance | null>(null);
    const attendanceHistory = ref<Attendance []>([]);
    const loading = ref(true);
    const currentTime = ref(new Date());


    setInterval(() => {
        currentTime.value = new Date()
    }, 1000)

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

    const fetchData = async () => {
        loading.value = true;
        try {
            const [todayRes, historyRes] = await Promise.all([
                attendanceService.getToday(),
                attendanceService.getHistory()
            ]);
            todayAttendance.value = todayRes.data;
            attendanceHistory.value = historyRes.data;
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            loading.value = false;
        }
    }
    const goToAttendance = () => {
        router.push('/attendance')
    }

    onMounted(() => {
        fetchData();
    })

    // const goToProfile = () => {
    //     router.push('/profile')
    // }

    // const goToReport = () => {
    //     router.push('/report')
    // }

</script>

<template>
    <div class="min-h-screen bg-base-200 pb-24">
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
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="text-center">
                        <p class="text-sm text-base-content/60 mb-1">Check In</p>
                        <p class="text-3xl font-bold text-primary">{{ checkInTime }}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-sm text-base-content/60 mb-1">Check Out</p>
                        <p class="text-3xl font-bold text-primary">{{ checkOutTime }}</p>
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
                class="btn btn-error btn-lg w-full" 
                @click="goToAttendance">
                    Check Out
                </button>

            </div>
        </div>
    </div>
       
        <!-- Recent Attendance Section --> 
        <div class="p-4">
            <h2 class="text-base-content font-semibold mb-3">Riwayat Kehadiran</h2>
            <div v-if="loading" class="flex justify-center py-8">
                <span class="loading loading-spinner loading-lg text-primary"></span>
            </div>
            <div v-else class="space-y-3">
                <AttendanceCard
                    v-for="attendance in attendanceHistory.slice(0, 5)" 
                    :key="attendance.id" 
                    :attendance="attendance"
                    />
            </div> 
        </div>

        <!-- Bottom Navigation Section -->
        <BottomNavigation />

    </div>

</template>
