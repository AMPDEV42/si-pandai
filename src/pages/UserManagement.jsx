import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const UserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'user',
    unit_kerja: ''
  });

  // Daftar unit kerja
  const units = [
    'Biro Umum',
    'Biro Kepegawaian',
    'Biro Keuangan',
    'Biro Hukum',
    'Biro Perencanaan',
    'Biro Organisasi',
    'Biro Kerja Sama',
    'Biro Pengawasan',
    'Biro Pengembangan SDM',
    'Unit Lainnya'
  ];

  useEffect(() => {
    if (user?.role !== 'admin-master') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat daftar pengguna',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: 'password123', // Default password, user harus ganti saat login pertama
        email_confirm: true,
        user_metadata: {
          name: newUser.name,
          role: newUser.role,
          unit_kerja: newUser.unit_kerja
        }
      });

      if (error) throw error;

      // Tambahkan ke tabel users
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          unit_kerja: newUser.unit_kerja,
          status: 'active'
        }]);

      if (profileError) throw profileError;

      toast({
        title: 'Berhasil',
        description: 'Pengguna berhasil ditambahkan',
      });

      setNewUser({
        email: '',
        name: '',
        role: 'user',
        unit_kerja: ''
      });
      setShowAddUser(false);
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan pengguna',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;
    
    try {
      // Hapus dari auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Update status di tabel users
      const { error: updateError } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast({
        title: 'Berhasil',
        description: 'Pengguna berhasil dinonaktifkan',
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus pengguna',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const userName = user.name || '';
    const userEmail = user.email || '';
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = userName.toLowerCase().includes(searchTermLower) ||
                         userEmail.toLowerCase().includes(searchTermLower);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
          <h1 className="text-3xl font-bold text-white">Manajemen Pengguna</h1>
          <p className="text-muted-foreground mt-1">Kelola data pengguna dan akses sistem</p>
        </div>
        <Button onClick={() => setShowAddUser(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Tambah Pengguna
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
            placeholder="Cari pengguna..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm border-border/50">
            <SelectValue placeholder="Filter peran" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-sm border-border/50">
            <SelectItem value="all">Semua Peran</SelectItem>
            <SelectItem value="admin-master">Admin Master</SelectItem>
            <SelectItem value="admin-unit">Admin Unit</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Daftar Pengguna
            </CardTitle>
            <CardDescription className="text-gray-300">
              {filteredUsers.length} pengguna ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Nama</TableHead>
                  <TableHead className="text-white">Email</TableHead>
                  <TableHead className="text-white">Peran</TableHead>
                  <TableHead className="text-white">Unit Kerja</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-right text-white">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-white/5">
                  <TableCell className="font-medium text-white">{user.name}</TableCell>
                  <TableCell className="text-gray-300">{user.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${
                        user.role === 'admin-master' 
                          ? 'bg-purple-900/30 text-purple-300 border-purple-700/50' 
                          : user.role === 'admin-unit'
                          ? 'bg-blue-900/30 text-blue-300 border-blue-700/50'
                          : 'bg-gray-800/30 text-gray-300 border-gray-700/50'
                      }`}
                    >
                      {user.role === 'admin-master' ? 'Admin Master' : 
                       user.role === 'admin-unit' ? 'Admin Unit' : 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{user.unit_kerja || '-'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${
                        user.status === 'active' 
                          ? 'bg-green-900/30 text-green-300 border-green-700/50' 
                          : 'bg-red-900/30 text-red-300 border-red-700/50'
                      }`}
                    >
                      {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-blue-400 hover:bg-blue-900/30 hover:text-blue-300"
                      onClick={() => navigate(`/users/${user.id}/edit`)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.role === 'admin-master'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Tidak ada data pengguna
                </TableCell>
              </TableRow>
            )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal Tambah Pengguna */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tambah Pengguna Baru</h2>
              <button 
                onClick={() => setShowAddUser(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <Input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peran
                  </label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({...newUser, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih peran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin-master">Admin Master</SelectItem>
                      <SelectItem value="admin-unit">Admin Unit</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Kerja
                  </label>
                  <Select
                    value={newUser.unit_kerja}
                    onValueChange={(value) => setNewUser({...newUser, unit_kerja: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddUser(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit">Simpan</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
