export const submissionTypes = [
  {
    id: 'pemberhentian-jabfung-tugas-belajar',
    title: 'Pemberhentian dari Jabfung karena tugas belajar',
    category: 'Pemberhentian',
    requirements: [
      'Fotokopi SK Jabatan Terakhir',
      'Fotokopi SK Kenaikan Pangkat Terakhir',
      'Fotokopi Penetapan Angka Kredit (PAK)',
      'Fotokopi SKP tahun terakhir',
      'Surat Tugas Belajar'
    ]
  },
  {
    id: 'pemberhentian-jabfung-tugas-struktural',
    title: 'Pemberhentian dari Jabfung karena ditugaskan secara penuh pada Jabatan Pimpinan Tinggi, Jabatan Administrator, Jabatan Pengawas, Jabatan Pelaksana, dan Atase Ketenagakerjaan (Atnaker)',
    category: 'Pemberhentian',
    requirements: [
      'Fotokopi SK Jabatan Terakhir',
      'Fotokopi SK Kenaikan Pangkat Terakhir',
      'Fotokopi Penetapan Angka Kredit (PAK)',
      'Fotokopi SKP tahun terakhir',
      'Fotokopi SK Promosi sebagai Struktural'
    ]
  },
  {
    id: 'pemberhentian-jabfung-mengundurkan-diri',
    title: 'Pemberhentian dari jabfung karena mengundurkan diri',
    category: 'Pemberhentian',
    requirements: [
      'Berita acara pengunduran diri (dilakukan pemeriksaan terlebih dahulu oleh pimpinan ybs)',
      'Rekomendasi dari instansi pembina JF',
      'Surat pernyataan ybs (wajib disampaikan secara tertulis kepada Sesditjen dengan menyertakan alasan)',
      'Fotokopi SK Jabatan Terakhir',
      'Fotokopi SK Kenaikan Pangkat Terakhir',
      'Fotokopi Penetapan Angka Kredit (PAK)',
      'Fotokopi SKP tahun terakhir'
    ]
  },
  {
    id: 'pengangkatan-kembali-jabfung',
    title: 'Pengangkatan Kembali dalam Jabfung',
    category: 'Pengangkatan',
    requirements: [
      'Fotokopi SK Jabatan Terakhir',
      'Fotokopi SK Pemberhentian dari Jabatan Fungsional',
      'Fotokopi Penetapan Angka Kredit (PAK) terakhir',
      'Fotokopi SKP tahun terakhir',
      'Fotokopi SK PNS',
      'Fotokopi SK Kenaikan Pangkat Terakhir',
      'Fotokopi Ijazah terakhir',
      'Ijazah,Transkrip Nilai (Pengangkatan kembali karena tugas belajar)'
    ]
  },
  {
    id: 'pengangkatan-pertama-jabfung',
    title: 'Pengangkatan Pertama dalam Jabfung',
    category: 'Pengangkatan',
    requirements: [
      'Fotokopi KARPEG',
      'Fotokopi SK CPNS',
      'Fotokopi SK Pengangkatan CPNS menjadi PNS',
      'Fotokopi Ijazah Pendidikan terakhir',
      'Fotokopi STTPP (sertifikat) Diklat Dasar Instruktur',
      'Fotokopi kenaikan pangkat terakhir',
      'Fotokopi Penetapan Angka Kredit (PAK) pertama',
      'Fotokopi STTPP (sertifikat) diklat prajabatan'
    ]
  },
  {
    id: 'pengangkatan-jabfung-inpassing',
    title: 'Pengangkatan dalam Jabfung melalui Inpassing',
    category: 'Pengangkatan',
    requirements: [
      'Fotokopi Karpeg',
      'Fotokopi SK CPNS',
      'Foto copy SK PNS',
      'Foto copy SK Kenaikan Pangkat Terakhir',
      'Foto copy SK Jabatan Terakhir',
      'Foto copy SKP Terakhir',
      'Fotokopi Ijazah terakhir',
      'Fotokopi rekomendasi Inpassing'
    ]
  },
  {
    id: 'pengangkatan-jabfung-dari-pelaksana',
    title: 'Pengangkatan dalam Jabfung (Pelaksana ke Jabfung)',
    category: 'Pengangkatan',
    requirements: [
      'Wajib mengikuti dan lulus uji kompetensi teknis, manajerial, dan sosial kultural [Note: *lampirkan sertifikat uji kompetensi]',
      'Memiliki pengalaman di bidang JF paling kurang 2 tahun [Note: *dibuktikan dengan surat keterangan atasan langsung]',
      'Berusia paling tinggi: 53 tahun (JF Ahli Pertama/Muda), 55 tahun (JF Ahli Madya), 60 tahun (JF Ahli Utama eks Pejabat Pimpinan Tinggi)',
      'Fotokopi Karpeg',
      'Fotokopi SK CPNS',
      'Foto copy SK PNS',
      'Foto copy SK Kenaikan Pangkat Terakhir',
      'Foto copy SK Jabatan Terakhir',
      'Foto copy SKP minimal "baik" 2 tahun terakhir',
      'Fotokopi Ijazah terakhir'
    ]
  },
  {
    id: 'alih-jabatan-jft',
    title: 'Alih Jabatan (JFT ke JFT)',
    category: 'Alih Jabatan',
    requirements: [
      'Formasi/peta jabatan [Note: harus sesuai ABK di aplikasi Sianjab (https://bit.ly/anjab-kemenaker)]',
      'Foto copy SK Pemberhentian dari jabfung sebelumnya [Note: WAJIB mengajukan pemberhentian JF terlebih dahulu]',
      'Berita acara pengunduran diri',
      'Surat Pernyataan (alasan berhenti)',
      'Foto copy Kartu Pegawai',
      'Foto copy SK CPNS dan PNS',
      'Foto copy SK Jabatan Terakhir',
      'Foto copy SK Kenaikan Pangkat Terakhir',
      'Foto copy Ijazah Terakhir',
      'Foto copy SKP terakhir'
    ]
  },
  {
    id: 'kenaikan-jabfung-tertentu',
    title: 'Kenaikan Jabatan Fungsional Tertentu (JFT)',
    category: 'Kenaikan Jabatan',
    requirements: [
      'Fotokopi KARPEG',
      'Fotokopi SKP 2 tahun terakhir bernilai baik',
      'Fotokopi SK Kenaikan Pangkat terakhir',
      'Fotokopi SK jabatan terakhir',
      'Fotokopi Ijazah terakhir',
      'Fotokopi SK Penetapan Angka Kredit (PAK) Terakhir [Note: Berurut dari nilai PAK pada SK KP terakhir hingga saat ini]',
      'Rekomendasi/sertifikat Uji Kompetensi dari Instansi Pembina'
    ]
  },
  {
    id: 'uji-kompetensi-kenaikan-jft-instruktur',
    title: 'Uji Kompetensi untuk Kenaikan JFT Instruktur',
    category: 'Uji Kompetensi',
    requirements: [
      'Dokumen portofolio',
      'Fotokopi Ijazah terakhir',
      'Surat Rekomendasi ketersediaan jenjang jabatan [Note: sesuai anjab-abk (https://bit.ly/anjab-kemenaker)]',
      'Fotokopi STTPP Sertifikat Diklat Dasar Instruktur',
      'Fotokopi Sertifikat pendukung'
    ]
  },
  {
    id: 'uji-kompetensi-kenaikan-jft-non-instruktur',
    title: 'Uji Kompetensi untuk Kenaikan JFT (selain Instruktur)',
    category: 'Uji Kompetensi',
    requirements: [
      'Dokumen portofolio',
      'Fotokopi Ijazah terakhir',
      'Surat keterangan ketersediaan jenjang jabatan [Note: sesuai anjab-abk (https://bit.ly/anjab-kemenaker)]',
      'Fotokopi SK Penetapan Angka Kredit (PAK) Terakhir',
      'Fotokopi SK jabatan terakhir',
      'Fotokopi Sertifikat pendukung'
    ]
  },
  {
    id: 'alih-kejuruan-instruktur',
    title: 'Alih Kejuruan (Instruktur)',
    category: 'Alih Kejuruan',
    requirements: [
      'Formasi/peta jabatan [Note: harus sesuai ABK di aplikasi Sianjab (https://bit.ly/anjab-kemenaker)]',
      'Fotokopi SK Jabatan terakhir',
      'Fotokopi SKP terakhir',
      'Fotokopi SK Pengangkatan Pertama sebagai Instruktur',
      'Fotokopi SK CPNS',
      'Fotokopi SK PNS',
      'Fotokopi Ijazah terakhir (sesuai bidang keahlian baru)',
      'Fotokopi Sertifikat Uji Kompetensi (bidang baru)',
      'Fotokopi Sertifikat Diklat (bidang baru)'
    ]
  },
  {
    id: 'alih-kategori-jabfung',
    title: 'Alih Kategori Jabfung (Terampil → Ahli)',
    category: 'Alih Kategori',
    requirements: [
      'Formasi/peta jabatan [Note: harus sesuai ABK di aplikasi Sianjab (https://bit.ly/anjab-kemenaker)]',
      'Fotokopi Penetapan Angka Kredit (ijazah S1/D4 sudah dinilai)',
      'Fotokopi surat penyesuaian gelar pendidikan',
      'Fotokopi SK Kenaikan Pangkat terakhir',
      'Fotokopi ijazah D4/S1',
      'Fotokopi STTPP Sertifikat diklat alih kategori',
      'Fotokopi SK jabatan terakhir',
      'Fotokopi SK pengangkatan pertama dalam jabfung',
      'Fotokopi SKP terakhir',
      'Fotokopi Sertifikat Uji Kompetensi'
    ]
  },
  {
    id: 'kenaikan-pangkat-fungsional-umum',
    title: 'Kenaikan Pangkat untuk Fungsional Umum (Pelaksana)',
    category: 'Kenaikan Pangkat',
    requirements: [
      'Fotokopi Kartu Pegawai (KARPEG)',
      'Fotokopi SK Pangkat Terakhir',
      'Fotokopi ijazah + transkrip nilai terakhir',
      'Fotokopi SKP 2 tahun terakhir'
    ]
  },
  {
    id: 'kenaikan-pangkat-struktural',
    title: 'Kenaikan Pangkat Pejabat Struktural',
    category: 'Kenaikan Pangkat',
    requirements: [
      'Fotokopi Kartu Pegawai (KARPEG)',
      'Fotokopi SK Pangkat Terakhir',
      'Fotokopi ijazah + transkrip nilai terakhir',
      'Fotokopi SKP 2 tahun terakhir',
      'Fotokopi SK Jabatan Terakhir',
      'Fotokopi surat pernyataan Pelantikan',
      'Fotokopi surat pernyataan Melaksanakan Tugas',
      'Fotokopi surat pernyataan Menduduki Jabatan',
      'Khusus Eselon III S1/Pangkat III/d: Wajib Lulus DIKLAT PIM III/Ujian Dinas'
    ]
  },
  {
    id: 'kenaikan-pangkat-jabatan-fungsional',
    title: 'Kenaikan Pangkat Pejabat Fungsional',
    category: 'Kenaikan Pangkat',
    requirements: [
      'Fotokopi Kartu Pegawai (KARPEG)',
      'Fotokopi SK Pangkat Terakhir',
      'Fotokopi ijazah + transkrip nilai terakhir',
      'Fotokopi SKP 2 tahun terakhir',
      'Fotokopi SK Jabatan Fungsional Terakhir',
      'Fotokopi PAK lengkap (dari SK Pangkat terakhir hingga PAK terakhir)',
      'PAK terakhir harus ASLI',
      'Khusus alih kategori: Wajib lulus diklat alih kategori & ijazah dinilai dalam PAK'
    ]
  },
  {
    id: 'pertama-kali-naik-pangkat',
    title: 'Pertama Kali Naik Pangkat',
    category: 'Kenaikan Pangkat',
    requirements: [
      'Fotokopi Kartu Pegawai (KARPEG)',
      'Fotokopi SK Pangkat Terakhir',
      'Fotokopi ijazah + transkrip nilai terakhir',
      'Fotokopi SKP 2 tahun terakhir',
      'Fotokopi SK CPNS'
    ]
  },
  {
    id: 'kenaikan-pangkat-penyesuaian-ijazah',
    title: 'Kenaikan Pangkat Penyesuaian Ijazah',
    category: 'Kenaikan Pangkat',
    requirements: [
      'Fotokopi Kartu Pegawai (KARPEG)',
      'Fotokopi SK Pangkat Terakhir',
      'Fotokopi ijazah + transkrip nilai terakhir',
      'Fotokopi SKP 2 tahun terakhir',
      'Fotokopi Surat Tanda Lulus Ujian Penyesuaian',
      'Uraian Tugas',
      'Fotokopi ijazah + transkrip nilai terakhir (legalisir ASLI)'
    ]
  },
  {
    id: 'kenaikan-pangkat-golongan-iid-iiia',
    title: 'Kenaikan Pangkat Golongan II/d ke III/a',
    category: 'Kenaikan Pangkat',
    requirements: [
      'Fotokopi Kartu Pegawai (KARPEG)',
      'Fotokopi SK Pangkat Terakhir',
      'Fotokopi ijazah + transkrip nilai terakhir',
      'Fotokopi SKP 2 tahun terakhir',
      'Fotokopi Surat Tanda Lulus Ujian Dinas'
    ]
  },
  {
    id: 'mutasi-pindah',
    title: 'Mutasi Pindah',
    category: 'Mutasi',
    requirements: [
      'Surat Pernyataan Lolos Butuh (Asli)',
      'Surat Keterangan Bebas Hukuman Disiplin (Asli)',
      'Surat Keterangan Bebas Tugas Belajar (Asli)',
      'Surat Keterangan Bebas Hutang Bank (Asli)',
      'Surat Pernyataan Bebas Temuan ITJEN (Asli)',
      'ANJAB dan ABK (untuk pindah antar kementerian)',
      'SK CPNS (Fotokopi legalisir)',
      'SK PNS (Fotokopi legalisir)',
      'SK Pangkat Terakhir (Fotokopi legalisir)',
      'SK Jabatan Terakhir (Fotokopi legalisir)',
      'KARPEG (Fotokopi legalisir)',
      'Ijazah + Transkrip (Fotokopi legalisir)',
      'SKP 2 tahun terakhir (Fotokopi legalisir)',
      'Surat permohonan mutasi',
      'Daftar Riwayat Hidup (DRH) format BKN'
    ]
  }
];

export const getSubmissionTypeById = (id) => {
  return submissionTypes.find(type => type.id === id);
};

export const getSubmissionsByCategory = () => {
  const categories = {};
  submissionTypes.forEach(type => {
    if (!categories[type.category]) {
      categories[type.category] = [];
    }
    categories[type.category].push(type);
  });
  return categories;
};