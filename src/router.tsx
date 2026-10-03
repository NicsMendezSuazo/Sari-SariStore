import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SetupWizard } from '@/pages/setup/SetupWizard';
import { Login } from '@/pages/auth/Login';
import { POS } from '@/pages/pos/POS';
import { Dashboard } from '@/pages/admin/Dashboard';
import { Products } from '@/pages/admin/Products';
import { Categories } from '@/pages/admin/Categories';
import { Inventory } from '@/pages/admin/Inventory';
import { Customers } from '@/pages/admin/Customers';
import { Sales } from '@/pages/admin/Sales';
import { Reports } from '@/pages/admin/Reports';
import { Settings } from '@/pages/admin/Settings';
import { NotFound } from '@/pages/NotFound';
import { useAuthStore } from '@/stores/authStore';
import { useSettings } from '@/hooks/useSettings';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isSetup = useAuthStore((s) => s.isSetup);
  const isLocked = useAuthStore((s) => s.isLocked);

  if (!isSetup) {
    return <Navigate to="/setup" replace />;
  }
  if (isLocked) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const isSetup = useAuthStore((s) => s.isSetup);
  const isLocked = useAuthStore((s) => s.isLocked);
  const { data: settings, isLoading } = useSettings();
  const setup = useAuthStore((s) => s.setup);
  const [checked, setChecked] = useState(false);

  // Check if settings already exist (returning user)
  useEffect(() => {
    if (isLoading) return;
    if (settings && !isSetup) {
      setup(settings.store_name, settings.owner_name || '');
    }
    setChecked(true);
  }, [settings, isLoading, isSetup, setup]);

  if (isLoading || !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSetup) {
    return <SetupWizard />;
  }
  if (isLocked) {
    return <Login />;
  }

  return (
    <>
      <AppShell />
      <Toaster richColors position="top-center" />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: '/setup',
    element: <SetupWizard />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <AppRoutes />,
    children: [
      {
        path: '/pos',
        element: <ProtectedRoute><POS /></ProtectedRoute>,
      },
      {
        path: '/dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: '/products',
        element: <ProtectedRoute><Products /></ProtectedRoute>,
      },
      {
        path: '/categories',
        element: <ProtectedRoute><Categories /></ProtectedRoute>,
      },
      {
        path: '/inventory',
        element: <ProtectedRoute><Inventory /></ProtectedRoute>,
      },
      {
        path: '/customers',
        element: <ProtectedRoute><Customers /></ProtectedRoute>,
      },
      {
        path: '/sales',
        element: <ProtectedRoute><Sales /></ProtectedRoute>,
      },
      {
        path: '/reports',
        element: <ProtectedRoute><Reports /></ProtectedRoute>,
      },
      {
        path: '/settings',
        element: <ProtectedRoute><Settings /></ProtectedRoute>,
      },
      {
        path: '/',
        element: <Navigate to="/pos" replace />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
