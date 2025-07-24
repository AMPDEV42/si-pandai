import mongoose from 'mongoose';

const riwayatDiklatSchema = new mongoose.Schema({
  namaDiklat: { type: String, required: true },
  penyelenggara: { type: String, required: true },
  tahun: { type: Number, required: true },
  jumlahJam: { type: Number, required: true },
  sertifikat: { type: String } // URL ke file sertifikat
}, { _id: false });

const pegawaiSchema = new mongoose.Schema({
  nama: { 
    type: String, 
    required: [true, 'Nama pegawai harus diisi'] 
  },
  nip: { 
    type: String, 
    required: [true, 'NIP harus diisi'],
    unique: true
  },
  pangkatGolongan: { 
    type: String, 
    required: [true, 'Pangkat/Golongan harus diisi'] 
  },
  tempatLahir: { 
    type: String, 
    required: [true, 'Tempat lahir harus diisi'] 
  },
  tanggalLahir: { 
    type: Date, 
    required: [true, 'Tanggal lahir harus diisi'] 
  },
  tmt: { 
    type: Date, 
    required: [true, 'TMT harus diisi'] 
  },
  masaKerja: {
    tahun: { type: Number },
    bulan: { type: Number }
  },
  jabatan: { 
    type: String, 
    required: [true, 'Jabatan harus diisi'] 
  },
  unitKerja: { 
    type: String, 
    required: [true, 'Unit kerja harus diisi'] 
  },
  riwayatDiklat: [riwayatDiklatSchema],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Middleware untuk menghitung masa kerja sebelum menyimpan data
pegawaiSchema.pre('save', function(next) {
  if (this.tmt) {
    const today = new Date();
    const tmtDate = new Date(this.tmt);
    
    let years = today.getFullYear() - tmtDate.getFullYear();
    let months = today.getMonth() - tmtDate.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < tmtDate.getDate())) {
      years--;
      months += 12;
    }
    
    this.masaKerja = {
      tahun: years,
      bulan: months
    };
  }
  
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Pegawai || mongoose.model('Pegawai', pegawaiSchema);
