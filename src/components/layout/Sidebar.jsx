import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/button';
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
  FileArchive
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
            <div className="p-4 mb-4 text-center bg-white/5 rounded-lg">
              <p className="text-sm font-semibold text-white">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role.replace('-', ' ')}</p>
            </div>
            <div className="mt-auto pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-400 hover:bg-white/10 hover:text-red-300"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
