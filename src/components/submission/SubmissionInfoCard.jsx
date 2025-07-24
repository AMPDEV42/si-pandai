import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const SubmissionInfoCard = ({ submission }) => {
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Jenis Usulan</p>
              <p className="text-white font-medium">{submission.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Kategori</p>
              <p className="text-white font-medium">{submission.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tanggal Pengajuan</p>
              <p className="text-white font-medium">
                {new Date(submission.createdAt).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Terakhir Diperbarui</p>
              <p className="text-white font-medium">
                {new Date(submission.updatedAt).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SubmissionInfoCard;