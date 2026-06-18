<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
    <div class="bg-white w-full rounded-t-2xl shadow-lg max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white border-b flex justify-between items-center p-4">
        <h2 class="text-xl font-bold">Detail Slip Gaji</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
      </div>

      <div class="p-4 space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <div>
              <p class="text-sm text-gray-600">Periode</p>
              <h3 class="text-2xl font-bold text-gray-800">{{ formatMonth(payslip.month, payslip.year) }}</h3>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-600">Status</p>
              <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold" :class="getStatusClass(payslip.status)">
                {{ getStatusLabel(payslip.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <p class="text-sm text-gray-600 mb-1">Gaji Bersih</p>
          <p class="text-4xl font-bold text-green-600 mb-2">Rp {{ formatCurrency(payslip.net_salary) }}</p>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p class="text-gray-600">Gaji Kotor</p>
              <p class="font-semibold">Rp {{ formatCurrency(payslip.gross_salary) }}</p>
            </div>
            <div>
              <p class="text-gray-600">Total Potongan</p>
              <p class="font-semibold text-red-600">Rp {{ formatCurrency(payslip.total_deductions) }}</p>
            </div>
          </div>
        </div>

        <div v-if="earningDetails.length > 0" class="bg-white border rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-3">Penghasilan</h3>
          <div class="space-y-2">
            <div v-for="earning in earningDetails" :key="earning.id" class="flex justify-between items-center p-2 border-b last:border-b-0">
              <span class="text-gray-600">{{ earning.component_name }}</span>
              <span class="font-semibold text-green-600">+ Rp {{ formatCurrency(earning.amount) }}</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t font-bold text-gray-800 flex justify-between">
            <span>Subtotal Penghasilan</span>
            <span class="text-green-600">Rp {{ formatCurrency(payslip.basic_salary + payslip.total_earnings) }}</span>
          </div>
        </div>

        <div v-if="deductionDetails.length > 0" class="bg-white border rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-3">Potongan</h3>
          <div class="space-y-2">
            <div v-for="deduction in deductionDetails" :key="deduction.id" class="flex justify-between items-center p-2 border-b last:border-b-0">
              <span class="text-gray-600">{{ deduction.component_name }}</span>
              <span class="font-semibold text-red-600">- Rp {{ formatCurrency(deduction.amount) }}</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t font-bold text-gray-800 flex justify-between">
            <span>Subtotal Potongan</span>
            <span class="text-red-600">Rp {{ formatCurrency(payslip.total_deductions) }}</span>
          </div>
        </div>

        <div class="bg-white border rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-3">Kehadiran & Cuti</h3>
          <div class="grid grid-cols-2 gap-2">
            <div class="p-2 bg-gray-50 rounded">
              <p class="text-xs text-gray-600">Total Hari Kerja</p>
              <p class="font-bold">{{ payslip.total_working_days }}</p>
            </div>
            <div class="p-2 bg-green-50 rounded">
              <p class="text-xs text-gray-600">Hadir</p>
              <p class="font-bold text-green-600">{{ payslip.present_days }}</p>
            </div>
            <div class="p-2 bg-orange-50 rounded">
              <p class="text-xs text-gray-600">Terlambat</p>
              <p class="font-bold text-orange-600">{{ payslip.late_days }}</p>
            </div>
            <div class="p-2 bg-red-50 rounded">
              <p class="text-xs text-gray-600">Absen</p>
              <p class="font-bold text-red-600">{{ payslip.absent_days }}</p>
            </div>
            <div class="p-2 bg-blue-50 rounded">
              <p class="text-xs text-gray-600">Cuti Dibayar</p>
              <p class="font-bold">{{ payslip.paid_leave_days }}</p>
            </div>
            <div class="p-2 bg-purple-50 rounded">
              <p class="text-xs text-gray-600">Cuti Tidak Dibayar</p>
              <p class="font-bold">{{ payslip.unpaid_leave_days }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 pb-4">
          <button
            @click="$emit('download', payslip)"
            class="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Download PDF
          </button>
          <button
            @click="shareNativePDF"
            class="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Bagikan Slip
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatCurrency, formatMonth, formatDate } from '@/utils/dateFormatter';
import jsPDF from 'jspdf'; // Kita import untuk meng-handle ekspor biner PDF langsung di modal ini

const props = defineProps({
  payslip: {
    type: Object,
    required: true
  }
});

defineEmits(['close', 'download']);

const earningDetails = computed(() => {
  return props.payslip.details?.filter((d: any) => d.component_type === 'earning') || [];
});

const deductionDetails = computed(() => {
  return props.payslip.details?.filter((d: any) => d.component_type === 'deduction') || [];
});

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

// ==================== FITUR NATIVE SHARING MOBILE ====================
async function shareNativePDF() {
  const periode = formatMonth(props.payslip.month, props.payslip.year);
  const filename = `Slip_Gaji_${periode.replace(' ', '_')}.pdf`;

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('SLIP GAJI KARYAWAN', 15, 15);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${periode}`, 15, 23);
    doc.text(`Gaji Bersih: Rp ${formatCurrency(props.payslip.net_salary)}`, 15, 31);
    doc.text(`Status: ${getStatusLabel(props.payslip.status)}`, 15, 39);
    doc.text('------------------------------------------------', 15, 45);
    doc.text('Detail lengkap dokumen terlampir pada file PDF ini.', 15, 52);

    const pdfOutput = doc.output('arraybuffer');
    const blob = new Blob([pdfOutput], { type: 'application/pdf' });
    
    const file = new File([blob], filename, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Slip Gaji ${periode}`,
        text: `Berikut lampiran Slip Gaji online untuk periode ${periode}.`,
      });
    } else {
      const subject = encodeURIComponent(`Slip Gaji Periode ${periode}`);
      const body = encodeURIComponent(`Gaji Bersih Anda periode ${periode} adalah Rp ${formatCurrency(props.payslip.net_salary)}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  } catch (error) {
    console.error('Gagal memproses fitur Berbagi Native:', error);
  }
}
</script>