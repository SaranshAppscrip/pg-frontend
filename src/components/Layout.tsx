import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  ChefHat,
  ClipboardList,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
  FileCheck,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBusiness } from '../contexts/BusinessContext';
import { useProperty } from '../contexts/PropertyContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: Users, label: 'Rooms & Tenants' },
  { to: '/documents', icon: FileCheck, label: 'Compliance' },
  { to: '/operations', icon: ClipboardCheck, label: 'Operations' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen Stock' },
  { to: '/activity', icon: ClipboardList, label: 'Activity Log' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function PropertySwitcher() {
  const { properties, selectedPropertyId, selectedProperty, loading, setSelectedPropertyId } =
    useProperty();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const label = selectedProperty?.name ?? 'All properties';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-border bg-white hover:bg-cream transition-colors max-w-[200px]"
        title="Switch property"
        disabled={loading}
      >
        <Building2 size={16} className="shrink-0 text-rose" />
        <span className="truncate">{loading ? 'Loading…' : label}</span>
        <ChevronDown size={14} className="shrink-0 text-ink-soft" />
      </button>
      {open && (
        <div className="absolute left-0 mt-1 z-30 min-w-[220px] rounded-lg border border-border bg-white shadow-lg py-1">
          <button
            type="button"
            className={`w-full text-left px-4 py-2 text-sm hover:bg-cream ${
              selectedPropertyId == null ? 'font-medium text-rose' : ''
            }`}
            onClick={() => {
              setSelectedPropertyId(null);
              setOpen(false);
            }}
          >
            All properties
          </button>
          {properties.length === 0 ? (
            <p className="px-4 py-2 text-xs text-ink-soft border-t border-border">
              No properties yet — add one in Settings
            </p>
          ) : (
            properties.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`w-full text-left px-4 py-2 text-sm hover:bg-cream truncate ${
                  selectedPropertyId === p.id ? 'font-medium text-rose' : ''
                }`}
                onClick={() => {
                  setSelectedPropertyId(p.id);
                  setOpen(false);
                }}
              >
                {p.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function StaffLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOutStaff } = useAuth();
  const { pgName } = useBusiness();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile horizontal nav */}
      <nav className="md:hidden border-b border-border bg-white overflow-x-auto">
        <div className="flex items-center gap-2 px-3 py-2 min-w-max">
          <span className="font-serif font-semibold text-rose px-2 mr-1">{pgName}</span>
          <PropertySwitcher />
          <div className="w-px h-6 bg-border mx-1" />
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
        <div className="p-5 border-b border-border space-y-3">
          <div>
            <h1 className="font-serif text-xl font-semibold text-rose">{pgName}</h1>
            <p className="text-xs text-ink-soft mt-0.5">Staff Portal</p>
          </div>
          <PropertySwitcher />
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
