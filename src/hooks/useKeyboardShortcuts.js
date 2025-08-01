import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useToast } from '../components/ui/use-toast';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts if user is typing in an input
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' || 
          event.target.isContentEditable) {
        return;
      }

      // Ctrl/Cmd + combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'b':
            event.preventDefault();
            toggleSidebar();
            break;
          case 'k':
            event.preventDefault();
            // Show search dialog when implemented
            toast({
              title: "Info",
              description: "Fitur pencarian sedang dalam pengembangan",
            });
            break;
          case '/':
            event.preventDefault();
            // Show help dialog when implemented
            toast({
              title: "Keyboard Shortcuts",
              description: "Ctrl+B: Toggle sidebar, Ctrl+K: Search, Ctrl+/: Help",
            });
            break;
        }
      }

      // Alt + combinations for navigation
      if (event.altKey && user) {
        switch (event.key) {
          case 'd':
            event.preventDefault();
            if (user.role === 'admin-master') {
              navigate('/dashboard/admin-master');
            } else if (user.role === 'admin-unit') {
              navigate('/dashboard/admin-unit');
            }
            break;
          case 'n':
            event.preventDefault();
            navigate('/pengajuan/baru');
            break;
          case 'h':
            event.preventDefault();
            if (user.role === 'admin-master' || user.role === 'admin-unit') {
              navigate('/pengajuan/riwayat-admin');
            } else {
              navigate('/pengajuan/riwayat');
            }
            break;
          case 'p':
            event.preventDefault();
            if (user.role === 'admin-master') {
              navigate('/pegawai');
            }
            break;
        }
      }

      // Escape key actions
      if (event.key === 'Escape') {
        // Close modals, dropdowns, etc.
        document.querySelector('[data-state="open"]')?.click();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, user, signOut, toggleSidebar, toast]);
};

export default useKeyboardShortcuts;
