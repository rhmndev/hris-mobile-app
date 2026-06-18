<template>
  <div
    class="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition transform hover:scale-105"
    @click="$emit('click')"
  >
    <div class="bg-primary text-primary-content text-white p-4">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-sm text-blue-100">Periode</p>
          <h2 class="text-2xl font-bold">{{ formatMonth(payslip.month, payslip.year) }}</h2>
        </div>
        <div class="text-right">
          <p class="text-sm text-blue-100">Status</p>
          <p class="font-semibold capitalize">{{ getStatusLabel(payslip.status) }}</p>
        </div>
      </div>
    </div>

    <div class="p-4">
      <!-- Main Amount -->
      <div class="mb-4">
        <p class="text-gray-600 text-sm">Gaji Bersih</p>
        <p class="text-3xl font-bold text-green-600">Rp {{ formatCurrency(payslip.net_salary) }}</p>
      </div>

      <!-- Salary Breakdown -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-gray-50 p-3 rounded">
          <p class="text-xs text-gray-600">Gaji Kotor</p>
          <p class="font-semibold text-gray-800">Rp {{ formatCurrency(payslip.gross_salary) }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded">
          <p class="text-xs text-gray-600">Total Potongan</p>
          <p class="font-semibold text-red-600">Rp {{ formatCurrency(payslip.total_deductions) }}</p>
        </div>
      </div>

      <!-- Attendance Info -->
      <div class="flex justify-between text-sm text-gray-600 border-t pt-3">
        <span>{{ payslip.present_days }} hari hadir</span>
        <span>{{ payslip.absent_days }} hari absen</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatMonth } from '@/utils/dateFormatter';

defineProps({
  payslip: {
    type: Object,
    required: true
  }
});

defineEmits(['click']);

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    draft: 'Draft',
    calculated: 'Dihitung',
    submitted: 'Diajukan',
    checked: 'Diperiksa',
    approved: 'Disetujui',
    paid: 'Dibayar',
    rejected: 'Ditolak'
  };
  return labels[status] || status;
}
</script>

<style scoped>
/* Add any additional scoped styles here */
</style>
