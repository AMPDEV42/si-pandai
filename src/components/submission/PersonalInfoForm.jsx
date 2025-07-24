import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

const PersonalInfoForm = ({ formData, handlePersonalInfoChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Informasi Personal
          </CardTitle>
          <CardDescription className="text-gray-300">
            Lengkapi data personal Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-200">Nama Lengkap *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip" className="text-gray-200">NIP *</Label>
              <Input
                id="nip"
                value={formData.nip}
                onChange={(e) => handlePersonalInfoChange('nip', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Masukkan NIP"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position" className="text-gray-200">Jabatan *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handlePersonalInfoChange('position', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Masukkan jabatan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-gray-200">Unit Kerja</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handlePersonalInfoChange('unit', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Masukkan unit kerja"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-200">No. Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Masukkan no. telepon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="Masukkan email"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PersonalInfoForm;