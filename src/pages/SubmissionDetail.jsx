import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import SubmissionInfoCard from '@/components/submission/SubmissionInfoCard';
import SubmitterInfoCard from '@/components/submission/SubmitterInfoCard';
import DocumentsList from '@/components/submission/DocumentsList';
import NotesCard from '@/components/submission/NotesCard';
import VerificationActions from '@/components/submission/VerificationActions';
import HistoryTimeline from '@/components/submission/HistoryTimeline';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { submissionService } from '../services/submissionService';
import { getPegawai } from '../services/pegawaiService';
import { supabase } from '../lib/customSupabaseClient';

const SubmissionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  
  // Format phone number to Indonesian format
  const formatPhoneNumber = (phone) => {
    if (!phone) return '-';
    // Remove all non-digit characters
    const cleaned = ('' + phone).replace(/\D/g, '');
    // Check if number starts with 0
    if (cleaned.startsWith('0')) {
      return cleaned.replace(/^(\d{3})(\d{4})(\d{4,})$/, '$1-$2-$3');
    }
    // Check if number starts with 62 (Indonesia country code)
    if (cleaned.startsWith('62')) {
      return cleaned.replace(/^(62)(\d{3})(\d{4})(\d{4,})$/, '+$1 $2-$3-$4');
    }
    // Return as is if format is unknown
    return phone;
  };

  const fetchSubmission = useCallback(async () => {
    if (!user || !id) return;

    try {
      setLoading(true);
      
      // Use the submission service to get the data
      const { data: submissionData, error } = await submissionService.getSubmissionById(id);
      
      if (error) throw error;
      if (!submissionData) throw new Error('Submission not found');

      // Check if the user has permission to view this submission
      if (user.role === 'admin-unit' && submissionData.unit_kerja !== user.unit_kerja) {
        throw new Error('Unauthorized access to this submission');
      }

      // Log the raw submission data for debugging
      console.group('=== DEBUG: Raw Submission Data ===');
      console.log('Full submission data:', submissionData);
      console.log('Personal info from service:', submissionData.personalInfo);
      console.log('Employee data from service:', submissionData._employeeData);
      console.log('Debug info:', submissionData._debug);
      console.groupEnd();

      // Personal info is now handled by the submission service
      // Just use the data that was already processed
      
      // Ensure all required fields have default values
      const transformedData = {
        ...submissionData,
        // Map created_at and updated_at to camelCase for consistency
        createdAt: submissionData.created_at,
        updatedAt: submissionData.updated_at,
        // Map category if it exists, otherwise use submission type
        category: submissionData.category || submissionData.submission_type || 'Umum',
        personalInfo,
        // Ensure all array fields are properly initialized
        requirements: Array.isArray(submissionData.requirements) 
          ? submissionData.requirements 
          : (submissionData.requirements_data ? Object.values(submissionData.requirements_data) : []),
        documents: Array.isArray(submissionData.documents) 
          ? submissionData.documents 
          : [],
        checkedRequirements: Array.isArray(submissionData.checked_requirements) 
          ? submissionData.checked_requirements 
          : [],
        history: Array.isArray(submissionData.history) 
          ? submissionData.history 
          : [],
        notes: Array.isArray(submissionData.notes) 
          ? submissionData.notes 
          : (submissionData.review_notes ? [submissionData.review_notes] : [])
      };
      
      // Log the transformed data for debugging
      console.log('Transformed submission data:', transformedData);

      console.log('Transformed submission data:', transformedData);
      setSubmission(transformedData);
      
    } catch (error) {
      console.error('Error fetching submission:', error);
      
      toast({
        title: "Gagal memuat detail usulan",
        description: error.message === 'Unauthorized access to this submission' 
          ? 'Anda tidak memiliki akses ke usulan ini' 
          : 'Gagal memuat data usulan. Silakan coba lagi.',
        variant: "destructive"
      });
      
      // Redirect based on user role
      const redirectPath = user?.role === 'admin-unit' ? '/pengajuan/riwayat-admin' : '/pengajuan/riwayat';
      navigate(redirectPath);
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate, toast]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleStatusUpdate = async (newStatus) => {
    if (!actionNotes.trim() && newStatus !== 'approved') {
      toast({
        title: "Catatan diperlukan",
        description: "Mohon berikan catatan untuk tindakan ini",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const previousStatus = submission.status;
      let result;

      // Use the appropriate service method based on status
      switch (newStatus) {
        case 'approved':
          result = await submissionService.approveSubmission(
            submission.id,
            user.id,
            actionNotes,
            previousStatus
          );
          break;
        case 'rejected':
          result = await submissionService.rejectSubmission(
            submission.id,
            user.id,
            actionNotes,
            previousStatus
          );
          break;
        case 'revision':
          result = await submissionService.requestRevision(
            submission.id,
            user.id,
            actionNotes,
            previousStatus
          );
          break;
        default:
          throw new Error('Invalid status');
      }

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setSubmission(prev => ({
        ...prev,
        status: newStatus,
        review_notes: actionNotes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const statusText = {
        approved: 'disetujui',
        rejected: 'ditolak',
        revision: 'dikembalikan untuk revisi'
      };

      toast({
        title: "Status berhasil diperbarui",
        description: `Usulan telah ${statusText[newStatus]}. Notifikasi telah dikirim ke pemohon.`,
      });

      setActionNotes('');

    } catch (error) {
      console.error('Error updating submission status:', error);
      toast({
        title: "Gagal memperbarui status",
        description: "Terjadi kesalahan saat memperbarui status usulan. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'revision': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Menunggu Verifikasi';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      case 'revision': return 'Perlu Revisi';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'approved': return <CheckCircle className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      case 'revision': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  if (!submission) return null;

  return (
    <>
      <Helmet>
        <title>{`Detail Usulan - ${submission.title} - SIPANDAI`}</title>
        <meta name="description" content={`Detail pengajuan ${submission.title} di sistem SIPANDAI.`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect border-b border-white/10 sticky top-0 z-50"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate(user.role === 'admin-unit' ? '/admin-unit' : '/admin-master')}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-white">Detail Usulan</h1>
                  <p className="text-sm text-gray-300">{submission.title}</p>
                </div>
              </div>
              
              <Badge className={`${getStatusColor(submission.status)} text-white flex items-center gap-2 px-4 py-2`}>
                {getStatusIcon(submission.status)}
                {getStatusText(submission.status)}
              </Badge>
            </div>
          </div>
        </motion.header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <SubmissionInfoCard submission={submission} />
              <SubmitterInfoCard personalInfo={submission.personalInfo} />
              <DocumentsList submission={submission} />
              <NotesCard notes={submission.notes} />
            </div>

            {user.role === 'admin-master' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <VerificationActions 
                  submission={submission}
                  actionNotes={actionNotes}
                  setActionNotes={setActionNotes}
                  handleStatusUpdate={handleStatusUpdate}
                  loading={loading}
                />
                <HistoryTimeline 
                  submission={submission}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SubmissionDetail;
