import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { sendNotification } from '@/services/notificationService';
import { getSubmissionTypeById } from '@/data/submissionTypes';
import { googleDriveService } from '@/services/googleDriveService';
import PersonalInfoForm from '@/components/submission/PersonalInfoForm';
import RequirementsChecklist from '@/components/submission/RequirementsChecklist';
import AdditionalNotes from '@/components/submission/AdditionalNotes';
import { ArrowLeft, Send, FileText, User, FileCheck } from 'lucide-react';

const SubmissionForm = ({ type: propType, onSuccess, onCancel }) => {
  const { type: urlType } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissionType, setSubmissionType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({});
  
  // Use prop type if provided, otherwise use URL param
  const type = propType || urlType;
  const [formData, setFormData] = useState({
    personalInfo: {
      name: '',
      nip: '',
      position: '',
      unit: '',
      phone: '',
      email: ''
    },
    documents: {},
    notes: '',
    checkedRequirements: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      const handleCancel = () => {
        if (onCancel) {
          onCancel();
        } else if (window.confirm('Apakah Anda yakin ingin membatalkan pengisian form? Perubahan yang belum disimpan akan hilang.')) {
          navigate('/pengajuan/baru');
        }
      };
      return;
    }

    const typeData = getSubmissionTypeById(type);
    if (!typeData) {
      toast({
        title: "Jenis usulan tidak ditemukan",
        description: "Silakan pilih jenis usulan yang valid",
        variant: "destructive"
      });
      navigate('/admin-unit');
      return;
    }

    setSubmissionType(typeData);
    
    const initialDocs = {};
    typeData.requirements.forEach((req, index) => {
      initialDocs[index] = null;
    });
    setFormData(prev => ({
      ...prev,
      documents: initialDocs,
      checkedRequirements: []
    }));
  }, [type, user, navigate, toast]);

  const handlePersonalInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const handleFileUpload = async (requirementIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Set status uploading
    setUploading(prev => ({ ...prev, [requirementIndex]: true }));

    try {
      // Inisialisasi Google Drive Service
      if (!googleDriveService.isInitialized) {
        await googleDriveService.initialize();
      }

      // Autentikasi jika belum login
      await googleDriveService.authenticate();

      // Buat struktur folder
      const folderStructure = await googleDriveService.createSubmissionFolderStructure(
        submissionType,
        formData.personalInfo.name || 'Pegawai'
      );

      // Upload file ke Google Drive
      const uploadedFile = await googleDriveService.uploadFile(
        file, 
        folderStructure.employeeFolderId,
        file.name
      );

      // Update state dengan informasi file yang diupload
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [requirementIndex]: {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            driveFileId: uploadedFile.id,
            driveWebViewLink: uploadedFile.webViewLink,
            driveDownloadLink: uploadedFile.webContentLink
          }
        }
      }));

      toast({
        title: 'Berhasil!',
        description: `${file.name} berhasil diunggah ke Google Drive`,
      });
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      
      toast({
        title: 'Gagal mengunggah file',
        description: error.message || 'Terjadi kesalahan saat mengunggah file',
        variant: 'destructive',
      });

      // Reset file input
      event.target.value = null;
    } finally {
      setUploading(prev => ({ ...prev, [requirementIndex]: false }));
    }
  };

  const handleRequirementCheck = (index, checked) => {
    setFormData(prev => ({
      ...prev,
      checkedRequirements: checked 
        ? [...prev.checkedRequirements, index]
        : prev.checkedRequirements.filter(i => i !== index)
    }));
  };

  const isFormComplete = () => {
    const { personalInfo, checkedRequirements } = formData;
    
    // Cek apakah semua field personal info terisi
    const isPersonalInfoComplete = 
      personalInfo.name && 
      personalInfo.nip && 
      personalInfo.position && 
      personalInfo.unit && 
      personalInfo.phone && 
      personalInfo.email;
    
    // Cek apakah semua persyaratan sudah dicentang
    const areAllRequirementsChecked = 
      submissionType && 
      checkedRequirements.length === submissionType.requirements.length;
    
    return isPersonalInfoComplete && areAllRequirementsChecked;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { personalInfo, checkedRequirements } = formData;
    
    if (!personalInfo.name || !personalInfo.nip || !personalInfo.position) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi informasi personal",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (checkedRequirements.length !== submissionType.requirements.length) {
      toast({
        title: "Persyaratan belum lengkap",
        description: "Mohon centang semua persyaratan yang telah dipenuhi",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const submission = {
        id: Date.now(),
        type: submissionType.id,
        typeTitle: submissionType.title,
        status: 'pending',
        submittedBy: user.id,
        submitterName: personalInfo.name,
        submittedAt: new Date().toISOString(),
        personalInfo: formData.personalInfo,
        documents: formData.documents,
        notes: formData.notes,
        requirements: submissionType.requirements,
        checkedRequirements: formData.checkedRequirements,
      };

      const existingSubmissions = JSON.parse(localStorage.getItem('sipandai_submissions') || '[]');
      localStorage.setItem(
        'sipandai_submissions',
        JSON.stringify([...existingSubmissions, submission])
      );

      // Dapatkan daftar admin
      const adminUsers = JSON.parse(localStorage.getItem('sipandai_users') || '[]')
        .filter(u => u.role === 'admin-master')
        .map(u => u.id);
      
      // Kirim notifikasi ke admin
      if (adminUsers.length > 0) {
        // Dapatkan email admin dari localStorage
        const adminUsersData = JSON.parse(localStorage.getItem('sipandai_users') || '[]')
          .filter(u => u.role === 'admin-master');
        
        await Promise.all(adminUsersData.map(admin => 
          sendNotification({
            userId: admin.id,
            email: admin.email, // Sertakan email admin
            title: 'Pengajuan Baru',
            message: `Ada pengajuan baru dari ${personalInfo.name} (${personalInfo.unit || 'Tidak ada unit'})`,
            type: 'info',
            link: `/submissions/${submission.id}`,
            submission: submission // Sertakan data pengajuan untuk email
          })
        ));
      }

      // Notifikasi ke pengguna
      await sendNotification({
        userId: user.id,
        title: 'Pengajuan Diterima',
        message: `Pengajuan ${submissionType.title} Anda telah berhasil dikirim`,
        type: 'success'
      });

      toast({
        title: 'Berhasil!',
        description: 'Pengajuan berhasil dikirim.',
      });

      // Panggil onSuccess callback jika ada, jika tidak arahkan ke riwayat
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin-unit');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Kirim notifikasi error ke pengguna
      if (user?.id) {
        await sendNotification({
          userId: user.id,
          title: 'Gagal Mengirim Pengajuan',
          message: 'Terjadi kesalahan saat mengirim pengajuan. Silakan coba lagi.',
          type: 'error'
        });
      }
      
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengirim pengajuan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!submissionType) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-300">Memuat data pengajuan...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8">
    <div className="container mx-auto px-4 max-w-5xl">
      <Helmet>
        <title>{`Buat Usulan - ${submissionType.title} - SIPANDAI`}</title>
        <meta name="description" content={`Form pengajuan untuk ${submissionType.title} di sistem SIPANDAI.`} />
      </Helmet>
      
      <div className="mb-8">
        <Link 
          to="/pengajuan/baru"
          className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Daftar Pengajuan
        </Link>
        
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">
                {submissionType?.title || 'Buat Usulan Baru'}
              </h1>
              <p className="text-gray-400">
                Lengkapi semua informasi yang diperlukan untuk mengajukan {submissionType?.title?.toLowerCase() || 'pengajuan baru'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PersonalInfoForm 
            data={formData.personalInfo} 
            onChange={handlePersonalInfoChange} 
          />
        </motion.div>
        
        {submissionType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <RequirementsChecklist 
              submissionType={submissionType}
              formData={formData}
              handleFileUpload={handleFileUpload}
              handleRequirementCheck={handleRequirementCheck}
              uploading={uploading}
            />
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AdditionalNotes 
            value={formData.notes}
            onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
          />
        </motion.div>
        
        <motion.div 
          className="sticky bottom-0 bg-gray-900/80 backdrop-blur-md py-4 -mx-4 px-4 border-t border-gray-800 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              Pastikan semua data yang Anda masukkan sudah benar sebelum mengirimkan pengajuan.
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                type="button"
                variant="outline"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex-1 sm:flex-none border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white"
              >
                Tinjau Kembali
              </Button>
              
              <Button 
                type="submit" 
                disabled={loading || !isFormComplete()}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-6 text-base transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  <>
                    Kirim Pengajuan
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </form>
    </div>
  </div>
  );
};

export default SubmissionForm;