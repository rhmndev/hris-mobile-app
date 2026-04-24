<script setup lang="ts">
    import { ref, computed, onMounted, watch} from 'vue'
    import { useRouter } from 'vue-router'
    import BottomNavigation from '../components/BottomNavigation.vue'
    import AttendanceCard from '../components/AttendanceCard.vue'
    import { attendanceService, type Attendance } from '../services'

    const router = useRouter();


    const attendanceHistory = ref<Attendance[]>([])
    const loading = ref(true)

    const currentDate = new Date()
    const selectedMonth = ref(currentDate.getMonth() + 1)
    const selectedYear = ref(currentDate.getFullYear())

    const months = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' },
    ]
    const years = computed(() => {
        const currentYear = new Date().getFullYear()
        return Array.from({ length: 3 }, (_, i) => currentYear - i)
    })

    const stats = computed(() => {
        const data = attendanceHistory.value
        const present = data.filter((a) => a.status === 'on_time').length
        const absent = data.filter(a => a.status === 'absent').length
        const late = data.filter(a => a.status === 'late').length
        return { present, late, absent, total: data.length }
    })

    const fetchAttendanceHistory = async () => {
        loading.value = true
        try {
            const res = await attendanceService.getHistory(1, selectedMonth.value, selectedYear.value)
            attendanceHistory.value = res.data
        } catch(error) {
            console.log('Error fetching attendance history:', error)
        } finally {
            loading.value = false
        }
    }

    const goBack = () => router.push('/home')

    onMounted(() => {
        fetchAttendanceHistory()
    })

    watch([selectedMonth, selectedYear], () => {
        fetchAttendanceHistory()

    })

</script>

<template>
    <div class="min-h-screen bg-base-200 pb-24">
        <!-- Header -->
        <div class="bg-primary text-primary-content pt-12 px-4 pb-6">
            <div class="flex items-center gap-4 mb-4">
                <button class="btn btn-ghost btn-circle" @click="goBack">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 class="text-xl font-semibold">Attendance Report</h1>
            </div>

            <!-- Filter Section -->
             <div class="flex gap-2">
                <select v-model="selectedMonth" class="select select-sm flex-1 text-base-content">
                    <option v-for="month in months" :key="month.value" :value="month.value">
                        {{ month.label }}
                    </option>
                </select>
                <select v-model="selectedYear" class="select select-sm w-24 text-base-content">
                    <option v-for="year in years" :key="year" :value="year">
                        {{ year }}
                    </option>
                </select>
             </div>
        </div>

        <!-- Stats -->
         <div class="p-4 mt-2">
            <div class="grid grid-cols-3 gap-3">
                <div class="card bg-base-100 shadow">
                    <div class="card-body p-3 items-center">
                        <span class="text-2xl font-bold text-success">{{ stats.present }}</span>
                        <span class="text-xs text-base-content/60">Present</span>
                    </div>
                </div>
                 <div class="card bg-base-100 shadow">
                    <div class="card-body p-3 items-center">
                        <span class="text-2xl font-bold text-warning">{{ stats.late }}</span>
                        <span class="text-xs text-base-content/60">Late</span>
                    </div>
                </div>
                 <div class="card bg-base-100 shadow">
                    <div class="card-body p-3 items-center">
                        <span class="text-2xl font-bold text-error">{{ stats.absent }}</span>
                        <span class="text-xs text-base-content/60">Absent</span>
                    </div>
                </div>
            </div>
         </div>

        <!-- Ateendance List -->
         <div class="p-4">
            <h2 class="font-semibold mb-3 text-base-content">
                Attendance History
                <span class="text-base-content/60 font-normal">({{ attendanceHistory.length }} Records)</span>
            </h2>
            <div v-if="loading" class="flex justify-center py-8">
                <span class="loading loading-spinner loading-lg text-primary"></span>
            </div>

            <div v-else-if="attendanceHistory.length === 0" class="text-center py-8 text-base-content/60">
                No attendance records found for the selected month and year.
            </div>

             <div v-else class="space-y-3">
                <AttendanceCard
                v-for="attendance in attendanceHistory"
                :key="attendance.id"
                :attendance="attendance"
                />
            </div>
         </div>


        <!-- BottomNavigation -->
         <BottomNavigation />
    </div>

</template>