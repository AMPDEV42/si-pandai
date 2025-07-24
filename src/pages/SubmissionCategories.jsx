import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, X, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { getSubmissionsByCategory, getSubmissionTypeById } from '@/data/submissionTypes';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SubmissionCategories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedType, setSelectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        if (!user) {
          navigate('/login', { state: { from: '/pengajuan/baru' } });
          return;
        }

        if (user.role !== 'admin-unit' && user.role !== 'admin-master') {
          navigate('/unauthorized');
          return;
        }

        const data = getSubmissionsByCategory();
        setCategories(data);
        
        // Initialize expanded state for each category
        const initialExpanded = {};
        Object.keys(data).forEach(category => {
          initialExpanded[category] = true;
        });
        setExpandedCategories(initialExpanded);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Gagal memuat daftar kategori. Silakan coba lagi nanti.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCategories();
  }, [user, navigate]);
  
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleCardClick = (e, typeId) => {
    e.preventDefault();
    e.stopPropagation();
    const typeData = getSubmissionTypeById(typeId);
    if (typeData) {
      setSelectedType(typeData);
    }
  };

  const handleCloseModal = () => {
    setSelectedType(null);
  };

  const handleFormSubmitSuccess = () => {
    handleCloseModal();
    // Optionally show success message or refresh data
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">Memuat daftar pengajuan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="max-w-md w-full p-6 bg-gray-800 rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Muat Ulang Halaman
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Buat Usulan Baru
          </motion.h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Pilih jenis pengajuan yang sesuai dengan kebutuhan Anda. Pastikan Anda telah mempersiapkan semua dokumen yang dibutuhkan.
          </p>
        </div>

        <div className="space-y-6">
          {Object.entries(categories).map(([category, types]) => (
            <div key={category} className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-800/80 hover:bg-gray-700/80 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    {category}
                  </h2>
                  <span className="text-sm bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full">
                    {types.length} Jenis
                  </span>
                </div>
                {expandedCategories[category] ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedCategories[category] && (
                <div className="p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {types.map((type) => (
                      <motion.div
                        key={type.id}
                        whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => handleCardClick(e, type.id)}
                        className="cursor-pointer"
                      >
                        <Card className="h-full bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/50 transition-all duration-300">
                          <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 bg-blue-500/20 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <CardTitle className="text-white text-lg font-medium leading-tight line-clamp-2">
                                  {type.title}
                                </CardTitle>
                                <CardDescription className="mt-1 text-sm text-gray-400">
                                  {type.requirements.length} persyaratan
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-end">
                              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                                Buat Pengajuan
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submission Form Modal */}
      <Dialog open={!!selectedType} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              {selectedType?.title || 'Form Pengajuan'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-3">Persyaratan Dokumen</h3>
              <ul className="space-y-2">
                {selectedType?.requirements?.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-4">Formulir Pengajuan</h3>
              <div className="space-y-4">
                <div className="p-4 border border-dashed border-gray-600 rounded-lg text-center">
                  <p className="text-gray-400 mb-2">Formulir akan ditampilkan di sini</p>
                  <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
                    Pilih File
                  </Button>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={handleCloseModal}>
                    Batal
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Ajukan Sekarang
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionCategories;
