/**
 * Employee Detail Page
 * Shows employee information and submission history
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  FileText,
  Eye,
  Edit,
  Badge as BadgeIcon,
  MapPin,
  GraduationCap,
  Heart,
  Users,
  BookOpen,
  Briefcase,
  UserCheck,
  Home,
  Bookmark
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { TabSkeletonWrapper, SubmissionCardSkeleton } from '../components/common/EnhancedSkeletons';
import { useTabLoading } from '../hooks/useProgressiveLoading';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useToast } from '../components/ui/use-toast';
import { employeeService } from '../services/employeeService';
import { apiLogger } from '../lib/logger';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';

const EmployeeDetailPage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [employee, setEmployee] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const { isTabLoading, setTabLoading } = useTabLoading();

  // Function to load employee data
  const loadEmployeeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await employeeService.getEmployeeById(employeeId);

      if (result.error) {
        throw result.error;
      }

      setEmployee(result.data.employee);
      setSubmissions(result.data.submissions);

      apiLogger.info('Employee detail loaded', {
        employeeId,
        submissionsCount: result.data.submissions.length
      });

    } catch (err) {
      apiLogger.error('Failed to load employee detail', err);
      setError('Gagal memuat data pegawai. Silakan coba lagi.');

      toast({
        title: 'Error',
        description: 'Gagal memuat data pegawai',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load employee data and submission history
  useEffect(() => {
    if (employeeId) {
      loadEmployeeData();
    }
  }, [employeeId, toast]);

  // Check for update flag and refresh data
  useEffect(() => {
    const checkForUpdates = () => {
      const wasUpdated = localStorage.getItem('employee_updated');
      if (wasUpdated === 'true' && employeeId && !isLoading) {
        localStorage.removeItem('employee_updated');
        loadEmployeeData();
      }
    };

    // Check immediately when component mounts
    checkForUpdates();

    // Also check on window focus
    const handleFocus = () => {
      checkForUpdates();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [employeeId, isLoading]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateMasaKerja = (startDate) => {
    if (!startDate) return '0 tahun 0 bulan';

    const start = new Date(startDate);
    const today = new Date();

    if (isNaN(start.getTime()) || start > today) {
      return '0 tahun 0 bulan';
    }

    let years = today.getFullYear() - start.getFullYear();
    let months = today.getMonth() - start.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < start.getDate())) {
      years--;
      months += 12;
    }

    if (months < 0) months = 0;

    return `${Math.max(0, years)} tahun ${Math.max(0, months)} bulan`;
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'bg-gray-500';
  };

  const getStatusText = (status) => {
    return STATUS_LABELS[status] || status;
  };

  const handleViewSubmission = (submissionId) => {
    navigate(`/pengajuan/${submissionId}`);
  };

  const handleEditEmployee = () => {
    navigate(`/pegawai/edit/${employeeId}`);
  };

  const handleCreateSubmission = () => {
    navigate('/pengajuan/baru');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-white/10 rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 bg-white/10 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-white/10 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-white/10 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 bg-white/10 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          {error || 'Pegawai tidak ditemukan'}
        </h2>
        <p className="text-gray-400 mb-4">
          Data pegawai tidak dapat dimuat atau tidak tersedia
        </p>
        <Button onClick={() => navigate('/pegawai')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Data Pegawai
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/pegawai')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {employee.full_name}
            </h1>
            <p className="text-gray-300 text-sm mt-1">
              NIP: {employee.nip} • {employee.unit_kerja}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCreateSubmission}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Buat Usulan
          </Button>
          {user?.role === 'admin-master' && (
            <Button
              onClick={handleEditEmployee}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <Card className="glass-effect border-white/20">
        <CardContent className="p-0">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-white border-b-2 border-blue-500 bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4 mr-2 inline" />
              Profil Pegawai
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'submissions'
                  ? 'text-white border-b-2 border-blue-500 bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4 mr-2 inline" />
              Riwayat Usulan ({submissions.length})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Informasi Pribadi</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm">{employee.email || 'Tidak ada data'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">No. HP</p>
                    <p className="text-sm">{employee.noHp || 'Tidak ada data'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Tempat, Tanggal Lahir</p>
                    <p className="text-sm">
                      {employee.tempatLahir || 'Tidak ada data'}, 
                      {employee.tanggalLahir ? new Date(employee.tanggalLahir).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Tidak ada data'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Heart className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Jenis Kelamin</p>
                    <p className="text-sm">{employee.jenisKelamin || 'Tidak ada data'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Home className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Alamat</p>
                    <p className="text-sm whitespace-pre-line">{employee.alamat || 'Tidak ada data'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Informasi Kepegawaian</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start">
                  <BadgeIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">NIP</p>
                    <p className="text-sm">{employee.nip || 'Tidak ada data'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <UserCheck className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Status Kepegawaian</p>
                    <p className="text-sm">{employee.statusKepegawaian || 'Tidak ada data'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Bookmark className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Jenis Jabatan</p>
                    <p className="text-sm">{employee.jenisJabatan || 'Tidak ada data'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pendidikan Terakhir</p>
                    <p className="text-sm">{employee.pendidikanTerakhir || 'Tidak ada data'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Unit Kerja</p>
                    <p className="text-sm">{employee.unitKerja || employee.unit_kerja || 'Tidak ada data'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">TMT</p>
                    <p className="text-sm">
                      {employee.tmt ? new Date(employee.tmt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Tidak ada data'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <BookOpen className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pangkat/Golongan</p>
                    <p className="text-sm">{employee.pangkatGolongan || employee.pangkat_golongan || 'Tidak ada data'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'submissions' && (
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Riwayat Usulan
                </CardTitle>
                <Button
                  onClick={handleCreateSubmission}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Buat Usulan Baru
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <SubmissionCardSkeleton count={3} />
              ) : submissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Belum Ada Usulan
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Pegawai ini belum pernah mengajukan usulan apapun
                  </p>
                  <Button
                    onClick={handleCreateSubmission}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Buat Usulan Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <motion.div
                      key={submission.id}
                      whileHover={{ scale: 1.01 }}
                      className="p-6 rounded-lg bg-white/5 border border-white/10 cursor-pointer card-hover"
                      onClick={() => handleViewSubmission(submission.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-white">{submission.title}</h4>
                            <Badge className={`${getStatusColor(submission.status)} text-white`}>
                              {getStatusText(submission.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {submission.submitter?.full_name || 'Unknown'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(submission.created_at)}
                            </div>
                          </div>
                          {submission.description && (
                            <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                              {submission.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSubmission(submission.id);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Detail
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

export default EmployeeDetailPage;
