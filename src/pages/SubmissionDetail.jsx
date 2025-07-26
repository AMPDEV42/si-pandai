import React, { useState, useEffect } from 'react';
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

const SubmissionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const savedSubmissions = localStorage.getItem('sipandai_submissions');
    if (savedSubmissions) {
      const allSubmissions = JSON.parse(savedSubmissions);
      const foundSubmission = allSubmissions.find(sub => sub.id === parseInt(id));
      
      if (!foundSubmission) {
        toast({
          title: "Usulan tidak ditemukan",
          description: "Usulan yang Anda cari tidak ditemukan",
          variant: "destructive"
        });
        navigate(user.role === 'admin-unit' ? '/admin-unit' : '/admin-master');
        return;
      }

      if (user.role === 'admin-unit' && foundSubmission.submittedBy !== user.id) {
        toast({
          title: "Akses ditolak",
          description: "Anda tidak memiliki akses ke usulan ini",
          variant: "destructive"
        });
        navigate('/admin-unit');
        return;
      }

      setSubmission(foundSubmission);
    }
  }, [id, user, navigate, toast]);

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

    setTimeout(() => {
      const savedSubmissions = localStorage.getItem('sipandai_submissions');
      if (savedSubmissions) {
        const allSubmissions = JSON.parse(savedSubmissions);
        const updatedSubmissions = allSubmissions.map(sub => {
          if (sub.id === submission.id) {
            return {
              ...sub,
              status: newStatus,
              notes: actionNotes || sub.notes,
              reviewedBy: user.id,
              reviewedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
          return sub;
        });

        localStorage.setItem('sipandai_submissions', JSON.stringify(updatedSubmissions));
        
        setSubmission(prev => ({
          ...prev,
          status: newStatus,
          notes: actionNotes || prev.notes,
          reviewedBy: user.id,
          reviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        const statusText = {
          approved: 'disetujui',
          rejected: 'ditolak',
          revision: 'dikembalikan untuk revisi'
        };

        toast({
          title: "Status berhasil diperbarui",
          description: `Usulan telah ${statusText[newStatus]}`,
        });

        setActionNotes('');
      }
      setLoading(false);
    }, 1500);
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
