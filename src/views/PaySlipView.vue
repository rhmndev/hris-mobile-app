<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-primary text-primary-content pt-12 pb-6 px-4 rounded-b-2xl">
      <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="$router.push('/home')" class="p-1 rounded-full hover:bg-white/20 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold">Slip Gaji</h1>
          <p class="text-blue-100 text-sm mt-1">{{ currentMonthYear }}</p>
        </div>
      </div>
      <div class="text-right">
          <h1 class="font-bold text-lg">{{ authStore.user?.name || "User"}}</h1>
                <p class="text-sm opacity-80 mb-1">{{ authStore.user?.email }}</p>

        </div>


      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-96">
        <span class="loading loading-rings loading-lg mt-4 text-primary"></span>

    </div>

    <template v-else-if="currentPayslip">
      <div class="p-4 space-y-4">
        <PaySlipCard :payslip="currentPayslip" @click="selectedPayslip = currentPayslip" />

        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold text-gray-800 mb-3">Ringkasan</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Gaji Kotor</span>
              <span class="font-semibold">Rp {{ formatCurrency(currentPayslip.gross_salary) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Total Potongan</span>
              <span class="font-semibold text-red-600">-Rp {{ formatCurrency(currentPayslip.total_deductions) }}</span>
            </div>
            <div class="border-t pt-2">
              <div class="flex justify-between">
                <span class="text-lg font-bold text-gray-800">Gaji Bersih</span>
                <span class="text-lg font-bold text-green-600">Rp {{ formatCurrency(currentPayslip.net_salary) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold text-gray-800 mb-3">Kehadiran</h2>
          <div class="grid grid-cols-3 gap-2">
            <div class="text-center p-2 bg-gray-50 rounded">
              <p class="text-sm text-gray-600">Hadir</p>
              <p class="text-xl font-bold text-green-600">{{ currentPayslip.present_days }}</p>
            </div>
            <div class="text-center p-2 bg-gray-50 rounded">
              <p class="text-sm text-gray-600">Terlambat</p>
              <p class="text-xl font-bold text-orange-600">{{ currentPayslip.late_days }}</p>
            </div>
            <div class="text-center p-2 bg-gray-50 rounded">
              <p class="text-sm text-gray-600">Absen</p>
              <p class="text-xl font-bold text-red-600">{{ currentPayslip.absent_days }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            @click="viewDetail"
            class="bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Detail Lengkap
          </button>
          <button
            @click="downloadPDF"
            class="bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Download PDF
          </button>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold text-gray-800 mb-3">Riwayat Slip Gaji</h2>
          <div v-if="payslipHistory.length === 0" class="text-center py-6">
            <p class="text-gray-500">Tidak ada riwayat slip gaji</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="slip in payslipHistory"
              :key="slip.id"
              @click="selectedPayslip = slip"
              class="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
            >
              <div>
                <p class="font-semibold text-gray-800">{{ formatMonth(slip.month, slip.year) }}</p>
                <p class="text-sm text-gray-500">Rp {{ formatCurrency(slip.net_salary) }}</p>
              </div>
              <div>
                <span class="text-xs px-2 py-1 rounded-full" :class="getStatusClass(slip.status)">
                  {{ getStatusLabel(slip.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="flex flex-col justify-center items-center h-96">
        <div class="text-center">
          <p class="text-gray-500 text-lg mb-4">Slip gaji tidak tersedia</p>
          <button
            @click="fetchPayslips"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    </template>

    <PaySlipDetail
      v-if="selectedPayslip"
      :payslip="selectedPayslip"
      @close="selectedPayslip = null"
      @download="downloadPayslipPDF"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import PaySlipCard from '@/components/PaySlip/PaySlipCard.vue';
import PaySlipDetail from '@/components/PaySlip/PaySlipDetail.vue';
import { useAuthStore } from '@/stores/auth';


import { PayslipService } from '../services/payslip';
import { formatCurrency, formatMonth } from '../utils/dateFormatter';

const authStore = useAuthStore();
const loading = ref(false);
const currentPayslip = ref<any>(null);
const payslipHistory = ref<any[]>([]);
const selectedPayslip = ref<any>(null);

const payslipService = new PayslipService();

const currentDate = new Date();
const currentMonthYear = computed(() => {
  return formatMonth(currentDate.getMonth() + 1, currentDate.getFullYear());
});

onMounted(() => {
  fetchPayslips();
});

async function fetchPayslips() {
  loading.value = true;
  try {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    payslipHistory.value = await payslipService.getPayslipHistory(12);

    try {
      currentPayslip.value = await payslipService.getCurrentPayslip(month, year);
    } catch (currentMonthError) {
      console.warn('No payslip for current month, using history fallback...', currentMonthError);
      if (payslipHistory.value.length > 0) {
        const latestFromHistory = payslipHistory.value[0];
        try {
          currentPayslip.value = await payslipService.getPayslipDetail(latestFromHistory.id);
        } catch (detailError) {
          currentPayslip.value = latestFromHistory;
        }
      } else {
        currentPayslip.value = null;
      }
    }
  } catch (error) {
    console.error('Error fetching payslips:', error);
  } finally {
    loading.value = false;
  }
}

function viewDetail() {
  if (currentPayslip.value) {
    selectedPayslip.value = currentPayslip.value;
  }
}

async function downloadPDF() {
  if (currentPayslip.value) {
    await downloadPayslipPDF(currentPayslip.value);
  }
}

async function downloadPayslipPDF(payslip: any) {
  try {
    await payslipService.downloadPayslipPDF(payslip);
  } catch (error) {
    console.error('Error downloading PDF:', error);
  }
}

function getStatusClass(status: string): string {
  const classes: { [key: string]: string } = {
    draft: 'bg-gray-100 text-gray-800',
    calculated: 'bg-yellow-100 text-yellow-800',
    submitted: 'bg-blue-100 text-blue-800',
    checked: 'bg-indigo-100 text-indigo-800',
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

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