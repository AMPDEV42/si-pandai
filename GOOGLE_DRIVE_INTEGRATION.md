# Integrasi Google Drive - SIPANDAI

## Overview
Sistem SIPANDAI kini terintegrasi dengan Google Drive untuk penyimpanan dokumen persyaratan pengajuan. Dokumen akan disimpan dengan struktur folder yang terorganisir berdasarkan kategori pengajuan dan nama pegawai.

## Struktur Folder Google Drive

```
Google Drive/
├── SIPANDAI/                    (Folder utama)
│   ├── Pemberhentian/           (Kategori: Pemberhentian dari Jabfung)
│   │   ├── Ali Hamzah Dinillah/ (Folder pegawai)
│   │   │   ├── Fotokopi SK Jabatan Terakhir.pdf
│   │   │   ├── Fotokopi SK Kenaikan Pangkat Terakhir.pdf
│   │   │   ├── Fotokopi Penetapan Angka Kredit (PAK).pdf
│   │   │   └── ...
│   │   └── [Pegawai Lain]/
│   ├── Pengangkatan/            (Kategori: Pengangkatan dalam Jabfung)
│   │   └── [Folder pegawai]/
│   ├── Mutasi/                  (Kategori: Mutasi/Perpindahan)
│   │   └── [Folder pegawai]/
│   └── [Kategori Lain]/
```

## Setup Google Drive Integration

### 1. Google Cloud Console Setup

1. **Buka Google Cloud Console**
   - Kunjungi https://console.cloud.google.com/
   - Login dengan akun Google

2. **Buat atau Pilih Project**
   - Buat project baru atau pilih project yang sudah ada
   - Catat Project ID untuk referensi

3. **Aktifkan Google Drive API**
   ```
   Navigation: APIs & Services > Library
   Search: "Google Drive API"
   Click: Enable
   ```

4. **Buat API Key**
   ```
   Navigation: APIs & Services > Credentials
   Click: + CREATE CREDENTIALS > API Key
   Copy: API Key yang dihasilkan
   (Optional) Restrict: Tambahkan restriksi untuk Google Drive API
   ```

5. **Buat OAuth 2.0 Client ID**
   ```
   Navigation: APIs & Services > Credentials
   Click: + CREATE CREDENTIALS > OAuth 2.0 Client ID
   Application Type: Web application
   Name: SIPANDAI Google Drive Integration
   
   Authorized JavaScript origins:
   - http://localhost:5173 (untuk development)
   - https://yourdomain.com (untuk production)
   
   Copy: Client ID yang dihasilkan
   ```

### 2. Environment Variables Setup

Buat file `.env` di root project dengan konfigurasi berikut:

```env
# Google Drive Integration
VITE_GOOGLE_DRIVE_API_KEY=your_api_key_here
VITE_GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
```

**Contoh:**
```env
VITE_GOOGLE_DRIVE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_GOOGLE_DRIVE_CLIENT_ID=123456789012-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

### 3. Domain Authorization

Pastikan domain aplikasi Anda sudah terdaftar di Google Cloud Console:

**Development:**
- `http://localhost:5173`
- `http://localhost:3000`

**Production:**
- `https://yourdomain.com`
- `https://www.yourdomain.com`

## Cara Kerja Integrasi

### 1. Autentikasi
- User perlu melakukan autentikasi Google Drive saat pertama kali menggunakan fitur upload
- Autentikasi menggunakan OAuth 2.0 dengan scope `https://www.googleapis.com/auth/drive.file`
- Token disimpan di browser session

### 2. Upload Dokumen
- Sistem secara otomatis membuat struktur folder berdasarkan:
  - **Kategori pengajuan** (dari submission type)
  - **Nama pegawai** (dari data pegawai yang dipilih)
- File dikompres dan di-upload dengan nama yang deskriptif
- Metadata file disimpan di database lokal

### 3. Akses Dokumen
- File dapat diakses melalui link Google Drive
- Preview tersedia untuk file gambar dan PDF
- Download langsung melalui Google Drive

## Keamanan dan Permissions

### Scope Permissions
Aplikasi hanya meminta permission minimal:
- `auth/drive.file` - Hanya dapat mengakses file yang dibuat oleh aplikasi

### File Sharing
- File default bersifat private
- Hanya user yang mengupload dan admin Google Drive yang dapat mengakses
- Sharing dapat diatur manual melalui Google Drive interface

## Troubleshooting

### Error: "Google Drive belum dikonfigurasi"
**Solusi:**
1. Pastikan environment variables sudah diset dengan benar
2. Restart development server
3. Clear browser cache

### Error: "Origin not allowed"
**Solusi:**
1. Buka Google Cloud Console > APIs & Services > Credentials
2. Edit OAuth 2.0 Client ID
3. Tambahkan domain yang benar di "Authorized JavaScript origins"
4. Tunggu beberapa menit untuk propagasi

### Error: "API Key restriction"
**Solusi:**
1. Buka Google Cloud Console > APIs & Services > Credentials
2. Edit API Key
3. Pastikan Google Drive API sudah ditambahkan di API restrictions
4. Atau hilangkan semua restrictions untuk testing

### Error: "Quota exceeded"
**Solusi:**
1. Buka Google Cloud Console > APIs & Services > Quotas
2. Periksa usage Google Drive API
3. Request quota increase jika diperlukan

## Development Notes

### Testing
```bash
# Test Google Drive connection
npm run dev
# Navigate to submission page
# Check browser console for Google Drive logs
```

### File Naming Convention
- Format: `[Requirement Name].[extension]`
- Contoh: `Fotokopi SK Jabatan Terakhir.pdf`
- Special characters dihilangkan untuk kompatibilitas

### Error Handling
- Fallback ke upload lokal jika Google Drive gagal
- User notification untuk setiap error
- Automatic retry untuk network errors

## Production Deployment

### Environment Variables
Pastikan production environment memiliki:
```env
VITE_GOOGLE_DRIVE_API_KEY=production_api_key
VITE_GOOGLE_DRIVE_CLIENT_ID=production_client_id
```

### Domain Setup
1. Update authorized domains di Google Cloud Console
2. Test authorization flow di production
3. Monitor Google Drive API quota usage

### Security Checklist
- [ ] API Key restrictions configured
- [ ] OAuth domain restrictions enabled
- [ ] File sharing permissions reviewed
- [ ] Error logging implemented
- [ ] Quota monitoring setup

## Support

Untuk bantuan lebih lanjut:
1. Check browser console untuk error details
2. Verify Google Cloud Console configuration
3. Test dengan akun Google yang berbeda
4. Contact system administrator
