import jsPDF from 'jspdf';
import { formatCurrency, formatMonth, formatDate } from './dateFormatter';

export function generatePayslipPDF(
  payslip: any,
  employee: any,
  designation: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let currentY = margin;

  // Set colors
  const primaryColor = [30, 90, 160]; // Blue
  const lightGray = [242, 242, 242];

  // Header Background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SLIP GAJI', margin + 5, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  // Memastikan hasil formatMonth berupa string
  const periodeText = `Periode: ${formatMonth(payslip.month, payslip.year)}`;
  doc.text(periodeText, pageWidth - margin - 5, 18, { align: 'right' });

  currentY = 40;

  // Employee Information
  doc.setTextColor(0, 0, 0); // Reset ke hitam murni
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Informasi Karyawan', margin, currentY);

  currentY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const infoWidth = (pageWidth - 2 * margin) / 2;
  doc.text(`Nama: ${employee.name || '-'}`, margin, currentY);
  doc.text(`Jabatan: ${designation || '-'}`, margin + infoWidth, currentY);

  currentY += 6;
  doc.text(`ID Karyawan: ${employee.employee_id || '-'}`, margin, currentY);
  doc.text(`Email: ${employee.email || '-'}`, margin + infoWidth, currentY);

  currentY += 12;

  // Main Salary Information Card (Static height 30 is fine here)
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(margin, currentY - 4, pageWidth - 2 * margin, 30, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Gaji', margin + 3, currentY);

  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const rightAlignX = pageWidth - margin - 3;

  doc.text('Gaji Pokok:', margin + 3, currentY);
  doc.text(`Rp ${formatCurrency(payslip.basic_salary)}`, rightAlignX, currentY, { align: 'right' });

  currentY += 6;
  doc.text('Total Penghasilan Tambahan:', margin + 3, currentY);
  doc.text(`Rp ${formatCurrency(payslip.total_earnings)}`, rightAlignX, currentY, { align: 'right' });

  currentY += 6;
  doc.text('Gaji Kotor:', margin + 3, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rp ${formatCurrency(payslip.gross_salary)}`, rightAlignX, currentY, { align: 'right' });

  currentY += 14;

  // Deductions Section (Dynamic Height Calculation)
  const deductionStartY = currentY - 4;
  
  // Ketahui dulu berapa field potongan yang aktif untuk menentukan tinggi background kotak
  let activeDeductionRows = 1; // Minimal untuk baris header judul
  if (payslip.pph21 > 0) activeDeductionRows++;
  if (payslip.bpjs_kesehatan > 0) activeDeductionRows++;
  if (payslip.bpjs_ketenagakerjaan > 0) activeDeductionRows++;
  if (payslip.jht > 0) activeDeductionRows++;
  activeDeductionRows++; // Untuk baris "Total Potongan"
  
  const dynamicBoxHeight = (activeDeductionRows * 6) + 4;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(margin, deductionStartY, pageWidth - 2 * margin, dynamicBoxHeight, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Potongan & Pajak', margin + 3, currentY);
  currentY += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (payslip.pph21 > 0) {
    doc.text('PPh 21:', margin + 3, currentY);
    doc.text(`Rp ${formatCurrency(payslip.pph21)}`, rightAlignX, currentY, { align: 'right' });
    currentY += 6;
  }

  if (payslip.bpjs_kesehatan > 0) {
    doc.text('BPJS Kesehatan:', margin + 3, currentY);
    doc.text(`Rp ${formatCurrency(payslip.bpjs_kesehatan)}`, rightAlignX, currentY, { align: 'right' });
    currentY += 6;
  }

  if (payslip.bpjs_ketenagakerjaan > 0) {
    doc.text('BPJS Ketenagakerjaan:', margin + 3, currentY);
    doc.text(`Rp ${formatCurrency(payslip.bpjs_ketenagakerjaan)}`, rightAlignX, currentY, { align: 'right' });
    currentY += 6;
  }

  if (payslip.jht > 0) {
    doc.text('JHT:', margin + 3, currentY);
    doc.text(`Rp ${formatCurrency(payslip.jht)}`, rightAlignX, currentY, { align: 'right' });
    currentY += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Total Potongan:', margin + 3, currentY);
  doc.text(`Rp ${formatCurrency(payslip.total_deductions)}`, rightAlignX, currentY, { align: 'right' });

  currentY += 14;

  // Net Salary Highlight (Green Box)
  doc.setFillColor(76, 175, 80); // Green
  doc.rect(margin, currentY - 5, pageWidth - 2 * margin, 12, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GAJI BERSIH', margin + 3, currentY + 3);
  doc.text(`Rp ${formatCurrency(payslip.net_salary)}`, pageWidth - margin - 3, currentY + 3, { align: 'right' });

  currentY += 18;

  // Attendance Section
  doc.setTextColor(0, 0, 0); // Kembalikan ke warna hitam murni
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Data Kehadiran', margin, currentY);

  currentY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const attendanceData = [
    { label: 'Total Hari Kerja', value: payslip.total_working_days },
    { label: 'Hadir', value: payslip.present_days },
    { label: 'Terlambat', value: payslip.late_days },
    { label: 'Absen', value: payslip.absent_days },
    { label: 'Cuti Dibayar', value: payslip.paid_leave_days },
    { label: 'Cuti Tidak Dibayar', value: payslip.unpaid_leave_days },
  ];

  let col = 0;
  attendanceData.forEach((item) => {
    if (col === 0) {
      doc.text(`${item.label}: ${item.value ?? 0}`, margin, currentY);
      col = 1;
    } else {
      doc.text(`${item.label}: ${item.value ?? 0}`, margin + infoWidth, currentY);
      currentY += 6;
      col = 0;
    }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const tanggalPrint = formatDate(new Date().toISOString());
  doc.text(
    `Dokumen ini digenerate secara otomatis pada ${tanggalPrint}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save PDF
  const filename = `Slip_Gaji_${employee.name || 'Karyawan'}_${payslip.month}_${payslip.year}.pdf`;
  doc.save(filename);
}