import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  BarChart3,
  Settings,
  LayoutDashboard,
  Lock,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useHeldStore } from '@/stores/heldStore';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useUIStore } from '@/stores/uiStore';

const navItems = [
  { to: '/pos', label: 'POS', icon: ShoppingCart, mobileOnly: false },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, desktopOnly: true },
  { to: '/products', label: 'Products', icon: Package, mobileOnly: false },
  { to: '/inventory', label: 'Inventory', icon: Warehouse, mobileOnly: false },
  { to: '/customers', label: 'Customers', icon: Users, mobileOnly: false },
  { to: '/reports', label: 'Reports', icon: BarChart3, desktopOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings, desktopOnly: true },
];

export function AppShell() {
  const isMobile = useIsMobile();
  const { storeName, isLocked, lock } = useAuthStore();
  const cartCount = useCartStore((s) => s.getItemCount());
  const heldCount = useHeldStore((s) => s.heldSales.length);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 h-14 bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Store className="h-5 w-5 text-primary shrink-0" />
            <span className="font-semibold text-sm truncate">{storeName}</span>
          </div>
          <button
            onClick={lock}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Lock"
          >
            <Lock className="h-4 w-4 text-muted-foreground" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-16">
          <Outlet />
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-40">
          {navItems
            .filter((item) => !item.desktopOnly)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors relative',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {item.to === '/pos' && cartCount > 0 && (
                    <span className="absolute -top-1 right-0 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 bg-card border-r border-border flex flex-col shrink-0">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{storeName}</div>
            <div className="text-xs text-muted-foreground">POS System</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems
            .filter((item) => !item.mobileOnly)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                  {item.to === '/pos' && cartCount > 0 && (
                    <span className="ml-auto bg-primary-foreground text-primary text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={lock}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          >
            <Lock className="h-5 w-5 shrink-0" />
            <span>Lock</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
