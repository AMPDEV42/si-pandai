import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { UserCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user } = useAuth();


  return (
    <header className="h-16 flex items-center justify-between px-8 bg-slate-900/30 glass-effect border-b border-white/10">
      <div>
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
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.unitKerja || 'Administrator'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;