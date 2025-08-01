import React, { useState } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { UserCircle, PlusCircle, Menu, LogOut, Settings, User, ChevronDown, Shield, Keyboard, HelpCircle } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import NotificationCenter from '../notifications/NotificationCenter';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../ui/use-toast';

const Header = () => {
  const { user, signOut } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

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
      'admin-master': 'Administrator Master',
      'admin-unit': 'Administrator Unit',
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

  return (
    <header className="h-16 w-full flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-400 hover:bg-white/10 hover:text-white"
          onClick={toggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </Button>
        {user?.role === 'admin-unit' && (
          <Link to="/pengajuan/baru">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Buat Usulan
            </Button>
          </Link>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationCenter />

        {/* Help Button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:bg-white/10 hover:text-white relative group"
          onClick={() => {
            toast({
              title: "Keyboard Shortcuts",
              description: "Ctrl+B: Toggle sidebar • Alt+D: Dashboard • Alt+N: New submission • Alt+H: History • Ctrl+/: Help",
            });
          }}
        >
          <HelpCircle className="w-5 h-5" />
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Keyboard Shortcuts
          </div>
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto p-2 hover:bg-white/10 focus:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar_url} alt={user?.name || user?.email} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                    {getInitials(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white truncate max-w-32">
                    {user?.name || user?.email}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs px-2 py-0.5 ${getRoleBadgeColor(user?.role)}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {getRoleDisplayName(user?.role)}
                    </Badge>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isUserDropdownOpen ? 'rotate-180' : ''
                }`} />
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 bg-slate-800/95 backdrop-blur-md border-white/10">
            <DropdownMenuLabel className="text-white">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || user?.email}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
                {user?.unitKerja && (
                  <p className="text-xs text-gray-400">{user?.unitKerja}</p>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem
              className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
              onClick={() => {
                // Navigate to profile page when implemented
                toast({
                  title: "Info",
                  description: "Halaman profil sedang dalam pengembangan",
                });
              }}
            >
              <User className="w-4 h-4 mr-2" />
              Profil Saya
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
              onClick={() => {
                // Navigate to settings page when implemented
                toast({
                  title: "Info",
                  description: "Halaman pengaturan sedang dalam pengembangan",
                });
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
