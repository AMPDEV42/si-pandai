import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
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
    { to: '/dashboard/admin-master', icon: <LayoutDashboard className="w-5 h-5" />, text: 'Dashboard Master' },
    { to: '/manajemen-pengguna', icon: <Users className="w-5 h-5" />, text: 'Manajemen Pengguna' },
    { to: '/pegawai', icon: <Users className="w-5 h-5" />, text: 'Data Pegawai' },
    { to: '/template-dokumen', icon: <FileText className="w-5 h-5" />, text: 'Template Dokumen' },
    { to: '/laporan', icon: <BarChart3 className="w-5 h-5" />, text: 'Laporan & Statistik' },
  ],
  'user': [
    { to: '/pengajuan/baru', icon: <FilePlus className="w-5 h-5" />, text: 'Ajukan Baru' },
    { to: '/pengajuan/riwayat', icon: <FileArchive className="w-5 h-5" />, text: 'Riwayat Pengajuan' },
  ],
};

const Sidebar = () => {
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
  
  // Admin master gets admin master links plus admin unit links
  if (user.role === 'admin-master') {
    links = [
      ...navLinks['admin-master'],
      { 
        to: '/pengajuan/baru', 
        icon: <FilePlus className="w-5 h-5" />, 
        text: 'Buat Usulan' 
      },
      { 
        to: '/pengajuan/riwayat-admin', 
        icon: <History className="w-5 h-5" />, 
        text: 'Riwayat Usulan' 
      }
    ];
  } else if (navLinks[user.role]) {
    // Regular users and admin unit get their respective links
    links = navLinks[user.role];
  }

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="w-64 bg-slate-900/50 glass-effect border-r border-white/10 flex flex-col p-4"
    >
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold gradient-text">SIPANDAI</h1>
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
          <p className="text-sm font-semibold text-white">{user?.name}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role.replace('-', ' ')}</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Keluar
        </Button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;