<script setup lang="ts">
    import { computed, ref} from 'vue';
    import { useRouter } from 'vue-router';
import AttendanceCard from '../components/AttendanceCard.vue';

    const router = useRouter();

    const mockUser = {
        name: "Rahman Nurhadi",
        role: "Employee"
    }

    const mockAttendanceHistory = [
        { id: 1, attendance_date: '2026-04-11', check_in_time: '08:15:00', check_out_time: '17:05:00', status: 'on_time', is_late: false },
        { id: 2, attendance_date: '2026-04-12', check_in_time: '08:32:00', check_out_time: '17:00:00', status: 'present', is_late: true },
        { id: 3, attendance_date: '2026-04-13', check_in_time: '07:55:00', check_out_time: '17:10:00', status: 'on_time', is_late: false },
        { id: 4, attendance_date: '2026-04-14', check_in_time: '08:00:00', check_out_time: '17:00:00', status: 'on_time', is_late: false },
        { id: 5, attendance_date: '2026-04-15', check_in_time: null, check_out_time: null, status: 'absent', is_late: false },
    ]

    const hasCheckIn = ref(false)
    const loading = ref(false)
    const currentTime = ref (new Date())
    const activeTab= ref('home')

    setInterval(() => {
        currentTime.value = new Date()
    }, 1000)

    const formatedDate = computed(() => {
        return currentTime.value.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year:  'numeric'
        })
    })

    const checkInTinme = computed(() => {
        return hasCheckIn.value ? '08:15' : '--:--'
    })

    const CheckOutTime = computed(() => {
        return '--:--'
    })

    const goToAttendance = () => {
        router.push('/attendance')
    }

    const goToProfile = () => {
        router.push('/profile')
    }

    const goToReport = () => {
        router.push('/report')
    }

</script>

<template>
    <div class="min-h-screen bg-base-200 pb-24">
        <!-- Header Section -->
        <div class="bg-primary text-primary-content pt-12 px-4 rounded-b-3xl">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div>
                        <p class="font-semibold text-lg">{{ mockUser.name }}</p>
                        <p class="font-semibold text-sm">{{ mockUser.role }}</p>
                    </div>
                </div>
                <div class="text-right">
                    <!-- <p class="text-sm font-mendium">Hari ini</p> -->
                    <p class="text-base font-medium">Hari ini</p>
                    <p class="text-sm font-medium">{{ formatedDate }}</p>
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
                        <p class="text-3xl font-bold text-primary">{{ checkInTinme }}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-sm text-base-content/60 mb-1">Check Out</p>
                        <p class="text-3xl font-bold text-primary">{{ CheckOutTime }}</p>
                    </div>
                </div>

                <!-- Button Section -->
                <button class="btn btn-primary btn-lg w-full">Check In</button>
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
                    v-for="attendance in mockAttendanceHistory" 
                    :key="attendance.id" 
                    :attendance="attendance"
                    />
            </div> 
        </div>

        <!-- Bottom Navigation Section -->
        

    </div>

</template>
