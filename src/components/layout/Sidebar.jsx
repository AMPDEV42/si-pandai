import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  FileCheck2,
  LayoutDashboard,
  FilePlus,
  History,
  Users,
  LogOut,
  Settings,
  FileText,
  BarChart3,
  FileArchive,
  Shield,
  AlertCircle
} from 'lucide-react';

const navLinks = {
  'admin-unit': [
    { to: '/pengajuan/baru', icon: <FilePlus className="w-5 h-5" />, text: 'Buat Usulan' },
    { to: '/pengajuan/riwayat-admin', icon: <History className="w-5 h-5" />, text: 'Riwayat Usulan' },
  ],
  'admin-master': [
    { to: '/dashboard/admin-master', icon: <LayoutDashboard className="w-5 h-5" />, text: 'Dashboard' },
    { to: '/pegawai', icon: <Users className="w-5 h-5" />, text: 'Data Pegawai' },
    { to: '/pengajuan/baru', icon: <FilePlus className="w-5 h-5" />, text: 'Buat Usulan' },
    { to: '/pengajuan/riwayat-admin', icon: <History className="w-5 h-5" />, text: 'Riwayat Usulan' },
    { to: '/template-dokumen', icon: <FileText className="w-5 h-5" />, text: 'Template Dokumen' },
    { to: '/laporan', icon: <BarChart3 className="w-5 h-5" />, text: 'Laporan & Statistik' },
    { to: '/manajemen-pengguna', icon: <Users className="w-5 h-5" />, text: 'Manajemen Pengguna' },
  ],
  'user': [
    { to: '/pengajuan/baru', icon: <FilePlus className="w-5 h-5" />, text: 'Ajukan Baru' },
    { to: '/pengajuan/riwayat', icon: <FileArchive className="w-5 h-5" />, text: 'Riwayat Pengajuan' },
  ],
};

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari sistem",
      });
      navigate('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal Logout',
        description: error.message || 'Terjadi kesalahan saat logout',
      });
    }
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'admin-master': 'Admin Master',
      'admin-unit': 'Admin Unit',
      'user': 'Pengguna'
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colorMap = {
      'admin-master': 'bg-red-500/20 text-red-300 border-red-500/30',
      'admin-unit': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'user': 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return colorMap[role] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // If no user is logged in, don't render the sidebar
  if (!user) {
    return null;
  }

  // Get links based on user role
  let links = [];
  
  if (navLinks[user.role]) {
    links = navLinks[user.role];
  }

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.aside
          initial={{ x: -250, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -250, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-screen bg-slate-900/95 backdrop-blur-md border-r border-white/10 flex flex-col p-4 w-64"
        >
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileCheck2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">SIPANDAI</h1>
                <p className="text-xs text-gray-400 leading-tight mt-0.5">
                  Sistem Pengajuan Administrasi Digital ASN Terintegrasi
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 mt-8 space-y-2">
            {links.map((link, index) => (
              <NavLink
                key={index}
                to={link.to}
                end={link.to === '/dashboard/admin-master' || link.to === '/dashboard/admin-unit'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg font-medium'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white font-normal hover:font-medium'
                  }`
                }
              >
                {React.cloneElement(link.icon, {
                  className: `w-5 h-5 ${link.icon.props.className || ''} opacity-100`
                })}
                <span className="text-sm">{link.text}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto">
            {/* Enhanced User Profile Section */}
            <div className="p-4 mb-4 bg-gradient-to-r from-white/5 to-white/10 rounded-lg border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user?.avatar_url} alt={user?.name || user?.email} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                    {getInitials(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex items-center justify-center mb-3">
                <Badge className={`text-xs px-3 py-1 ${getRoleBadgeColor(user?.role)}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {getRoleDisplayName(user?.role)}
                </Badge>
              </div>

              {/* Unit Kerja */}
              {user?.unitKerja && (
                <p className="text-xs text-center text-gray-400 mb-3">
                  {user.unitKerja}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  toast({
                    title: "Info",
                    description: "Halaman pengaturan sedang dalam pengembangan",
                  });
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Pengaturan
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all duration-200"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar dari Sistem
              </Button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
