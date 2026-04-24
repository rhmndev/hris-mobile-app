import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'hris-mobile-app',
  webDir: 'dist',
  server: {
    // Masukkan IP Laptop kamu dan port Vite di sini
    // url: 'http://192.168.88.253:5173', 
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;