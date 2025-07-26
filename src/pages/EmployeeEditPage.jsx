/**
 * Employee Edit Page
 * Form untuk mengedit data pegawai
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';
import { employeeService } from '../services/employeeService';
import { updatePegawai } from '../services/pegawaiService';
import { apiLogger } from '../lib/logger';

const EmployeeEditPage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    email: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    statusKepegawaian: 'PNS',
    jenisJabatan: 'Jabatan Fungsional',
    pangkatGolongan: '',
    tmt: '',
    jabatan: '',
    unitKerja: '',
    pendidikanTerakhir: '',
    alamat: '',
    noHp: ''
  });

  // Load employee data
  useEffect(() => {
    const loadEmployeeData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await employeeService.getEmployeeById(employeeId);
        
        if (result.error) {
          throw result.error;
        }

        const employeeData = result.data.employee;
        setEmployee(employeeData);

        // Populate form data
        setFormData({
          nama: employeeData.full_name || employeeData.nama || '',
          nip: employeeData.nip || '',
          email: employeeData.email || '',
          tempatLahir: employeeData.tempatLahir || '',
          tanggalLahir: employeeData.tanggalLahir ? new Date(employeeData.tanggalLahir).toISOString().split('T')[0] : '',
          jenisKelamin: employeeData.jenisKelamin || '',
          statusKepegawaian: employeeData.statusKepegawaian || 'PNS',
          jenisJabatan: employeeData.jenisJabatan || 'Jabatan Fungsional',
          pangkatGolongan: employeeData.pangkatGolongan || employeeData.pangkat_golongan || '',
          tmt: employeeData.tmt ? new Date(employeeData.tmt).toISOString().split('T')[0] : '',
          jabatan: employeeData.jabatan || '',
          unitKerja: employeeData.unitKerja || employeeData.unit_kerja || '',
          pendidikanTerakhir: employeeData.pendidikanTerakhir || '',
          alamat: employeeData.alamat || '',
          noHp: employeeData.noHp || ''
        });

        apiLogger.info('Employee data loaded for editing', { employeeId });

      } catch (err) {
        apiLogger.error('Failed to load employee data for editing', err);
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

    if (employeeId) {
      loadEmployeeData();
    }
  }, [employeeId, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);

      // Update employee data using pegawaiService which handles the correct format
      await updatePegawai(employeeId, formData);

      toast({
        title: 'Berhasil',
        description: 'Data pegawai berhasil diperbarui',
        variant: 'default'
      });

      apiLogger.info('Employee updated successfully', { employeeId });

      // Navigate back to detail page
      navigate(`/pegawai/${employeeId}`);

    } catch (err) {
      apiLogger.error('Failed to update employee', err);
      
      toast({
        title: 'Error',
        description: 'Gagal memperbarui data pegawai. Silakan coba lagi.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
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
        <div className="h-96 bg-white/10 rounded-lg animate-pulse"></div>
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
            onClick={() => navigate(`/pegawai/${employeeId}`)}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Edit Data Pegawai
            </h1>
            <p className="text-gray-300 text-sm mt-1">
              {employee.full_name || employee.nama} - NIP: {employee.nip}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Form Edit Data Pegawai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nama" className="text-white">Nama Lengkap</Label>
                  <Input
                    id="nama"
                    name="nama"
                    value={formData.nama}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nip" className="text-white">NIP</Label>
                  <Input
                    id="nip"
                    name="nip"
                    value={formData.nip}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempatLahir" className="text-white">Tempat Lahir</Label>
                  <Input
                    id="tempatLahir"
                    name="tempatLahir"
                    value={formData.tempatLahir}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalLahir" className="text-white">Tanggal Lahir</Label>
                  <Input
                    id="tanggalLahir"
                    name="tanggalLahir"
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenisKelamin" className="text-white">Jenis Kelamin</Label>
                  <select
                    id="jenisKelamin"
                    name="jenisKelamin"
                    value={formData.jenisKelamin}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="" className="text-black">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki" className="text-black">Laki-laki</option>
                    <option value="Perempuan" className="text-black">Perempuan</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusKepegawaian" className="text-white">Status Kepegawaian</Label>
                  <select
                    id="statusKepegawaian"
                    name="statusKepegawaian"
                    value={formData.statusKepegawaian}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="PNS" className="text-black">PNS</option>
                    <option value="PPPK" className="text-black">PPPK</option>
                    <option value="Honorer" className="text-black">Honorer</option>
                    <option value="Kontrak" className="text-black">Kontrak</option>
                    <option value="Lainnya" className="text-black">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenisJabatan" className="text-white">Jenis Jabatan</Label>
                  <select
                    id="jenisJabatan"
                    name="jenisJabatan"
                    value={formData.jenisJabatan}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="Jabatan Struktural" className="text-black">Jabatan Struktural</option>
                    <option value="Jabatan Fungsional" className="text-black">Jabatan Fungsional</option>
                    <option value="Jabatan Pelaksana" className="text-black">Jabatan Pelaksana</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pangkatGolongan" className="text-white">Pangkat/Golongan</Label>
                  <Input
                    id="pangkatGolongan"
                    name="pangkatGolongan"
                    value={formData.pangkatGolongan}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tmt" className="text-white">TMT</Label>
                  <Input
                    id="tmt"
                    name="tmt"
                    type="date"
                    value={formData.tmt}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jabatan" className="text-white">Jabatan</Label>
                  <Input
                    id="jabatan"
                    name="jabatan"
                    value={formData.jabatan}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitKerja" className="text-white">Unit Kerja</Label>
                  <Input
                    id="unitKerja"
                    name="unitKerja"
                    value={formData.unitKerja}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pendidikanTerakhir" className="text-white">Pendidikan Terakhir</Label>
                  <select
                    id="pendidikanTerakhir"
                    name="pendidikanTerakhir"
                    value={formData.pendidikanTerakhir}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="" className="text-black">Pilih Pendidikan Terakhir</option>
                    <option value="SD" className="text-black">SD</option>
                    <option value="SMP" className="text-black">SMP</option>
                    <option value="SMA/SMK" className="text-black">SMA/SMK</option>
                    <option value="D1" className="text-black">D1</option>
                    <option value="D2" className="text-black">D2</option>
                    <option value="D3" className="text-black">D3</option>
                    <option value="D4" className="text-black">D4</option>
                    <option value="S1" className="text-black">S1</option>
                    <option value="S2" className="text-black">S2</option>
                    <option value="S3" className="text-black">S3</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="noHp" className="text-white">Nomor HP</Label>
                  <Input
                    id="noHp"
                    name="noHp"
                    type="tel"
                    value={formData.noHp}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="alamat" className="text-white">Alamat Lengkap</Label>
                  <textarea
                    id="alamat"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleInputChange}
                    rows="3"
                    className="flex w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/pegawai/${employeeId}`)}
                  className="border-white/20 text-white hover:bg-white/10"
                  disabled={isSaving}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmployeeEditPage;
