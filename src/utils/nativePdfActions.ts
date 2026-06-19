import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { GeneratedPDF } from './pdfGenerator';

/**
 * Convert ArrayBuffer to base64 string (required by Capacitor Filesystem)
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Check if running on native (Android/iOS) or web browser
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Save PDF to device storage.
 * - Native: saves to Documents directory via Capacitor Filesystem
 * - Web: triggers browser download
 */
export async function savePdfToDevice(pdf: GeneratedPDF): Promise<void> {
  if (isNative()) {
    await savePdfNative(pdf);
  } else {
    savePdfWeb(pdf);
  }
}

/**
 * Share PDF via native share sheet (works in APK).
 * - Native: saves to cache then opens native share sheet with file
 * - Web: falls back to browser download
 */
export async function sharePdf(pdf: GeneratedPDF): Promise<void> {
  if (isNative()) {
    await sharePdfNative(pdf);
  } else {
    // Web fallback: just download
    savePdfWeb(pdf);
  }
}

// ─── Native Implementation ─────────────────────────────────────────────────

async function savePdfNative(pdf: GeneratedPDF): Promise<void> {
  const base64 = arrayBufferToBase64(pdf.pdfArrayBuffer);

  // Save to Documents directory (user-accessible)
  const result = await Filesystem.writeFile({
    path: pdf.filename,
    data: base64,
    directory: Directory.Documents,
    recursive: true,
  });

  // After saving, open the native share sheet so the user can open/share it
  await Share.share({
    title: 'Slip Gaji',
    text: `File ${pdf.filename} berhasil disimpan.`,
    url: result.uri,
    dialogTitle: 'Simpan / Bagikan Slip Gaji',
  });
}

async function sharePdfNative(pdf: GeneratedPDF): Promise<void> {
  const base64 = arrayBufferToBase64(pdf.pdfArrayBuffer);

  // Save to Cache directory (temporary, for sharing)
  const result = await Filesystem.writeFile({
    path: pdf.filename,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });

  // Open native share sheet with the file
  await Share.share({
    title: 'Bagikan Slip Gaji',
    text: `Slip Gaji - ${pdf.filename}`,
    url: result.uri,
    dialogTitle: 'Bagikan Slip Gaji',
  });
}

// ─── Web Fallback ──────────────────────────────────────────────────────────

function savePdfWeb(pdf: GeneratedPDF): void {
  const blob = new Blob([pdf.pdfArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = pdf.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up blob URL
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
