import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, useIsAuthenticated, useMsal } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { msalConfig, loginRequest } from './config/authConfig';
import { setMsalInstance } from './services/api';

// Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EdificiosPage from './pages/EdificiosPage';
import PresupuestoPage from './pages/PresupuestoPage';
import GastosPage from './pages/GastosPage';
import ReportesPage from './pages/ReportesPage';

// Layouts
import MainLayout from './components/layouts/MainLayout';

// ============================================
// MSAL INSTANCE
// ============================================

const msalInstance = new PublicClientApplication(msalConfig);

// Configurar la instancia de MSAL en el servicio de API
setMsalInstance(msalInstance);

// ============================================
// REACT QUERY CLIENT
// ============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();
  
  useEffect(() => {
    if (!isAuthenticated) {
      // Si no está autenticado, iniciar el flujo de login
      instance.loginRedirect(loginRequest).catch((error) => {
        console.error('Error en login redirect:', error);
      });
    }
  }, [isAuthenticated, instance]);
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-celaque-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Autenticando...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// ============================================
// APP ROUTES
// ============================================

function AppRoutes() {
  return (
    <Routes>
      {/* Ruta pública de login */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="edificios" element={<EdificiosPage />} />
        <Route path="presupuesto" element={<PresupuestoPage />} />
        <Route path="gastos" element={<GastosPage />} />
        <Route path="reportes" element={<ReportesPage />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </MsalProvider>
  );
}

export default App;
