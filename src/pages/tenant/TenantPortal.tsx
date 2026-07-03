import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tenantApi } from '../../lib/api';
import { TenantLayout } from '../../components/Layout';
import { PaymentStatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/ui';
import {
  currentMonth,
  formatCurrency,
  formatDate,
  formatMonth,
  firstName,
  getPaymentStatus,
} from '../../lib/utils';
import type { Payment } from '../../types/database';

export default function TenantPortal() {
  const { tenantToken, tenantProfile, refreshTenantProfile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const month = currentMonth();

  useEffect(() => {
    if (!tenantToken) return;
    loadPayments();
    refreshTenantProfile();
  }, [tenantToken]);

  async function loadPayments() {
    if (!tenantToken) return;
    setLoading(true);
    try {
      const data = await tenantApi.payments();
      setPayments(data);
    } catch {
      setPayments([]);
    }
    setLoading(false);
  }

  if (!tenantToken) return <Navigate to="/tenant/login" replace />;

  if (!tenantProfile || loading) {
    return (
      <TenantLayout>
        <p className="text-ink-soft">Loading your account…</p>
      </TenantLayout>
    );
  }

  const { status, due } = getPaymentStatus(Number(tenantProfile.monthly_fee), payments, month);

  return (
    <TenantLayout>
      <div className="mb-6">
        <h1 className="page-title">
          Hello, {firstName(tenantProfile.name)}
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          Room {tenantProfile.room_number ?? '—'} · {formatMonth(month)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <StatCard
          label="Monthly fee"
          value={formatCurrency(Number(tenantProfile.monthly_fee))}
        />
        <div className="card p-4">
          <p className="text-xs text-ink-soft font-medium uppercase tracking-wide mb-1">
            This month
          </p>
          <div className="mt-2">
            <PaymentStatusBadge status={status} dueAmount={due} />
          </div>
        </div>
        <StatCard label="Joined" value={formatDate(tenantProfile.join_date)} />
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-serif text-lg font-semibold">Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <p className="p-8 text-center text-ink-soft text-sm">
            No payments recorded yet for your account.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/50">
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">For Month</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Amount</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Mode</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-ink-soft">{formatDate(p.date)}</td>
                    <td className="px-5 py-3">{formatMonth(p.for_month)}</td>
                    <td className="px-5 py-3 font-mono font-medium">
                      {formatCurrency(Number(p.amount))}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{p.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
