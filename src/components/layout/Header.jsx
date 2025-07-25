import React from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { UserCircle, PlusCircle, Menu } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { Button } from '../ui/button';
import NotificationCenter from '../notifications/NotificationCenter';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();

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
        <div className="flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-gray-400" />
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user?.name || user?.email}</p>
            <p className="text-xs text-gray-400">{user?.unitKerja || user?.role?.replace('-', ' ') || 'Administrator'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
