import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { UserCheck, Shield, Building2, Users, Mail, KeyRound } from 'lucide-react';

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin-unit',
    fullName: '',
    unitKerja: ''
  });
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const handleLoginSuccess = (userData) => {
      // Navigasi berdasarkan role setelah login berhasil dengan React Router
      if (userData?.user?.user_metadata?.role === 'admin-master') {
        navigate('/dashboard/admin-master', { replace: true });
      } else if (userData?.user?.user_metadata?.role === 'admin-unit') {
        navigate('/dashboard/admin-unit', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    };

    try {
      if (isSignUp) {
        // Proses pendaftaran
        if (!formData.email || !formData.password || !formData.fullName || !formData.role) {
          throw new Error('Semua field harus diisi');
        }
        
        // Validasi email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          throw new Error('Format email tidak valid');
        }
        
        // Validasi password minimal 6 karakter
        if (formData.password.length < 6) {
          throw new Error('Password minimal 6 karakter');
        }

        await signUp(formData.email, formData.password, {
          fullName: formData.fullName,
          role: formData.role,
          unitKerja: formData.unitKerja
        });
        
        // Reset form setelah pendaftaran berhasil
        setFormData({
          email: '',
          password: '',
          role: 'admin-unit',
          fullName: '',
          unitKerja: ''
        });
        
        setIsSignUp(false);
        toast({
          title: 'Pendaftaran Berhasil',
          description: 'Silakan login dengan akun Anda',
        });
      } else {
        // Proses login
        if (!formData.email || !formData.password) {
          throw new Error('Email dan password harus diisi');
        }

        await signIn(formData.email, formData.password, handleLoginSuccess);
        
        // Reset form setelah login berhasil
        setFormData({
          ...formData,
          password: ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Terjadi Kesalahan',
        description: error.message || 'Terjadi kesalahan saat memproses permintaan',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{isSignUp ? 'Registrasi' : 'Login'} - SIPANDAI</title>
        <meta name="description" content="Masuk atau daftar ke sistem SIPANDAI untuk mengakses layanan administrasi kepegawaian digital." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="glass-effect border-white/20 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              
              <div>
                <CardTitle className="text-3xl font-bold gradient-text">SIPANDAI</CardTitle>
                <CardDescription className="text-gray-300 mt-2">
                  {isSignUp ? 'Buat akun baru Anda' : 'Masuk ke akun Anda'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-200">Nama Lengkap</Label>
                    <Input id="fullName" type="text" placeholder="Masukkan nama lengkap" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                  </motion.div>
                )}
                
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">Email</Label>
                  <Input id="email" type="email" placeholder="Masukkan email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200">Password</Label>
                  <Input id="password" type="password" placeholder="Masukkan password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                </motion.div>

                {isSignUp && (
                  <>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="space-y-2">
                      <Label htmlFor="role" className="text-gray-200">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20">
                          <SelectItem value="admin-unit" className="text-white hover:bg-white/10"><div className="flex items-center gap-2"><Building2 className="w-4 h-4" />Admin Unit Kerja</div></SelectItem>
                          <SelectItem value="admin-master" className="text-white hover:bg-white/10"><div className="flex items-center gap-2"><Users className="w-4 h-4" />Admin Master</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="space-y-2">
                      <Label htmlFor="unitKerja" className="text-gray-200">Unit Kerja</Label>
                      <Input id="unitKerja" type="text" placeholder="e.g., Bagian Kepegawaian" value={formData.unitKerja} onChange={(e) => setFormData({...formData, unitKerja: e.target.value})} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                    </motion.div>
                  </>
                )}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Memproses...</div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {isSignUp ? <Mail className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        {isSignUp ? 'Daftar' : 'Masuk'}
                      </div>
                    )}
                  </Button>
                </motion.div>
                
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
                    <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-cyan-400 hover:text-cyan-300">
                      {isSignUp ? 'Masuk di sini' : 'Daftar di sini'}
                    </Button>
                  </p>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
