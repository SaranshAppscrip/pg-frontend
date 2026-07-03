import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  ChefHat,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBusiness } from '../contexts/BusinessContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: Users, label: 'Rooms & Tenants' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen Stock' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function StaffLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOutStaff } = useAuth();
  const { pgName } = useBusiness();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile horizontal nav */}
      <nav className="md:hidden border-b border-border bg-white overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-2 min-w-max">
          <span className="font-serif font-semibold text-rose px-2 mr-2">{pgName}</span>
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                location.pathname === to
                  ? 'bg-rose-soft text-rose font-medium'
                  : 'text-ink-soft hover:bg-cream'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <button
            onClick={() => signOutStaff()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-ink-soft hover:bg-cream ml-2"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 border-r border-border bg-white shrink-0">
        <div className="p-5 border-b border-border">
          <h1 className="font-serif text-xl font-semibold text-rose">{pgName}</h1>
          <p className="text-xs text-ink-soft mt-0.5">Staff Portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                location.pathname === to
                  ? 'bg-rose-soft text-rose font-medium'
                  : 'text-ink-soft hover:bg-cream hover:text-ink'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={() => signOutStaff()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-soft hover:bg-cream w-full"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

export function TenantLayout({ children }: { children: React.ReactNode }) {
  const { signOutTenant } = useAuth();
  const { pgName } = useBusiness();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-semibold text-rose">{pgName}</h1>
            <p className="text-xs text-ink-soft">Tenant Portal</p>
          </div>
          <button onClick={signOutTenant} className="btn-ghost text-sm">
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
