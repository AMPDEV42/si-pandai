import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Download, BarChart2, FileText, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([
    {
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    byUnit: {},
    byType: {}
  });

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const startDate = format(dateRange[0].startDate, 'yyyy-MM-dd');
      const endDate = format(dateRange[0].endDate, 'yyyy-MM-dd');

      // Dapatkan data pengajuan berdasarkan rentang tanggal
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .gte('submitted_at', `${startDate}T00:00:00`)
        .lte('submitted_at', `${endDate}T23:59:59`);

      if (error) throw error;

      // Hitung statistik
      const totalSubmissions = submissions.length;
      const approved = submissions.filter(s => s.status === 'approved').length;
      const pending = submissions.filter(s => s.status === 'pending').length;
      const rejected = submissions.filter(s => s.status === 'rejected').length;

      // Hitung berdasarkan unit kerja
      const byUnit = {};
      submissions.forEach(sub => {
        const unit = sub.unit_kerja || 'Tidak Diketahui';
        byUnit[unit] = (byUnit[unit] || 0) + 1;
      });

      // Hitung berdasarkan jenis pengajuan
      const byType = {};
      submissions.forEach(sub => {
        const type = sub.type || 'Lainnya';
        byType[type] = (byType[type] || 0) + 1;
      });

      setStats({
        totalSubmissions,
        approved,
        pending,
        rejected,
        byUnit,
        byType
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    // Implementasi ekspor laporan
    console.log(`Exporting ${type} report...`);
    // Di sini bisa ditambahkan logika untuk mengekspor ke PDF/Excel
  };

  const statusData = {
    labels: ['Disetujui', 'Menunggu', 'Ditolak'],
    datasets: [
      {
        data: [stats.approved, stats.pending, stats.rejected],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0,
      },
    ],
  };

  const unitData = {
    labels: Object.keys(stats.byUnit),
    datasets: [
      {
        label: 'Jumlah Pengajuan',
        data: Object.values(stats.byUnit),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#EC4899',
          '#14B8A6',
        ],
        borderWidth: 0,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-xl"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Laporan & Statistik</h1>
          <p className="text-gray-300">Analisis data pengajuan dokumen</p>
        </div>
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white hover:border-white/30 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            {format(dateRange[0].startDate, 'dd MMM yyyy', { locale: id })} - {format(dateRange[0].endDate, 'dd MMM yyyy', { locale: id })}
          </Button>
          {showDatePicker && (
            <div className="absolute right-0 mt-2 z-10 bg-gray-800/95 backdrop-blur-md shadow-2xl rounded-xl border border-white/10 p-4">
              <DateRange
                editableDateInputs={true}
                onChange={item => {
                  setDateRange([item.selection]);
                  setShowDatePicker(false);
                }}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
                locale={id}
                className="border-0"
                rangeColors={['#3B82F6']}
              />
            </div>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Pengajuan</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20">
              <FileText className="h-4 w-4 text-blue-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalSubmissions}</div>
            <p className="text-xs text-blue-200/70 mt-1">
              {format(dateRange[0].startDate, 'dd MMM yyyy')} - {format(dateRange[0].endDate, 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/20 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Disetujui</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.approved}</div>
            <p className="text-xs text-green-200/70 mt-1">
              {stats.totalSubmissions > 0 ? Math.round((stats.approved / stats.totalSubmissions) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/20 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Menunggu</CardTitle>
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Clock className="h-4 w-4 text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pending}</div>
            <p className="text-xs text-yellow-200/70 mt-1">
              {stats.totalSubmissions > 0 ? Math.round((stats.pending / stats.totalSubmissions) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/20 border border-red-500/30 hover:border-red-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Ditolak</CardTitle>
            <div className="p-2 rounded-lg bg-red-500/20">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.rejected}</div>
            <p className="text-xs text-red-200/70 mt-1">
              {stats.totalSubmissions > 0 ? Math.round((stats.rejected / stats.totalSubmissions) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card className="bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-3">
            <CardTitle className="text-white">Status Pengajuan</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('status')}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
            >
              <Download className="w-4 h-4 mr-2" /> Ekspor
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64">
              <Pie
                data={statusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        color: '#e2e8f0',
                        font: {
                          family: 'Inter',
                        },
                        padding: 20
                      }
                    },
                  },
                  elements: {
                    arc: {
                      borderWidth: 0
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-lg border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-3">
            <CardTitle className="text-white">Pengajuan per Unit Kerja</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('unit')}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
            >
              <Download className="w-4 h-4 mr-2" /> Ekspor
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64">
              <Bar
                data={unitData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                        color: '#94a3b8',
                        font: {
                          family: 'Inter',
                        },
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                      }
                    },
                    x: {
                      ticks: {
                        color: '#94a3b8',
                        font: {
                          family: 'Inter',
                        },
                      },
                      grid: {
                        display: false
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3"
      >
        <Button 
          variant="outline" 
          onClick={() => handleExport('summary')}
          className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-colors"
        >
          <FileText className="w-4 h-4 mr-2" /> Ekspor Ringkasan
        </Button>
        <Button 
          onClick={() => handleExport('full')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
        >
          <Download className="w-4 h-4 mr-2" /> Ekspor Laporan Lengkap
        </Button>
      </motion.div>
    </div>
  );
};

export default ReportsPage;
