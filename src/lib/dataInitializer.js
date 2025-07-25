// Data initialization utility to populate sample data for testing
const sampleSubmissions = [
  {
    id: 'SUB-001',
    title: 'Usulan Kenaikan Pangkat',
    submitterName: 'Dr. Ahmad Wahyudi, S.Kom, M.T',
    submittedBy: 'admin-user-1',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    personalInfo: {
      unit: 'Dinas Komunikasi dan Informatika',
      nip: '197501012000031001',
      golongan: 'III/c',
      jabatan: 'Kepala Bidang Teknologi Informasi'
    },
    documents: [],
    notes: 'Usulan kenaikan pangkat reguler sesuai ketentuan yang berlaku.',
    submissionType: 'kenaikan-pangkat'
  },
  {
    id: 'SUB-002',
    title: 'Usulan Cuti Tahunan',
    submitterName: 'Siti Nurhaliza, S.E',
    submittedBy: 'admin-user-2',
    status: 'approved',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    personalInfo: {
      unit: 'Bagian Keuangan',
      nip: '198203152005022001',
      golongan: 'III/a',
      jabatan: 'Bendahara'
    },
    documents: [],
    notes: 'Cuti tahunan untuk keperluan keluarga.',
    submissionType: 'cuti-tahunan'
  },
  {
    id: 'SUB-003',
    title: 'Usulan Mutasi Internal',
    submitterName: 'Budi Santoso, S.T',
    submittedBy: 'admin-user-3',
    status: 'revision',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    personalInfo: {
      unit: 'Bagian Umum',
      nip: '198705102010011001',
      golongan: 'II/d',
      jabatan: 'Staff Umum'
    },
    documents: [],
    notes: 'Usulan mutasi ke bagian teknis sesuai kompetensi.',
    submissionType: 'mutasi-internal'
  },
  {
    id: 'SUB-004',
    title: 'Usulan Kenaikan Gaji Berkala',
    submitterName: 'Maria Magdalena, S.Pd',
    submittedBy: 'admin-user-4',
    status: 'rejected',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    personalInfo: {
      unit: 'Dinas Pendidikan',
      nip: '198912252014022001',
      golongan: 'III/b',
      jabatan: 'Guru Ahli Pertama'
    },
    documents: [],
    notes: 'Usulan KGB sesuai masa kerja.',
    submissionType: 'kenaikan-gaji-berkala'
  },
  {
    id: 'SUB-005',
    title: 'Usulan Pensiun Dini',
    submitterName: 'H. Muhammad Ali, S.H',
    submittedBy: 'admin-user-5',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    personalInfo: {
      unit: 'Bagian Hukum',
      nip: '196505151990031001',
      golongan: 'IV/a',
      jabatan: 'Kepala Bagian Hukum'
    },
    documents: [],
    notes: 'Usulan pensiun dini karena alasan kesehatan.',
    submissionType: 'pensiun-dini'
  }
];

export const initializeSampleData = () => {
  const existingData = localStorage.getItem('sipandai_submissions');
  
  if (!existingData || JSON.parse(existingData).length === 0) {
    localStorage.setItem('sipandai_submissions', JSON.stringify(sampleSubmissions));
    console.log('Sample submission data initialized');
    return sampleSubmissions;
  }
  
  return JSON.parse(existingData);
};

export const getSampleSubmissions = () => {
  return sampleSubmissions;
};

export const clearAllData = () => {
  localStorage.removeItem('sipandai_submissions');
  console.log('All submission data cleared');
};
