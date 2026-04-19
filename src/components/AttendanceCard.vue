<script setup lang="ts">
    interface Attendance {
        id: number;
        attendance_date: string;
        check_in_time: string | null;
        check_out_time: string | null;
        status: string;
        is_late: boolean;
    }

    defineProps<{
        attendance: Attendance
    }>();

    const formatTime = (time: string | null) => {
        if (!time) return '--:--';
        return time.substring(0, 5);
    }

    const getStatusLable = (attendance: Attendance) => {
        if (attendance.is_late) return 'Late';
        if (attendance.status === 'on_time') return 'On Time';
        return attendance.status
    }

    const getStatusClass = (attendance: Attendance) => {
        if (attendance.is_late) return 'badge-warning';
        if (attendance.status === 'present' || attendance.status === 'on_time') return 'badge-success';
        if (attendance.status === 'absent') return 'badge-error';
        return 'badge-ghost';
    }
</script>


<template>
    <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-semibold">{{ attendance.attendance_date }}</p>
                    <p class="text-sm text-base-content/60">
                        {{ formatTime(attendance.check_in_time) }} - {{ formatTime(attendance.check_out_time) }}
                    </p>
                </div>
                <div>
                    <span class="badge badge-lg" :class="getStatusClass(attendance)">{{ getStatusLable(attendance) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

