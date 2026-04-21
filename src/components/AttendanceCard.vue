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

    const formatDate = (dateString: string): string => {
        if (!dateString) return '--:--'; 
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year:  'numeric'
            });
         } catch {
            return dateString;
         }
    }

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

    const getStatusLable = (attendance: Attendance) => {
        if (attendance.status === 'late') return 'Late';
        if (attendance.status === 'on_time') return 'On Time';
        return attendance.status
    }

    const getStatusClass = (attendance: Attendance) => {
        if (attendance.status === 'late') return 'badge badge-soft badge-warning';
        if (attendance.status === 'on_time') return 'badge badge-soft badge-success';
        if (attendance.status === 'absent' || '') return 'badge badge-soft badge-error';
        return 'badge badge-soft badge-ghost';
    }
</script>


<template>
    <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-semibold">{{ formatDate(attendance.attendance_date) }}</p>
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

