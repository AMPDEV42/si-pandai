import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { getSubmissionsByCategory } from '../data/submissionTypes';
import { submissionService } from '../services/submissionService';
import { apiLogger } from '../lib/logger';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';

const AdminUnitDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    revision: 0
  });

  const submissionCategories = getSubmissionsByCategory();

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // For admin-unit, show their unit's submissions
        // For regular users, show only their own submissions
        const filters = user.role === 'admin-unit'
          ? { unitKerja: user.unit_kerja || user.unitKerja, limit: 20 }
          : { submittedBy: user.id, limit: 20 };

        const [submissionsResult, statsResult] = await Promise.all([
          submissionService.getSubmissions(filters),
          submissionService.getSubmissionStats(filters)
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

        apiLogger.info('Unit dashboard data loaded successfully', {
          userId: user.id,
          role: user.role,
          submissionsCount: submissionsResult.data?.length || 0
        });

      } catch (err) {
        apiLogger.error('Failed to load unit dashboard data', err);
        setError('Gagal memuat data dashboard. Silakan coba lagi.');
        setSubmissions([]);
        setStats({ total: 0, pending: 0, approved: 0, rejected: 0, revision: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleNewSubmission = useCallback((typeId) => {
    navigate(`/dashboard/submission/new/${typeId}`);
  }, [navigate]);

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
        <title>Dashboard Admin Unit Kerja - SIPANDAI</title>
        <meta name="description" content="Dashboard untuk admin unit kerja mengelola pengajuan administrasi kepegawaian." />
      </Helmet>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white">Dashboard Admin Unit</h1>
          <p className="text-gray-300 mt-1">Selamat datang, {user?.name || user?.email}! Kelola usulan Anda di sini.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        >
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
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Buat Usulan Baru
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Pilih jenis usulan administrasi kepegawaian
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 max-h-[600px] overflow-y-auto scrollbar-hide pr-2">
                {Object.entries(submissionCategories).map(([category, types]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {types.map((type) => (
                        <motion.div
                          key={type.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={() => handleNewSubmission(type.id)}
                            variant="outline"
                            className="w-full justify-start text-left h-auto p-4 border-white/20 hover:bg-white/10 hover:border-white/30"
                          >
                            <div>
                              <p className="font-medium text-white">{type.title}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {type.requirements.length} persyaratan
                              </p>
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Usulan Terbaru
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Riwayat pengajuan Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10 animate-pulse">
                        <div className="space-y-2">
                          <div className="h-4 bg-white/10 rounded w-3/4"></div>
                          <div className="h-3 bg-white/10 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400">Terjadi Kesalahan</p>
                    <p className="text-sm text-gray-500 mt-1">{error}</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Belum ada usulan</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Buat usulan pertama Anda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide pr-2">
                    {submissions.slice(0, 10).map((submission) => (
                      <motion.div
                        key={submission.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                        onClick={() => handleViewSubmission(submission.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-white text-sm">
                            {submission.title}
                          </h4>
                          <Badge className={`${getStatusColor(submission.status)} text-white text-xs`}>
                            {getStatusText(submission.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(submission.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AdminUnitDashboard;
