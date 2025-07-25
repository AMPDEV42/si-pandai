import React, { useEffect, useMemo } from 'react';
import { 
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useNavigate,
  useLocation
} from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Toaster } from './components/ui/toaster';
import { AuthProvider, useAuth } from './contexts/SupabaseAuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import LoginPage from './pages/LoginPage';
import AdminUnitDashboard from './pages/AdminUnitDashboard';
import AdminMasterDashboard from './pages/AdminMasterDashboard';
import SubmissionForm from './pages/SubmissionForm';
import SubmissionDetail from './pages/SubmissionDetail';
import UserManagement from './pages/UserManagement';
import ReportsPage from './pages/ReportsPage';
import DocumentTemplates from './pages/DocumentTemplates';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UnauthorizedPage from './pages/UnauthorizedPage';
import SubmissionHistory from './pages/SubmissionHistory';
// import SubmissionCategories from './pages/SubmissionCategories';
import NewSubmissionPage from './pages/NewSubmissionPage';
import DataPegawai from './pages/pegawai/index.jsx';

// Component to handle initial redirect
const InitialRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const userRole = user.role || user.user_metadata?.role;
      
      if (userRole === 'admin-master') {
        navigate('/dashboard/admin-master', { replace: true });
      } else if (userRole === 'admin-unit') {
        navigate('/dashboard/admin-unit', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
};

const AppContent = () => {
  const { session, loading } = useAuth();
  
  // Create the router configuration
  const router = createBrowserRouter(
    [
      {
        path: "/login",
        element: !session ? <LoginPage /> : <InitialRedirect />,
      },
      {
        path: "/unauthorized",
        element: <UnauthorizedPage />,
      },
      {
        element: <MainLayout />,
        children: [
          {
            path: "/dashboard/admin-master",
            element: (
              <ProtectedRoute allowedRoles={['admin-master']}>
                <AdminMasterDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "/manajemen-pengguna",
            element: (
              <ProtectedRoute allowedRoles={['admin-master']}>
                <UserManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "/laporan",
            element: (
              <ProtectedRoute allowedRoles={['admin-master']}>
                <ReportsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "/template-dokumen",
            element: (
              <ProtectedRoute allowedRoles={['admin-master']}>
                <DocumentTemplates />
              </ProtectedRoute>
            ),
          },
          {
            path: "/dashboard/admin-unit",
            element: (
              <ProtectedRoute allowedRoles={['admin-unit']}>
                <AdminUnitDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "/pengajuan/baru",
            element: (
              <ProtectedRoute allowedRoles={['admin-unit', 'user', 'admin-master']}>
                <NewSubmissionPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "/pengajuan/baru/old",
            element: (
              <ProtectedRoute allowedRoles={['admin-unit', 'admin-master']}>
                <SubmissionForm />
              </ProtectedRoute>
            ),
          },
          {
            path: "/pengajuan/riwayat",
            element: (
              <ProtectedRoute allowedRoles={['user', 'admin-unit']}>
                <SubmissionHistory />
              </ProtectedRoute>
            ),
          },
          {
            path: "/pengajuan/riwayat-admin",
            element: (
              <ProtectedRoute allowedRoles={['admin-unit', 'admin-master']}>
                <SubmissionHistory isAdminView={true} />
              </ProtectedRoute>
            ),
          },
          {
            path: "/pengajuan/:id",
            element: (
              <ProtectedRoute allowedRoles={['user', 'admin-unit', 'admin-master']}>
                <SubmissionDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: "/pegawai",
            element: (
              <ProtectedRoute allowedRoles={['admin-master']}>
                <DataPegawai />
              </ProtectedRoute>
            ),
          },
          {
            path: "/",
            element: <InitialRedirect />,
          },
          {
            path: "*",
            element: <Navigate to="/" replace />,
          },
        ],
      },
    ],
    {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>SIPANDAI - Sistem Informasi Pengajuan Administrasi Digital ASN Terintegrasi</title>
        <meta name="description" content="Platform digital untuk memfasilitasi proses pengajuan berbagai jenis usulan administrasi kepegawaian PNS secara efisien dan terintegrasi." />
      </Helmet>
      <div className="min-h-screen">
        <Toaster />
        <RouterProvider router={router} />
      </div>
    </HelmetProvider>
  );
};

const App = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SidebarProvider>
          <AppContent />
          <Toaster />
        </SidebarProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};
export default App;
