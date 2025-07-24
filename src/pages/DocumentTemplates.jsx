import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search, FileText, Download, Upload, X, XCircle, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DocumentTemplates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    file: null,
    file_name: '',
    file_size: 0,
    type: 'general',
    is_active: true
  });
  const [uploading, setUploading] = useState(false);

  const templateTypes = [
    { value: 'general', label: 'Umum' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'laporan', label: 'Laporan' },
    { value: 'surat', label: 'Surat' },
    { value: 'lainnya', label: 'Lainnya' }
  ];

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat daftar template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewTemplate({
        ...newTemplate,
        file,
        file_name: file.name,
        file_size: file.size,
        name: file.name.split('.').slice(0, -1).join('.')
      });
    }
  };

  const handleUploadTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.file) {
      toast({
        title: 'Error',
        description: 'Silakan pilih file template',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      
      // Upload file ke storage
      const fileExt = newTemplate.file_name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `templates/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(filePath, newTemplate.file);

      if (uploadError) throw uploadError;

      // Dapatkan URL file yang diunggah
      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(filePath);

      // Simpan data template ke database
      const { data, error } = await supabase
        .from('document_templates')
        .insert([{
          name: newTemplate.name,
          description: newTemplate.description,
          file_name: newTemplate.file_name,
          file_path: filePath,
          file_url: publicUrl,
          file_size: newTemplate.file_size,
          type: newTemplate.type,
          is_active: newTemplate.is_active,
          uploaded_by: user.id
        }])
        .select();

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Template berhasil diunggah',
      });

      setShowUploadModal(false);
      setNewTemplate({
        name: '',
        description: '',
        file: null,
        file_name: '',
        file_size: 0,
        type: 'general',
        is_active: true
      });
      
      fetchTemplates();
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengunggah template',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus template ini?')) return;
    
    try {
      // Dapatkan data template untuk menghapus file dari storage
      const { data: template, error: fetchError } = await supabase
        .from('document_templates')
        .select('file_path')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Hapus file dari storage
      if (template.file_path) {
        const { error: deleteError } = await supabase.storage
          .from('templates')
          .remove([template.file_path]);

        if (deleteError) throw deleteError;
      }

      // Hapus data template dari database
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Template berhasil dihapus',
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus template',
        variant: 'destructive',
      });
    }
  };

  const toggleTemplateStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('document_templates')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: `Template berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`,
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template status:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui status template',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredTemplates = templates.filter(template => {
    const searchLower = searchTerm.toLowerCase();
    const name = template.name?.toLowerCase() || '';
    const description = template.description?.toLowerCase() || '';
    return name.includes(searchLower) || description.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Template Dokumen</h1>
          <p className="text-muted-foreground mt-1">Kelola template dokumen untuk pengajuan</p>
        </div>
        <Button 
          onClick={() => setShowUploadModal(true)} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="w-4 h-4 mr-2" /> Unggah Template
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari template..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5" />
              Daftar Template
            </CardTitle>
            <CardDescription className="text-gray-300">
              {filteredTemplates.length} template ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Template</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Ukuran</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <TableRow key={template.id} className="hover:bg-white/5">
                  <TableCell className="font-medium text-white">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-blue-400" />
                      {template.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300 max-w-xs truncate">
                    {template.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className="bg-blue-900/30 text-blue-300 border-blue-700/50"
                    >
                      {templateTypes.find(t => t.value === template.type)?.label || template.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {formatFileSize(template.file_size)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${
                        template.is_active 
                          ? 'bg-green-900/30 text-green-300 border-green-700/50' 
                          : 'bg-red-900/30 text-red-300 border-red-700/50'
                      }`}
                    >
                      {template.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-400 hover:bg-blue-900/30 hover:text-blue-300"
                        onClick={() => window.open(template.file_url, '_blank')}
                        title="Unduh"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300"
                        onClick={() => toggleTemplateStatus(template.id, template.is_active)}
                        title={template.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {template.is_active ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-900/30 hover:text-red-300"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                  {searchTerm ? 'Template tidak ditemukan' : 'Belum ada template'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal Unggah Template */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Unggah Template Baru</h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUploadTemplate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Template <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Unggah file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
                            disabled={uploading}
                          />
                        </label>
                        <p className="pl-1">atau seret ke sini</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        DOC, DOCX, PDF, XLS, XLSX, PPT, PPTX (maks. 10MB)
                      </p>
                      {newTemplate.file_name && (
                        <p className="text-sm text-gray-900 mt-2">
                          {newTemplate.file_name} ({formatFileSize(newTemplate.file_size)})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Template <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    required
                    disabled={uploading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                    disabled={uploading}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Template
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newTemplate.type}
                      onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value})}
                      disabled={uploading}
                    >
                      {templateTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="is_active"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={newTemplate.is_active}
                      onChange={(e) => setNewTemplate({...newTemplate, is_active: e.target.checked})}
                      disabled={uploading}
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Aktifkan template
                    </label>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={!newTemplate.file || uploading}>
                    {uploading ? 'Mengunggah...' : 'Simpan Template'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTemplates;
