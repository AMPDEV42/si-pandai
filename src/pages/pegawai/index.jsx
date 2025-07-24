import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { format, parseISO, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { 
  getPegawai, 
  createPegawai, 
  updatePegawai, 
  deletePegawai 
} from '../../services/pegawaiService';

export default function DataPegawai() {
  const [pegawai, setPegawai] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    pangkatGolongan: '',
    tempatLahir: '',
    tanggalLahir: '',
    tmt: '',
    jabatan: '',
    unitKerja: '',
    riwayatDiklat: []
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchPegawai();
  }, []);

  const fetchPegawai = async () => {
    try {
      const data = await getPegawai();
      setPegawai(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching pegawai:', error);
      setIsLoading(false);
    }
  };

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
    setFormData({
      ...pegawai,
      id: pegawai.id,
      tanggalLahir: format(parseISO(pegawai.tanggal_lahir), 'yyyy-MM-dd'),
      tmt: format(parseISO(pegawai.tmt), 'yyyy-MM-dd')
    });
    setIsEditMode(true);
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
      pangkatGolongan: '',
      tempatLahir: '',
      tanggalLahir: '',
      tmt: '',
      jabatan: '',
      unitKerja: '',
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="pangkatGolongan">Pangkat/Golongan</Label>
                  <Input
                    id="pangkatGolongan"
                    name="pangkatGolongan"
                    value={formData.pangkatGolongan || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                  <Input
                    id="tempatLahir"
                    name="tempatLahir"
                    value={formData.tempatLahir || ''}
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
                    value={formData.unitKerja || ''}
                    onChange={handleInputChange}
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

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
                {pegawai.length > 0 ? (
                  pegawai.map((p) => (
                    <TableRow key={p.id} className="hover:bg-white/5 transition-colors">
                      <TableCell className="text-white/90">{p.nama}</TableCell>
                      <TableCell className="text-white/70">{p.nip}</TableCell>
                      <TableCell className="text-white/70">{p.pangkat_golongan}</TableCell>
                      <TableCell className="text-white/70">{p.jabatan}</TableCell>
                      <TableCell className="text-white/70">{p.unit_kerja}</TableCell>
                      <TableCell className="text-white/70">
                        {p.masa_kerja?.tahun} tahun {p.masa_kerja?.bulan} bulan
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-white/70 hover:bg-white/10 hover:text-white"
                          onClick={() => handleEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-500/80 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => handleDelete(p._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-white/50">
                      Tidak ada data pegawai
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
