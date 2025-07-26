import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, User, Building2, Calendar, Search, Filter } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { format, parseISO, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  getPegawai,
  createPegawai,
  updatePegawai,
  deletePegawai
} from '../../services/pegawaiService';
import EmployeeStats from '../../components/pegawai/EmployeeStats';

export default function DataPegawai() {
  const [pegawai, setPegawai] = useState([]);
  const [filteredPegawai, setFilteredPegawai] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
    noHp: '',
    riwayatDiklat: []
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchPegawai();
  }, []);

  // Refresh data when coming back from edit page (window focus)
  useEffect(() => {
    const handleFocus = () => {
      if (!isLoading) {
        fetchPegawai();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoading]);

  const fetchPegawai = async () => {
    try {
      const data = await getPegawai();
      setPegawai(data);
      setFilteredPegawai(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching pegawai:', error);
      setIsLoading(false);
    }
  };

  // Search functionality
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPegawai(pegawai);
    } else {
      const filtered = pegawai.filter(p =>
        (p.nama || p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.nip || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.unitKerja || p.unit_kerja || p.unit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.jabatan || p.position || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPegawai(filtered);
    }
  }, [searchTerm, pegawai]);

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
      if (isEditMode) {
        await updatePegawai(formData.id, formData);
      } else {
        await createPegawai(formData);
      }
      
      setIsDialogOpen(false);
      fetchPegawai();
      resetForm();
    } catch (error) {
      console.error('Error saving pegawai:', error);
      alert('Terjadi kesalahan saat menyimpan data pegawai');
    }
  };

  const handleEdit = (pegawai) => {
    setIsEditMode(true);
    setFormData({
      id: pegawai.id,
      nama: pegawai.nama || '',
      nip: pegawai.nip || '',
      email: pegawai.email || '',
      tempatLahir: pegawai.tempatLahir || '',
      tanggalLahir: pegawai.tanggalLahir ? format(new Date(pegawai.tanggalLahir), 'yyyy-MM-dd') : '',
      jenisKelamin: pegawai.jenisKelamin || '',
      statusKepegawaian: pegawai.statusKepegawaian || 'PNS',
      jenisJabatan: pegawai.jenisJabatan || 'Jabatan Fungsional',
      pangkatGolongan: pegawai.pangkatGolongan || '',
      tmt: pegawai.tmt ? format(new Date(pegawai.tmt), 'yyyy-MM-dd') : '',
      jabatan: pegawai.jabatan || '',
      unitKerja: pegawai.unitKerja || '',
      pendidikanTerakhir: pegawai.pendidikanTerakhir || '',
      alamat: pegawai.alamat || '',
      noHp: pegawai.noHp || '',
      riwayatDiklat: pegawai.riwayatDiklat || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pegawai ini?')) {
      try {
        await deletePegawai(id);
        fetchPegawai();
      } catch (error) {
        console.error('Error deleting pegawai:', error);
        alert('Terjadi kesalahan saat menghapus data pegawai');
      }
    }
  };

  const resetForm = () => {
    setFormData({
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
      noHp: '',
      riwayatDiklat: []
    });
    setIsEditMode(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-xl"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Data Pegawai</h1>
          <p className="text-gray-300">
            Kelola data pegawai untuk keperluan administrasi
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Total: {filteredPegawai.length} pegawai
            </Badge>
            {searchTerm && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Hasil pencarian: {filteredPegawai.length}
              </Badge>
            )}
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pegawai
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-gray-900 border border-white/10 shadow-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Edit Data Pegawai' : 'Tambah Data Pegawai'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input
                    id="nama"
                    name="nama"
                    value={formData.nama}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nip">NIP</Label>
                  <Input
                    id="nip"
                    name="nip"
                    value={formData.nip}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                  <Input
                    id="tempatLahir"
                    name="tempatLahir"
                    value={formData.tempatLahir}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                  <Input
                    id="tanggalLahir"
                    name="tanggalLahir"
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                  <select
                    id="jenisKelamin"
                    name="jenisKelamin"
                    value={formData.jenisKelamin}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusKepegawaian">Status Kepegawaian</Label>
                  <select
                    id="statusKepegawaian"
                    name="statusKepegawaian"
                    value={formData.statusKepegawaian}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="Honorer">Honorer</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jenisJabatan">Jenis Jabatan</Label>
                  <select
                    id="jenisJabatan"
                    name="jenisJabatan"
                    value={formData.jenisJabatan}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="Jabatan Struktural">Jabatan Struktural</option>
                    <option value="Jabatan Fungsional">Jabatan Fungsional</option>
                    <option value="Jabatan Pelaksana">Jabatan Pelaksana</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pangkatGolongan">Pangkat/Golongan</Label>
                  <Input
                    id="pangkatGolongan"
                    name="pangkatGolongan"
                    value={formData.pangkatGolongan}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tmt">TMT</Label>
                  <Input
                    id="tmt"
                    name="tmt"
                    type="date"
                    value={formData.tmt}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Input
                    id="jabatan"
                    name="jabatan"
                    value={formData.jabatan}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitKerja">Unit Kerja</Label>
                  <Input
                    id="unitKerja"
                    name="unitKerja"
                    value={formData.unitKerja}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pendidikanTerakhir">Pendidikan Terakhir</Label>
                  <select
                    id="pendidikanTerakhir"
                    name="pendidikanTerakhir"
                    value={formData.pendidikanTerakhir}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Pilih Pendidikan Terakhir</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA/SMK">SMA/SMK</option>
                    <option value="D1">D1</option>
                    <option value="D2">D2</option>
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noHp">Nomor HP</Label>
                  <Input
                    id="noHp"
                    name="noHp"
                    type="tel"
                    value={formData.noHp}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="alamat">Alamat Lengkap</Label>
                  <textarea
                    id="alamat"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleInputChange}
                    rows="3"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
                <Button type="submit">
                  {isEditMode ? 'Simpan Perubahan' : 'Tambah Data'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10"
      >
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Cari pegawai berdasarkan nama, NIP, unit kerja, atau jabatan..."
              className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Employee Statistics */}
      {!isLoading && pegawai.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <EmployeeStats employees={pegawai} />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-gray-900/50 backdrop-blur-lg border border-white/10 shadow-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
              <p className="mt-2 text-white/70">Memuat data...</p>
            </div>
          ) : (
            <Table className="min-w-full divide-y divide-white/10">
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-white/70 font-medium">Nama</TableHead>
                  <TableHead className="text-white/70 font-medium">NIP</TableHead>
                  <TableHead className="text-white/70 font-medium">Pangkat/Golongan</TableHead>
                  <TableHead className="text-white/70 font-medium">Jabatan</TableHead>
                  <TableHead className="text-white/70 font-medium">Unit Kerja</TableHead>
                  <TableHead className="text-white/70 font-medium">Masa Kerja</TableHead>
                  <TableHead className="text-right text-white/70 font-medium">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {filteredPegawai.length > 0 ? (
                  filteredPegawai.map((p) => (
                    <TableRow key={p.id} className="hover:bg-white/5 transition-colors">
                      <TableCell className="text-white/90">{p.nama || p.full_name || 'N/A'}</TableCell>
                      <TableCell className="text-white/70">{p.nip || 'N/A'}</TableCell>
                      <TableCell className="text-white/70">
                        {p.pangkatGolongan || p.pangkat_golongan || p.pangkat || p.golongan || 'N/A'}
                      </TableCell>
                      <TableCell className="text-white/70">{p.jabatan || p.position || 'N/A'}</TableCell>
                      <TableCell className="text-white/70">
                        {p.unitKerja || p.unit_kerja || p.unit || p.bagian || 'N/A'}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {(p.masaKerja?.tahun || p.masa_kerja?.tahun || 0)} tahun {(p.masaKerja?.bulan || p.masa_kerja?.bulan || 0)} bulan
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-400/70 hover:bg-blue-500/10 hover:text-blue-400"
                          onClick={() => navigate(`/pegawai/${p.id}`)}
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/70 hover:bg-white/10 hover:text-white"
                          onClick={() => handleEdit(p)}
                          title="Edit Data"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500/80 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => handleDelete(p.id || p._id)}
                          title="Hapus Data"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-white/50">
                      {searchTerm ? `Tidak ada pegawai yang sesuai dengan "${searchTerm}"` : 'Tidak ada data pegawai'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
