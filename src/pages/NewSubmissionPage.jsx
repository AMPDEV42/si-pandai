import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, X, ChevronDown, ChevronUp, CheckCircle, Upload, File, Trash2, Loader2, Send, FileX, RefreshCw } from 'lucide-react';
import { getSubmissionsByCategory, getSubmissionTypeById } from '@/data/submissionTypes';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from "@/lib/customSupabaseClient";
import { formatFileSize } from '@/lib/utils';

// File upload configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  'application/pdf', 
  'image/jpeg', 
  'image/png', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const NewSubmissionPage = () => {
  // Handle card click to select submission type
  const handleCardClick = (e, typeId) => {
    e.stopPropagation();
    const type = getSubmissionTypeById(typeId);
    if (type) {
      // Navigate to improved submission page
      navigate(`/pengajuan/baru/${typeId}`);
    } else {
      toast({
        title: 'Error',
        description: 'Jenis pengajuan tidak ditemukan',
        variant: 'destructive'
      });
    }
  };
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  // State management
  const [categories, setCategories] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedType, setSelectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    files: []
  });
  
  // Document state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        if (!user) {
          navigate('/login', { state: { from: '/pengajuan/baru' } });
          return;
        }

        // Check user role
        if (user.role !== 'admin-unit' && user.role !== 'admin-master') {
          toast({
            title: 'Akses Ditolak',
            description: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
            variant: 'destructive'
          });
          navigate('/unauthorized');
          return;
        }

        // Load submission categories
        const data = getSubmissionsByCategory();
        setCategories(data);
        
        // Initialize expanded state for each category
        const initialExpanded = {};
        Object.keys(data).forEach(category => {
          initialExpanded[category] = true;
        });
        setExpandedCategories(initialExpanded);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Gagal memuat daftar kategori. Silakan coba lagi nanti.');
        toast({
          title: 'Terjadi Kesalahan',
          description: 'Gagal memuat daftar kategori. Silakan coba lagi nanti.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCategories();
  }, [user, navigate, toast]);
  
  const toggleCategory = (category) => {
    console.log('Toggling category:', category);
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check total files limit
    if (uploadedFiles.length + files.length > 10) {
      toast({
        title: 'Batas file tercapai',
        description: 'Maksimal 10 file yang dapat diunggah',
        variant: 'destructive',
      });
      return;
    }

    const newFiles = [];
    const invalidFiles = [];
    const duplicateFiles = [];

    // Check for duplicate file names
    const existingFileNames = uploadedFiles.map(f => f.name.toLowerCase());

    files.forEach((file) => {
      // Check if file already exists
      if (existingFileNames.includes(file.name.toLowerCase())) {
        duplicateFiles.push(file.name);
        return;
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        invalidFiles.push(`${file.name} (Format tidak didukung)`);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (Ukuran melebihi ${formatFileSize(MAX_FILE_SIZE)})`);
        return;
      }

      // Add to new files
      newFiles.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
        error: null
      });
    });

    // Show error for duplicate files
    if (duplicateFiles.length > 0) {
      toast({
        title: 'File sudah ada',
        description: (
          <div className="space-y-1">
            {duplicateFiles.slice(0, 3).map((name, i) => (
              <div key={i} className="text-sm">• {name}</div>
            ))}
            {duplicateFiles.length > 3 && (
              <div className="text-sm">...dan {duplicateFiles.length - 3} file lainnya</div>
            )}
          </div>
        ),
        variant: 'destructive',
        duration: 5000,
      });
    }

    // Show error for invalid files
    if (invalidFiles.length > 0) {
      toast({
        title: `${invalidFiles.length} file tidak valid`,
        description: (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {invalidFiles.slice(0, 5).map((msg, i) => (
              <div key={i} className="text-sm">• {msg}</div>
            ))}
            {invalidFiles.length > 5 && (
              <div className="text-sm">...dan {invalidFiles.length - 5} file lainnya</div>
            )}
          </div>
        ),
        variant: 'destructive',
        duration: 5000,
      });
    }

    // Add valid files to the list
    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Show success message
      if (newFiles.length > 3) {
        toast({
          title: `${newFiles.length} file berhasil ditambahkan`,
          description: 'File siap diunggah',
          variant: 'default',
        });
      } else {
        toast({
          title: 'File siap diunggah',
          description: (
            <div className="space-y-1">
              {newFiles.map((file, i) => (
                <div key={i} className="text-sm">• {file.name} ({formatFileSize(file.size)})</div>
              ))}
            </div>
          ),
          variant: 'default',
        });
      }
    }

    // Reset file input
    e.target.value = '';
  };

  // Handle file removal
  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle retry upload for failed files
  const handleRetryUpload = async (file, index) => {
    try {
      // Reset file status to pending
      setUploadedFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'pending', error: null, progress: 0 } : f
      ));
      
      // Trigger the upload
      await handleUpload(file.file || file, index);
      
      toast({
        title: 'Mengunggah ulang file',
        description: `${file.name} berhasil diunggah ulang`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Retry upload error:', error);
      setUploadedFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error', error: error.message || 'Gagal mengunggah ulang file' } : f
      ));
      
      toast({
        title: 'Gagal mengunggah ulang',
        description: `Gagal mengunggah ulang ${file.name}. ${error.message || 'Silakan coba lagi nanti.'}`,
        variant: 'destructive',
      });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle modal close
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Judul pengajuan harus diisi';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Deskripsi pengajuan harus diisi';
    }
    
    if (uploadedFiles.length === 0) {
      errors.files = 'Minimal unggah satu dokumen';
    } else {
      // Check if all required documents are uploaded
      const uploadedDocTypes = new Set(uploadedFiles.map(f => f.name));
      const missingDocs = selectedType.requirements.filter(
        req => !Array.from(uploadedDocTypes).some(name => 
          name.toLowerCase().includes(req.toLowerCase().substring(0, 10))
        )
      );
      
      if (missingDocs.length > 0) {
        errors.files = `Dokumen berikut masih diperlukan: ${missingDocs.join(', ')}`;
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle file upload with progress tracking
  const handleUpload = async (file, index) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${Date.now()}_${fileName}`;

    // Update file status to uploading
    setUploadedFiles(prev => prev.map((f, i) => 
      i === index ? { 
        ...f, 
        status: 'uploading', 
        progress: 0,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type
      } : f
    ));

    try {
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(filePath);

      // Update file status to completed
      const updatedFile = {
        ...uploadedFiles[index],
        status: 'completed',
        progress: 100,
        url: publicUrl,
        path: filePath
      };

      setUploadedFiles(prev => prev.map((f, i) => 
        i === index ? updatedFile : f
      ));

      return { 
        path: filePath, 
        url: publicUrl,
        name: file.name,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Upload error:', error);
      
      // Update file status to error
      setUploadedFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error', 
          error: error.message || 'Gagal mengunggah file' 
        } : f
      ));
      
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedType || !user?.id) {
      toast({
        title: 'Error',
        description: 'Sesi tidak valid. Silakan login ulang.',
        variant: 'destructive',
      });
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check if there are any files
    if (uploadedFiles.length === 0) {
      toast({
        title: 'Berkas dibutuhkan',
        description: 'Anda harus mengunggah setidaknya satu file',
        variant: 'destructive',
      });
      return;
    }

    // Check for any upload errors
    const hasErrors = uploadedFiles.some(file => file.status === 'error');
    if (hasErrors) {
      toast({
        title: 'Periksa file Anda',
        description: 'Beberapa file gagal diunggah. Harap periksa dan coba lagi.',
        variant: 'destructive',
      });
      return;
    }

    // Check for any pending uploads
    const hasPendingUploads = uploadedFiles.some(file => file.status === 'uploading');
    if (hasPendingUploads) {
      toast({
        title: 'Tunggu sebentar',
        description: 'Harap tunggu hingga semua file selesai diunggah',
        variant: 'default',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Show loading toast
    const toastId = toast({
      title: 'Mengirim pengajuan...',
      description: 'Harap tunggu sebentar',
      variant: 'default',
      duration: 10000, // 10 seconds
    });

    try {
      // Upload files first
      const uploadedFileData = [];
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        try {
          // If file is already uploaded, use its data
          if (file.status === 'completed' && file.url) {
            uploadedFileData.push({
              name: file.name,
              url: file.url,
              path: file.path,
              type: file.type,
              size: file.size
            });
            continue;
          }
          
          // Upload the file
          const result = await handleUpload(file.file || file, i);
          
          // Add to uploaded files array
          uploadedFileData.push({
            name: result.name,
            url: result.url,
            path: result.path,
            type: result.type,
            size: result.size
          });
          
          // Update toast progress
          const progress = Math.round(((i + 1) / uploadedFiles.length) * 100);
          toast.update(toastId, {
            description: `Mengunggah file ${i + 1} dari ${uploadedFiles.length} (${progress}%)`,
          });
          
          // Small delay between uploads to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw new Error(`Gagal mengunggah file: ${file.name}. ${error.message}`);
        }
      }

      // Create submission record
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert([
          {
            user_id: user.id,
            title: formData.title,
            description: formData.description,
            status: 'pending',
            type_id: selectedType.id,
            type_name: selectedType.title,
            files: uploadedFileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (submissionError) {
        console.error('Submission error:', submissionError);
        throw new Error('Gagal menyimpan data pengajuan. Silakan coba lagi.');
      }

      // Update toast to success
      toast.update(toastId, {
        title: 'Berhasil!',
        description: 'Pengajuan berhasil dikirim.',
        variant: 'default',
        duration: 3000,
      });

      // Close modal and reset form
      handleCloseModal();
      
      // Navigate to submissions list after a short delay
      setTimeout(() => {
        navigate('/pengajuan');
      }, 1000);
      
    } catch (error) {
      console.error('Submission error:', error);
      
      // Update toast to show error
      toast.update(toastId, {
        title: 'Gagal mengirim pengajuan',
        description: error.message || 'Terjadi kesalahan saat mengirim pengajuan',
        variant: 'destructive',
        duration: 5000,
      });
      
      // Re-throw to be caught by error boundary if needed
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleCloseModal = () => {
    setSelectedType(null);
    setFormData({
      title: '',
      description: ''
    });
    setUploadedFiles([]);
    setValidationErrors({});
  };

  if (isLoading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">Memuat daftar pengajuan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="max-w-md w-full p-6 bg-gray-800 rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Muat Ulang Halaman
          </Button>
        </div>
      </div>
    );
  }

  console.log('Rendering main content');
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Buat Usulan Baru
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm max-w-2xl mx-auto">
            Pilih jenis pengajuan yang sesuai dengan kebutuhan Anda. Pastikan Anda telah mempersiapkan semua dokumen yang dibutuhkan.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(categories).map(([category, types]) => (
            <div key={category} className="space-y-2">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center text-base font-medium text-white hover:text-blue-400 transition-colors group w-full px-3 py-1.5 rounded-lg hover:bg-gray-800/50"
              >
                {expandedCategories[category] ? (
                  <ChevronDown className="h-4 w-4 mr-2 text-blue-400 group-hover:text-blue-300 transition-colors" />
                ) : (
                  <ChevronUp className="h-4 w-4 mr-2 text-blue-400 group-hover:text-blue-300 transition-colors" />
                )}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {category}
                </span>
              </button>
              
              {expandedCategories[category] && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {types.map((type) => (
                    <motion.div
                      key={type.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <Card
                        className="cursor-pointer h-full bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 shadow hover:shadow-md hover:shadow-blue-500/10"
                        onClick={(e) => handleCardClick(e, type.id)}
                      >
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white text-sm font-medium">{type.title}</CardTitle>
                            <div className="h-7 w-7 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-3.5 w-3.5 text-blue-400" />
                            </div>
                          </div>
                          <CardDescription className="text-gray-300 text-xs mt-1.5 line-clamp-2">
                            {type.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                            <span className="text-xs font-medium bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
                              {type.requirements.length} dokumen
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
                            >
                              Ajukan
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submission Form Modal */}
      <Dialog open={!!selectedType} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Ajukan {selectedType?.title || 'Form Pengajuan'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="mt-4 space-y-6">
            {/* Document Requirements */}
            <div className="bg-gray-700/30 p-5 rounded-xl border border-gray-600/30">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <FileText className="w-5 h-5 text-blue-400 mr-2" />
                Persyaratan Dokumen
              </h3>
              <ul className="space-y-3">
                {selectedType?.requirements?.map((req, index) => (
                  <li key={index} className="flex items-start group">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      </div>
                    </div>
                    <span className="ml-3 text-gray-200 text-sm group-hover:text-white transition-colors">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Submission Form */}
            <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700/30 space-y-6">
              <div className="space-y-5">
                {/* Title Input */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-300">Judul Pengajuan</Label>
                  <Input
                    id="title"
                    name="title"
                    className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Masukkan judul pengajuan"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-300">Deskripsi</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Jelaskan secara singkat tujuan pengajuan ini..."
                    rows={4}
                    className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 min-h-[120px]"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* File Upload Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-300">Unggah Dokumen</Label>
                    <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">Maks. 5MB per file</span>
                  </div>
                  
                  <div 
                    className="border-2 border-dashed border-gray-600/50 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500/50 transition-all duration-200 bg-gray-700/30 hover:bg-gray-700/50"
                    onClick={() => !isSubmitting && document.getElementById('file-upload').click()}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                    />
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Upload className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-200">
                          <span className="font-medium text-blue-400">Klik untuk mengunggah</span>
                          <span className="text-gray-300"> atau seret dan lepas file</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Format file: PDF, JPG, PNG, DOC, DOCX (maks. 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded files list */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-300 flex items-center">
                        <File className="h-4 w-4 mr-2 text-blue-400" />
                        File Terunggah ({uploadedFiles.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {uploadedFiles.map((file, index) => (
                          <motion.div 
                            key={index}
                            className="group flex items-center justify-between p-3 rounded-lg border border-gray-600/30 bg-gray-700/50 hover:bg-gray-700/70 transition-colors"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                {file.status === 'completed' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : file.status === 'error' ? (
                                  <FileX className="h-4 w-4 text-red-500" />
                                ) : (
                                  <FileText className="h-4 w-4 text-blue-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-200 truncate pr-2">
                                    {file.name}
                                  </p>
                                </div>
                                
                                <div className="w-full space-y-1.5 mt-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">
                                      {formatFileSize(file.size)}
                                      {file.status === 'uploading' && ` • ${file.progress}%`}
                                    </span>
                                    
                                    {file.status === 'uploading' && (
                                      <span className="text-blue-400 font-medium flex items-center">
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        Mengunggah...
                                      </span>
                                    )}
                                    
                                    {file.status === 'completed' && (
                                      <span className="text-green-400 text-xs flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Terunggah
                                      </span>
                                    )}
                                    
                                    {file.status === 'error' && (
                                      <button
                                        type="button"
                                        onClick={() => handleRetryUpload(file, index)}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Coba Lagi
                                      </button>
                                    )}
                                  </div>
                                  
                                  {['uploading', 'completed'].includes(file.status) && (
                                    <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-300 ease-out ${
                                          file.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${file.progress}%` }}
                                      />
                                    </div>
                                  )}
                                  
                                  {file.status === 'error' && (
                                    <div className="mt-1">
                                      <p className="text-xs text-red-400">
                                        {file.error || 'Gagal mengunggah file'}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFile(index)}
                                        className="mt-1 text-xs text-red-400 hover:text-red-300 flex items-center"
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Hapus
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0 rounded-full"
                              onClick={() => handleRemoveFile(index)}
                              disabled={file.status === 'uploading' || isSubmitting}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700/50">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="h-10 px-6 rounded-lg border-gray-600/50 text-gray-200 hover:bg-gray-700/50 hover:text-white transition-colors"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="h-10 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none"
                  disabled={isSubmitting || uploadedFiles.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <span className="flex items-center">
                      <Send className="mr-2 h-4 w-4" />
                      <span>Kirim Pengajuan</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewSubmissionPage;
