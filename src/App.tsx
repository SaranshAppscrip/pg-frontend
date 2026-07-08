import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BusinessProvider } from './contexts/BusinessContext';
import { PropertyProvider } from './contexts/PropertyContext';
import StaffLogin from './pages/staff/Login';
import ForgotPassword from './pages/staff/ForgotPassword';
import ResetPassword from './pages/staff/ResetPassword';
import Dashboard from './pages/staff/Dashboard';
import RoomsTenants from './pages/staff/RoomsTenants';
import Payments from './pages/staff/Payments';
import Expenses from './pages/staff/Expenses';
import KitchenStock from './pages/staff/KitchenStock';
import AuditLog from './pages/staff/AuditLog';
import ComplianceDocuments from './pages/staff/ComplianceDocuments';
import Operations from './pages/staff/Operations';
import Settings from './pages/staff/Settings';
import TenantLogin from './pages/tenant/TenantLogin';
import TenantForgotPassword from './pages/tenant/TenantForgotPassword';
import TenantResetPassword from './pages/tenant/TenantResetPassword';
import TenantPortal from './pages/tenant/TenantPortal';

function StaffRoute({ children }: { children: React.ReactNode }) {
  const { isStaff, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-soft">Loading…</p>
      </div>
    );
  }
  if (!isStaff) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<StaffLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/tenant/login" element={<TenantLogin />} />
      <Route path="/tenant/forgot-password" element={<TenantForgotPassword />} />
      <Route path="/tenant/reset-password" element={<TenantResetPassword />} />
      <Route path="/tenant" element={<TenantPortal />} />

      <Route path="/" element={<StaffRoute><Dashboard /></StaffRoute>} />
      <Route path="/rooms" element={<StaffRoute><RoomsTenants /></StaffRoute>} />
      <Route path="/documents" element={<StaffRoute><ComplianceDocuments /></StaffRoute>} />
      <Route path="/operations" element={<StaffRoute><Operations /></StaffRoute>} />
      <Route path="/payments" element={<StaffRoute><Payments /></StaffRoute>} />
      <Route path="/expenses" element={<StaffRoute><Expenses /></StaffRoute>} />
      <Route path="/kitchen" element={<StaffRoute><KitchenStock /></StaffRoute>} />
      <Route path="/activity" element={<StaffRoute><AuditLog /></StaffRoute>} />
      <Route path="/settings" element={<StaffRoute><Settings /></StaffRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BusinessProvider>
          <PropertyProvider>
            <AppRoutes />
          </PropertyProvider>
        </BusinessProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
