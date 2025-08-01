# Google Drive Integration - Vercel Deployment Setup

## ✅ Persiapan Konfigurasi untuk sipandai.vercel.app

### 1. **Environment Variables Vercel**

Di dashboard Vercel, pastikan environment variables berikut sudah dikonfigurasi:

```bash
# Google Drive API Configuration
VITE_GOOGLE_DRIVE_API_KEY=AIzaSyAUKwdfTj5iy2irq67WuHpdUjXOgSpXO3U
VITE_GOOGLE_DRIVE_CLIENT_ID=47138776708-suu99tvg4v2l4248ololg59hvsevpo13.apps.googleusercontent.com

# Supabase Configuration
VITE_SUPABASE_URL=https://lttyyqjqclphsgdbjgdt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0dHl5cWpxY2xwaHNnZGJqZ2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTAyOTksImV4cCI6MjA2ODg4NjI5OX0.ve5_PUzdli7oGzsD8OmkJg-FNMzcnSTivKwKOXgWiU4

# Email Configuration
VITE_EMAIL_HOST=smtp.gmail.com
VITE_EMAIL_PORT=587
VITE_EMAIL_USER=alhadimediadesign@gmail.com
VITE_EMAIL_PASSWORD=ceky bkbc pbuf dmlk

# Google Drive Debug (optional)
VITE_DEBUG_GOOGLE_DRIVE=true
```

### 2. **Google Cloud Console Setup**

#### ✅ Domain Authorization yang Diperlukan

Tambahkan domain berikut ke **Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client ID**:

**Authorized JavaScript origins:**
```
https://sipandai.vercel.app
```

**Authorized redirect URIs (optional, untuk future use):**
```
https://sipandai.vercel.app/auth/google/callback
```

#### 📋 Langkah-langkah Detail:

1. **Buka Google Cloud Console:**
   - URL: https://console.cloud.google.com/apis/credentials

2. **Temukan OAuth 2.0 Client ID:**
   - Client ID: `47138776708-suu99tvg4v2l4248ololg59hvsevpo13.apps.googleusercontent.com`

3. **Edit Configuration:**
   - Klik tombol "Edit" (ikon pensil)

4. **Tambah Authorized JavaScript Origins:**
   - Klik "ADD URI" di bagian "Authorized JavaScript origins"
   - Masukkan: `https://sipandai.vercel.app`

5. **Save Configuration:**
   - Klik "SAVE"
   - ⏱️ Tunggu 5-10 menit untuk propagasi

### 3. **Verifikasi Konfigurasi**

#### ✅ Implementasi yang Sudah Dipersiapkan

Aplikasi sudah dikonfigurasi untuk menggunakan domain dinamis:

1. **Dynamic Domain Detection:**
   - Semua komponen menggunakan `window.location.origin`
   - Tidak ada hardcoded domain dalam kode produksi

2. **Environment-based Configuration:**
   - API Key dan Client ID dibaca dari environment variables
   - Konfigurasi otomatis berdasarkan deployment environment

3. **Error Handling:**
   - Pesan error yang informatif dengan instruksi spesifik
   - Auto-detection untuk domain authorization issues

#### 🧪 Testing After Deployment

Setelah deploy ke Vercel, test dengan:

1. **Buka aplikasi di browser:**
   ```
   https://sipandai.vercel.app
   ```

2. **Login dan navigate ke fitur upload:**
   - Login dengan akun admin
   - Buka halaman "Buat Usulan"
   - Coba upload dokumen

3. **Check Google Drive Authentication:**
   - Sistem akan otomatis mencoba autentikasi
   - Jika berhasil: Upload berfungsi normal
   - Jika gagal: Akan muncul instruksi domain authorization

### 4. **Troubleshooting**

#### ❌ Jika Muncul "Domain Authorization Required"

**Symptoms:**
- Error message tentang domain tidak authorized
- Google Drive authentication gagal
- Console error tentang iframe_initialization_failed

**Solutions:**
1. ✅ **Verifikasi domain di Google Cloud Console**
2. ⏱️ **Tunggu 5-10 menit setelah perubahan**
3. 🔄 **Clear browser cache**
4. 🧪 **Test di incognito window**

#### ❌ Jika Environment Variables Tidak Terdeteksi

**Check Vercel Dashboard:**
1. Project Settings > Environment Variables
2. Pastikan semua `VITE_*` variables sudah diset
3. Redeploy project setelah menambah variables

#### ❌ Jika Upload Masih Gagal

**Debug Steps:**
1. Open browser DevTools (F12)
2. Check Console untuk error messages
3. Network tab untuk failed requests
4. Gunakan komponen debug yang tersedia di aplikasi

### 5. **Domain Configuration Summary**

| Environment | Domain | Status |
|-------------|--------|---------|
| Development | `http://localhost:5173` | ✅ Configured |
| Production | `https://sipandai.vercel.app` | ✅ Ready to configure |

### 6. **Security Notes**

- API Key dan Client ID sudah dikonfigurasi untuk domain spesifik
- Tidak ada credentials yang di-hardcode dalam kode
- CORS policy akan membatasi akses hanya dari authorized domains
- Environment variables aman di Vercel (tidak exposed ke client)

### 7. **Next Steps**

1. ✅ Deploy aplikasi ke Vercel
2. ✅ Set environment variables di Vercel
3. ✅ Tambah `https://sipandai.vercel.app` ke Google Cloud Console
4. 🧪 Test Google Drive upload functionality
5. 📧 Inform team bahwa integrasi siap digunakan

---

**Note:** Implementasi sudah dipersiapkan untuk production deployment. Hanya perlu menambahkan domain `sipandai.vercel.app` ke Google Cloud Console untuk aktivasi penuh.
