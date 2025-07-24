# Sistem Notifikasi SIPANDAI

Dokumentasi ini menjelaskan tentang implementasi sistem notifikasi di aplikasi SIPANDAI.

## Fitur Notifikasi

1. **Notifikasi In-App**
   - Tampil di pojok kanan atas
   - Menunjukkan jumlah notifikasi belum dibaca
   - Dapat diklik untuk melihat detail
   - Mendukung berbagai tipe notifikasi (info, sukses, peringatan, error)

2. **Notifikasi Email**
   - Dikirim ke admin saat ada pengajuan baru
   - Berisi detail pengajuan
   - Dapat dikonfigurasi melalui variabel lingkungan

## Konfigurasi

1. **Variabel Lingkungan**
   Buat file `.env` di root project dengan konten berikut:
   ```env
   # Email Configuration
   VITE_EMAIL_HOST=smtp.gmail.com
   VITE_EMAIL_PORT=587
   VITE_EMAIL_USER=your-email@gmail.com
   VITE_EMAIL_PASSWORD=your-app-password
   ```

2. **Konfigurasi Email**
   - Untuk Gmail, aktifkan "Akses Aplikasi Tidak Aman" atau gunakan App Password
   - Pastikan port SMTP tidak diblokir oleh firewall

## Cara Kerja

1. **Mengirim Notifikasi**
   ```javascript
   import { sendNotification } from '@/services/notificationService';
   
   // Contoh mengirim notifikasi
   await sendNotification({
     userId: 'user-id',
     email: 'user@example.com', // Opsional, untuk notifikasi email
     title: 'Judul Notifikasi',
     message: 'Pesan notifikasi',
     type: 'info', // 'info' | 'success' | 'warning' | 'error'
     link: '/path/to/resource', // Opsional
     submission: submissionData // Opsional, untuk notifikasi pengajuan
   });
   ```

2. **Mendapatkan Notifikasi**
   - Komponen `NotificationCenter` akan menangani penampilan notifikasi
   - Notifikasi disimpan di tabel `notifications` di Supabase
   - Status baca/tidak baca diupdate otomatis

## Troubleshooting

1. **Notifikasi tidak muncul**
   - Periksa koneksi internet
   - Periksa console browser untuk pesan error
   - Pastikan user memiliki izin yang sesuai

2. **Email tidak terkirim**
   - Periksa kredensial email di `.env`
   - Periksa log server untuk pesan error
   - Pastikan port SMTP tidak diblokir

## Pengembangan

1. **Menambahkan Tipe Notifikasi Baru**
   - Tambahkan tipe di `notificationService.js`
   - Sesuaikan tampilan di `NotificationCenter.jsx`

2. **Mengubah Template Email**
   - Edit fungsi `sendNewSubmissionEmail` di `emailService.js`
   - Gunakan HTML dan CSS yang responsif

## Keamanan

1. **Proteksi Data**
   - Jangan simpan kredensial email di kode
   - Gunakan variabel lingkungan untuk data sensitif
   - Aktifkan Row Level Security di Supabase

2. **Izin**
   - Hanya admin yang bisa melihat notifikasi pengguna lain
   - Validasi input untuk mencegah XSS

## Catatan Perubahan

- **v1.0.0** - Rilis awal sistem notifikasi
- **v1.1.0** - Menambahkan notifikasi email untuk pengajuan baru
