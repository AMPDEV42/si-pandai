import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
  const { isSidebarOpen } = useSidebar();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header and Sidebar Container */}
      <div className="flex">
        {/* Sidebar - Part of the header flow */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0`}>
          <div className="fixed top-0 bottom-0 left-0 w-64 h-screen overflow-y-auto">
            <Sidebar />
          </div>
        </div>
        
        {/* Header - Takes remaining width */}
        <div className="flex-1">
          <header className="sticky top-0 z-30 h-16 bg-slate-900/30 backdrop-blur-md border-b border-white/10">
            <Header />
          </header>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar Spacer - Matches the width of the sidebar */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0`}></div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
            <Outlet />
            
            {/* Footer */}
            <footer className="mt-8 pt-4 text-center text-sm text-gray-400 border-t border-white/10">
              <p>© {new Date().getFullYear()} SIPANDAI - Sistem Pengajuan Administrasi Digital ASN Terintegrasi</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
