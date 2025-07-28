import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

const SubmitterInfoCard = ({ personalInfo = {} }) => {
  // Provide default values for all fields
  const {
    name = 'Tidak Diketahui',
    nip = '-',
    position = '-',
    unit = '-',
    phone = '-',
    email = '-',
  } = personalInfo || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Informasi Pengusul
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Nama Lengkap</p>
                <p className="text-white font-medium">{name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">NIP</p>
                <p className="text-white font-medium">{nip}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Jabatan</p>
                <p className="text-white font-medium">{position}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Unit Kerja</p>
                <p className="text-white font-medium">{unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">No. Telepon</p>
                <p className="text-white font-medium">{phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white font-medium">{email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SubmitterInfoCard;