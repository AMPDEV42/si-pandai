import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardStatsSkeleton, SubmissionListSkeleton, LoadingOverlay } from '../components/common/LoadingSkeletons';
import { StatCardSkeleton, SubmissionCardSkeleton } from '../components/common/EnhancedSkeletons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { submissionService } from '../services/submissionService';
import { apiLogger } from '../lib/logger';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  Building2
} from 'lucide-react';

const AdminMasterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    revision: 0
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load submissions and statistics
        const [submissionsResult, statsResult] = await Promise.all([
          submissionService.getSubmissions({ limit: 50 }),
          submissionService.getSubmissionStats()
        ]);

        if (submissionsResult.error) {
          throw new Error(submissionsResult.error.message);
        }

        if (statsResult.error) {
          throw new Error(statsResult.error.message);
        }

        setSubmissions(submissionsResult.data || []);
        setStats(statsResult.data || {
          total: 0, pending: 0, approved: 0, rejected: 0, revision: 0
        });

        apiLogger.info('Dashboard data loaded successfully', {
          submissionsCount: submissionsResult.data?.length || 0,
          stats: statsResult.data
        });

      } catch (err) {
        apiLogger.error('Failed to load dashboard data', err);
        setError('Gagal memuat data dashboard. Silakan coba lagi.');
        setSubmissions([]);
        setStats({ total: 0, pending: 0, approved: 0, rejected: 0, revision: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.submitterName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    return filtered;
  }, [submissions, searchTerm, filterStatus]);

  const handleViewSubmission = useCallback((submissionId) => {
    navigate(`/dashboard/submission/${submissionId}`);
  }, [navigate]);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'revision': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      case 'revision': return 'Revisi';
      default: return 'Unknown';
    }
  }, []);

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Dashboard Admin Master - SIPANDAI</title>
        <meta name="description" content="Dashboard untuk admin master mengelola verifikasi dan approval pengajuan administrasi kepegawaian." />
      </Helmet>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white">Dashboard Admin Master</h1>
          <p className="text-gray-300 mt-1">Selamat datang kembali, {user?.name || user?.email}!</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          {isLoading ? (
            <StatCardSkeleton count={5} />
          ) : (
            <>
              <Card className="glass-effect border-white/20 card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Total Usulan</p>
                      <p className="text-3xl font-bold text-white">{stats.total}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-effect border-white/20 card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Menunggu</p>
                      <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-effect border-white/20 card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Disetujui</p>
                      <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-effect border-white/20 card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Revisi</p>
                      <p className="text-3xl font-bold text-purple-400">{stats.revision}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-effect border-white/20 card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Ditolak</p>
                      <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Manajemen Usulan
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Verifikasi dan kelola semua pengajuan administrasi
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari usulan atau nama pengusul..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'pending', 'approved', 'rejected', 'revision'].map((status) => (
                    <Button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      variant={filterStatus === status ? "default" : "outline"}
                      size="sm"
                      className={filterStatus === status 
                        ? "bg-gradient-to-r from-purple-600 to-pink-600" 
                        : "border-white/20 text-white hover:bg-white/10"
                      }
                    >
                      {status === 'all' ? 'Semua' : getStatusText(status)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 text-lg">Terjadi Kesalahan</p>
                  <p className="text-sm text-gray-500 mt-1">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="mt-4"
                    variant="outline"
                  >
                    Muat Ulang
                  </Button>
                </div>
              ) : isLoading ? (
                <SubmissionCardSkeleton count={5} />
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    Tidak ada usulan ditemukan
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm || filterStatus !== 'all'
                      ? 'Coba ubah filter atau kata kunci pencarian'
                      : 'Belum ada usulan yang diajukan'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto scrollbar-hide pr-2">
                  {filteredSubmissions.map((submission) => (
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
                              {submission.submitter?.full_name || submission.submitter?.email || 'Unknown User'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {submission.unit_kerja || submission.submitter?.unit_kerja || 'Unit Kerja'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(submission.created_at).toLocaleDateString('id-ID')}
                            </div>
                          </div>
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
        </motion.div>
      </div>
    </>
  );
};

export default AdminMasterDashboard;
