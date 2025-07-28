/**
 * Improved Submission Page
 * New implementation with employee selection and individual requirement uploads
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Upload, 
  Send, 
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useToast } from '../components/ui/use-toast';
import EmployeeSelection from '../components/submission/EmployeeSelection';
import RequirementUpload from '../components/submission/RequirementUpload';
import GoogleDriveAuth from '../components/common/GoogleDriveAuth';
import { getSubmissionTypeById } from '../data/submissionTypes';
import { testGoogleDriveUpload, getGoogleDriveStatus } from '../utils/googleDriveTest';
import { submissionService } from '../services/submissionService';
import { googleDriveService } from '../services/googleDriveService';
import { apiLogger } from '../lib/logger';

const STEPS = {
  EMPLOYEE_SELECTION: 'employee',
  SUBMISSION_DETAILS: 'details',
  REQUIREMENTS_UPLOAD: 'requirements',
  REVIEW_SUBMIT: 'review'
};

const ImprovedSubmissionPage = () => {
  const { submissionTypeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Google Drive state
  const [isGoogleDriveEnabled, setIsGoogleDriveEnabled] = useState(false);
  const [isCheckingGoogleDrive, setIsCheckingGoogleDrive] = useState(true);

  // Check Google Drive status on mount
  useEffect(() => {
    const checkGoogleDriveStatus = async () => {
      try {
        const status = await googleDriveService.isAuthenticated();
        setIsGoogleDriveEnabled(status);
        setIsGoogleDriveAuthenticated(status);
      } catch (error) {
        console.error('Error checking Google Drive status:', error);
        setIsGoogleDriveEnabled(false);
        setIsGoogleDriveAuthenticated(false);
      } finally {
        setIsCheckingGoogleDrive(false);
      }
    };

    checkGoogleDriveStatus();
  }, []);

  // State management
  const [currentStep, setCurrentStep] = useState(STEPS.EMPLOYEE_SELECTION);
  const [submissionType, setSubmissionType] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [submissionData, setSubmissionData] = useState({
    title: '',
    description: '',
    notes: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [isGoogleDriveAuthenticated, setIsGoogleDriveAuthenticated] = useState(false);
  const [isTestingUpload, setIsTestingUpload] = useState(false);

  // Load submission type
  useEffect(() => {
    if (submissionTypeId) {
      const type = getSubmissionTypeById(submissionTypeId);
      if (type) {
        setSubmissionType(type);
        setSubmissionData(prev => ({
          ...prev,
          title: `Usulan ${type.title}`
        }));
      } else {
        toast({
          title: 'Error',
          description: 'Jenis pengajuan tidak ditemukan',
          variant: 'destructive'
        });
        navigate('/pengajuan/baru');
      }
    }
  }, [submissionTypeId, navigate, toast]);

  // Handle employee selection
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    if (employee) {
      apiLogger.info('Employee selected for submission', {
        employeeId: employee.id,
        employeeName: employee.full_name,
        submissionType: submissionType?.id
      });
    }
  };

  // Handle file upload for requirement
  const handleFileUpload = async (requirementId, file) => {
    try {
      setUploadingFiles(prev => ({ ...prev, [requirementId]: true }));

      // Here you would typically upload to Supabase Storage
      // For now, we'll store the file object
      const fileData = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };

      setUploadedFiles(prev => ({
        ...prev,
        [requirementId]: fileData
      }));

      apiLogger.info('File uploaded for requirement', {
        requirementId,
        fileName: file.name,
        fileSize: file.size
      });

    } catch (error) {
      apiLogger.error('File upload failed', {
        requirementId,
        error: error.message
      });

      toast({
        title: 'Upload gagal',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [requirementId]: false }));
    }
  };

  // Handle file removal
  const handleFileRemove = (requirementId) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[requirementId];
      return newFiles;
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!selectedEmployee) {
        throw new Error('Pilih pegawai terlebih dahulu');
      }

      if (!submissionData.title.trim()) {
        throw new Error('Judul pengajuan harus diisi');
      }

      // Check required files
      const requiredFiles = submissionType.requirements.filter(req => req.required);
      const missingRequired = requiredFiles.filter(req => !uploadedFiles[req.id]);
      
      if (missingRequired.length > 0) {
        throw new Error(`File wajib belum diupload: ${missingRequired.map(r => r.name).join(', ')}`);
      }

      // Prepare submission data
      const submission = {
        title: submissionData.title,
        description: submissionData.description,
        notes: submissionData.notes,
        submissionType: submissionType.id,
        employeeId: selectedEmployee.id,
        personalInfo: {
          fullName: selectedEmployee.full_name,
          nip: selectedEmployee.nip,
          unit: selectedEmployee.unit_kerja,
          position: selectedEmployee.position,
          rank: selectedEmployee.rank
        },
        requirements: Object.keys(uploadedFiles).map(reqId => ({
          requirementId: reqId,
          file: uploadedFiles[reqId]
        }))
      };

      // Submit to service
      const result = await submissionService.createSubmission(submission, user.id);

      if (result.error) {
        throw result.error;
      }

      apiLogger.info('Submission created successfully', {
        submissionId: result.data?.id,
        employeeId: selectedEmployee.id,
        submissionType: submissionType.id
      });

      toast({
        title: 'Usulan berhasil dikirim',
        description: 'Usulan Anda telah berhasil dikirim dan sedang diproses',
      });

      // Navigate to submission detail or dashboard
      navigate('/pengajuan/riwayat-admin');

    } catch (error) {
      apiLogger.error('Submission failed', error);
      
      toast({
        title: 'Gagal mengirim usulan',
        description: error.message || 'Terjadi kesalahan saat mengirim usulan',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step navigation
  const nextStep = () => {
    const steps = Object.values(STEPS);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps = Object.values(STEPS);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case STEPS.EMPLOYEE_SELECTION:
        return selectedEmployee !== null;
      case STEPS.SUBMISSION_DETAILS:
        return submissionData.title.trim() !== '';
      case STEPS.REQUIREMENTS_UPLOAD:
        const requiredFiles = submissionType?.requirements?.filter(req => req.required) || [];
        return requiredFiles.every(req => uploadedFiles[req.id]);
      default:
        return true;
    }
  };

  // Check Google Drive status on mount
  useEffect(() => {
    const checkDriveStatus = async () => {
      try {
        const isConfigured = googleDriveService.isConfigured();
        if (!isConfigured) {
          console.log('Google Drive not configured');
          return;
        }
        
        // Initialize Google Drive service
        await googleDriveService.initialize();
        
        // Check authentication status
        const isAuthenticated = await googleDriveService.isAuthenticated();
        setIsGoogleDriveAuthenticated(isAuthenticated);
        
        if (!isAuthenticated) {
          // Try to authenticate silently
          try {
            await googleDriveService.authenticate(true);
            setIsGoogleDriveAuthenticated(true);
          } catch (authError) {
            console.log('Silent authentication failed, user interaction required');
          }
        }
      } catch (error) {
        console.error('Error initializing Google Drive:', error);
      }
    };

    checkDriveStatus();
  }, []);

  const handleTestGoogleDriveUpload = async () => {
    setIsTestingUpload(true);

    try {
      const result = await testGoogleDriveUpload();

      if (result.success) {
        toast({
          title: 'Test upload berhasil!',
          description: `File test berhasil diupload ke Google Drive: ${result.fileName}`,
          action: result.viewLink ? (
            <Button
              size="sm"
              onClick={() => window.open(result.viewLink, '_blank')}
            >
              Lihat File
            </Button>
          ) : null
        });
      } else {
        toast({
          title: 'Test upload gagal',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Test upload error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsTestingUpload(false);
    }
  };

  if (!submissionType) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/pengajuan/baru')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {submissionType.title}
          </h1>
          <p className="text-gray-300 text-sm mt-1">
            Buat usulan baru dengan panduan step-by-step
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="glass-effect border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[
              { key: STEPS.EMPLOYEE_SELECTION, label: 'Pilih Pegawai', icon: Users },
              { key: STEPS.SUBMISSION_DETAILS, label: 'Detail Usulan', icon: FileText },
              { key: STEPS.REQUIREMENTS_UPLOAD, label: 'Upload Persyaratan', icon: Upload },
              { key: STEPS.REVIEW_SUBMIT, label: 'Review & Kirim', icon: Send }
            ].map((step, index, array) => (
              <React.Fragment key={step.key}>
                <div className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2
                    ${currentStep === step.key 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : Object.values(STEPS).indexOf(currentStep) > Object.values(STEPS).indexOf(step.key)
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-white/30 text-gray-400'
                    }
                  `}>
                    {Object.values(STEPS).indexOf(currentStep) > Object.values(STEPS).indexOf(step.key) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep === step.key ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < array.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === STEPS.EMPLOYEE_SELECTION && (
            <EmployeeSelection
              selectedEmployee={selectedEmployee}
              onEmployeeSelect={handleEmployeeSelect}
            />
          )}

          {currentStep === STEPS.SUBMISSION_DETAILS && (
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Detail Usulan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">Judul Usulan</Label>
                  <Input
                    id="title"
                    value={submissionData.title}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Masukkan judul usulan"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-white">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={submissionData.description}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    rows={4}
                    placeholder="Jelaskan detail usulan Anda"
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-white">Catatan Tambahan</Label>
                  <Textarea
                    id="notes"
                    value={submissionData.notes}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                    placeholder="Catatan atau keterangan tambahan (opsional)"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === STEPS.REQUIREMENTS_UPLOAD && (
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Persyaratan
                </CardTitle>
                <p className="text-gray-300 text-sm mt-2">
                  Upload file untuk setiap persyaratan yang diperlukan
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Google Drive Integration */}
                <div className="mb-6">
                  <GoogleDriveAuth 
                    onAuthChange={setIsGoogleDriveAuthenticated}
                  />
                </div>

                {/* Test Upload Button */}
                {isGoogleDriveAuthenticated && (
                  <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-blue-300">Test Google Drive Upload</h4>
                          <p className="text-xs text-blue-200/80 mt-1">
                            Uji coba upload file ke Google Drive untuk memastikan integrasi berfungsi
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleTestGoogleDriveUpload}
                          disabled={isTestingUpload}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isTestingUpload ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Test Upload
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {submissionType.requirements?.map((requirement, index) => (
                  <RequirementUpload
                    key={`requirement-${index}`}
                    requirement={{
                      id: `req-${index}`,
                      title: requirement,
                      required: true,
                      description: `Upload dokumen ${requirement} dalam format PDF, DOC, DOCX, JPG, atau PNG (maksimal 5MB)`
                    }}
                    uploadedFile={uploadedFiles[`req-${index}`]}
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    isUploading={uploadingFiles[`req-${index}`]}
                    submissionType={submissionType}
                    employeeName={selectedEmployee?.full_name}
                    useGoogleDrive={isGoogleDriveEnabled}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {currentStep === STEPS.REVIEW_SUBMIT && (
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Review & Kirim Usulan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Employee Info */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="font-semibold text-white mb-2">Data Pegawai</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Nama:</span>
                      <span className="text-white ml-2">{selectedEmployee?.full_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">NIP:</span>
                      <span className="text-white ml-2">{selectedEmployee?.nip}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Unit Kerja:</span>
                      <span className="text-white ml-2">{selectedEmployee?.unit_kerja}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Jabatan:</span>
                      <span className="text-white ml-2">{selectedEmployee?.position}</span>
                    </div>
                  </div>
                </div>

                {/* Submission Details */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="font-semibold text-white mb-2">Detail Usulan</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Judul:</span>
                      <span className="text-white ml-2">{submissionData.title}</span>
                    </div>
                    {submissionData.description && (
                      <div>
                        <span className="text-gray-400">Deskripsi:</span>
                        <p className="text-white mt-1">{submissionData.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploaded Files */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="font-semibold text-white mb-2">File yang Diupload</h4>
                  <div className="space-y-2">
                    {Object.entries(uploadedFiles).map(([reqId, file]) => {
                      const requirement = submissionType.requirements.find(r => r.id === reqId);
                      return (
                        <div key={reqId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{requirement?.name}:</span>
                          <span className="text-white">{file.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === STEPS.EMPLOYEE_SELECTION}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Sebelumnya
        </Button>

        <div className="flex gap-3">
          {currentStep !== STEPS.REVIEW_SUBMIT ? (
            <Button
              onClick={nextStep}
              disabled={!canProceedToNext()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceedToNext()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Kirim Usulan
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImprovedSubmissionPage;
