import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Clock, User, FileCheck } from 'lucide-react';

const SubmissionInfoCard = ({ submission }) => {
  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Menunggu Verifikasi',
      'approved': 'Disetujui',
      'rejected': 'Ditolak',
      'revision': 'Perlu Revisi'
    };
    return statusMap[status] || status;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Informasi Usulan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">{submission.title || 'Tidak Ada Judul'}</h3>
            <p className="text-gray-300">{submission.description || 'Tidak ada deskripsi'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Tanggal Pengajuan</span>
                </p>
                <p className="text-white font-medium mt-1">
                  {formatDate(submission.created_at || submission.createdAt)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 rounded-full ${
                    submission.status === 'approved' ? 'bg-green-500' :
                    submission.status === 'rejected' ? 'bg-red-500' :
                    submission.status === 'revision' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <p className="text-white font-medium">
                    {getStatusText(submission.status)}
                  </p>
                </div>
              </div>
              
              {submission.submission_type && (
                <div>
                  <p className="text-sm text-gray-400">Jenis Pengajuan</p>
                  <p className="text-white font-medium">{submission.submission_type}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Terakhir Diperbarui</span>
                </p>
                <p className="text-white font-medium mt-1">
                  {formatDate(submission.updated_at || submission.updatedAt)}
                </p>
              </div>
              
              {submission.reviewed_by && (
                <div>
                  <p className="text-sm text-gray-400">Diperiksa Oleh</p>
                  <p className="text-white font-medium">
                    {submission.reviewer?.full_name || submission.reviewed_by}
                  </p>
                </div>
              )}
              
              {submission.reviewed_at && (
                <div>
                  <p className="text-sm text-gray-400">Waktu Pemeriksaan</p>
                  <p className="text-white font-medium">
                    {formatDate(submission.reviewed_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {submission.notes && submission.notes.length > 0 && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Catatan:</h4>
              <ul className="space-y-2">
                {submission.notes.map((note, index) => (
                  <li key={index} className="text-white text-sm">
                    • {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SubmissionInfoCard;