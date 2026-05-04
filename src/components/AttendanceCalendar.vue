<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { Attendance } from '../services';

const props = defineProps<{
    attendances: Attendance[];
    month: number
    year: number
}>();

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);  
    
const statusLabel = (status: string) => {
    if (status === 'late') return 'Late'
    if (status === 'on_time') return 'On Time'
    if (status === 'absent') return 'Absent'
    return status;
}

const activeDate = computed(() => {
    const month = String(props.month).padStart(2, '0');
    return `${props.year}-${month}-01`;
});

const calendarEvents = computed(() => {
    return props.attendances.map((attendance) => ({
        title: statusLabel(attendance.status),
        date: attendance.attendance_date,
        allDay: true,
        classNames: [`status-${attendance.status}`]
    }))
});

const calendarOptions = computed(() => ({
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {left: '', center: 'title', right: ''},
    fixedWeekCount: false,
    showNonCurrentDates: false,
    height: 'auto',
    events: calendarEvents.value,
}))

const calendarKey = computed(() => `${props.year}-${props.month}`);

const syncCalendarDate = async () => {
    await nextTick();
    const api = calendarRef.value?.getApi();
    if (api) api.gotoDate(activeDate.value);
}

onMounted(() => {
    syncCalendarDate();
});

watch(() => [props.month, props.year], () => {
    syncCalendarDate();
});
</script>

<template>
    <div class="card bg-base-100 shadow">
        <div class="card-body p-3 pb-calendar-safe">
            <FullCalendar ref="calendarRef" :key="calendarKey" :options="calendarOptions" />
        </div>
    </div>
</template>

<style scoped>
.pb-calendar-safe {
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 16px));
}

:deep(.fc) {
  font-size: 0.9rem;
}

:deep(.fc-toolbar-title) {
  font-size: 1rem;
  font-weight: 600;
}

:deep(.fc-daygrid-event) {
  border-radius: 8px;
  padding: 2px 6px;
  font-size: 0.75rem;
  line-height: 1.1;
}

:deep(.fc .status-on_time) {
  background-color: #16a34a;
  border-color: #16a34a;
  color: #ffffff;
}

:deep(.fc .status-late) {
  background-color: #f59e0b;
  border-color: #f59e0b;
  color: #1f2937;
}

:deep(.fc .status-absent) {
  background-color: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
}
</style>