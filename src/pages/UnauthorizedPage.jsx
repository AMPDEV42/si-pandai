import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 max-w-md w-full">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
        <p className="text-gray-600 mb-8">
          Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. 
          Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            Kembali
          </Button>
          <Button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto"
          >
            Ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
