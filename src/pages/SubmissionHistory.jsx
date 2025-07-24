import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../lib/customSupabaseClient';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const statusConfig = {
  pending: {
    icon: <Clock className="w-4 h-4 text-yellow-500" />,
    label: 'Menunggu',
    color: 'bg-yellow-100 text-yellow-800',
  },
  approved: {
    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    label: 'Disetujui',
    color: 'bg-green-100 text-green-800',
  },
  rejected: {
    icon: <XCircle className="w-4 h-4 text-red-500" />,
    label: 'Ditolak',
    color: 'bg-red-100 text-red-800',
  },
  processed: {
    icon: <AlertCircle className="w-4 h-4 text-blue-500" />,
    label: 'Diproses',
    color: 'bg-blue-100 text-blue-800',
  },
};

const SubmissionHistory = ({ isAdminView = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [user, isAdminView]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('submissions')
        .select(`
          *,
          user:user_id (id, name, email, unit_kerja)
        `)
        .order('created_at', { ascending: false });

      // Filter berdasarkan role user dan mode tampilan
      if (isAdminView) {
        // Mode admin - tampilkan semua pengajuan
        if (user?.role === 'admin-unit') {
          query = query.eq('unit_kerja', user.unit_kerja);
        }
        // Admin master bisa melihat semua pengajuan tanpa filter
      } else {
        // Mode user - tampilkan hanya pengajuan user tersebut
        if (user?.role === 'user') {
          query = query.eq('user_id', user.id);
        } else if (user?.role === 'admin-unit') {
          query = query.eq('unit_kerja', user.unit_kerja);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch = 
      submission.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
    
    const matchesDate = !filterDate || 
      format(new Date(submission.created_at), 'yyyy-MM-dd') === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || {
      icon: <AlertCircle className="w-4 h-4 text-gray-500" />,
      label: 'Tidak Diketahui',
      color: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: id });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-xl mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isAdminView ? 'Daftar Pengajuan' : 'Riwayat Pengajuan'}
            </h1>
            <p className="text-gray-300">
              {isAdminView 
                ? 'Daftar pengajuan dari seluruh pengguna' 
                : 'Daftar pengajuan yang telah Anda buat'}
            </p>
          </div>
          {user?.role === 'user' && (
            <Button 
              onClick={() => navigate('/pengajuan/baru')}
              className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <FileText className="w-4 h-4 mr-2" /> Buat Pengajuan Baru
            </Button>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-inner overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari pengajuan..."
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="bg-white/5 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all" className="bg-gray-800">Semua Status</option>
                <option value="pending" className="bg-gray-800">Menunggu</option>
                <option value="processed" className="bg-gray-800">Diproses</option>
                <option value="approved" className="bg-gray-800">Disetujui</option>
                <option value="rejected" className="bg-gray-800">Ditolak</option>
              </select>
              
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-white/5 border-white/20 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          </div>
        
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  {isAdminView && <TableHead className="text-gray-300 font-medium">Pemohon</TableHead>}
                  <TableHead className="text-gray-300 font-medium">Judul</TableHead>
                  <TableHead className="text-gray-300 font-medium">Jenis</TableHead>
                  <TableHead className="text-gray-300 font-medium">Tanggal</TableHead>
                  <TableHead className="text-gray-300 font-medium">Status</TableHead>
                  <TableHead className="text-right text-gray-300 font-medium">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((submission) => (
                    <motion.tr 
                      key={submission.id} 
                      className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                      whileHover={{ scale: 1.005 }}
                      onClick={() => navigate(`/pengajuan/${submission.id}`)}
                    >
                      {isAdminView && (
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{submission.user?.name || 'Tidak Diketahui'}</span>
                            <span className="text-xs text-gray-400">{submission.user?.unit_kerja || ''}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="py-4">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-blue-400" />
                          <span className="text-white">{submission.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 py-4">{submission.type}</TableCell>
                      <TableCell className="text-gray-300 py-4">{formatDate(submission.created_at)}</TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(submission.status)}
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/pengajuan/${submission.id}`);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" /> Detail
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell 
                      colSpan={isAdminView ? 6 : 5} 
                      className="text-center py-12 text-gray-400"
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileText className="w-12 h-12 text-gray-500" />
                        <p className="text-lg font-medium">
                          {searchTerm || filterStatus !== 'all' || filterDate 
                            ? 'Tidak ada pengajuan yang sesuai dengan filter' 
                            : 'Belum ada riwayat pengajuan'}
                        </p>
                        {!searchTerm && filterStatus === 'all' && !filterDate && user?.role === 'user' && (
                          <Button 
                            onClick={() => navigate('/pengajuan/baru')}
                            className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          >
                            <FileText className="w-4 h-4 mr-2" /> Buat Pengajuan Baru
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubmissionHistory;
