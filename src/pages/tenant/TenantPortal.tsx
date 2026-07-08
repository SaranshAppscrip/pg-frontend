import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Pin, Megaphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { tenantApi, tenantPortalApi } from '../../lib/api';
import { TenantLayout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { PaymentStatusBadge } from '../../components/StatusBadge';
import { MaintenanceStatusBadge } from '../../components/MaintenanceStatusBadge';
import { StatCard } from '../../components/ui';
import {
  currentMonth,
  formatCurrency,
  formatDate,
  formatMonth,
  firstName,
  getPaymentStatus,
} from '../../lib/utils';
import {
  ANNOUNCEMENT_CATEGORIES,
  MAINTENANCE_CATEGORIES,
  type Payment,
  type Announcement,
  type MaintenanceRequest,
  type MaintenanceCategory,
} from '../../types/database';

export default function TenantPortal() {
  const { tenantToken, tenantProfile, refreshTenantProfile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    category: 'other' as MaintenanceCategory,
    title: '',
    description: '',
  });

  const month = currentMonth();

  useEffect(() => {
    if (!tenantToken) return;
    loadAll();
    refreshTenantProfile();
  }, [tenantToken]);

  async function loadAll() {
    if (!tenantToken) return;
    setLoading(true);
    try {
      const [p, a, m] = await Promise.all([
        tenantApi.payments(),
        tenantPortalApi.announcements(),
        tenantPortalApi.maintenance(),
      ]);
      setPayments(p);
      setAnnouncements(a);
      setMaintenance(m);
    } catch {
      setPayments([]);
      setAnnouncements([]);
      setMaintenance([]);
    }
    setLoading(false);
  }

  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await tenantPortalApi.createMaintenance({
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
      });
      setRequestOpen(false);
      setForm({ category: 'other', title: '', description: '' });
      setSuccess('Your request has been submitted. Staff will update you soon.');
      const m = await tenantPortalApi.maintenance();
      setMaintenance(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    }
    setSubmitting(false);
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
  const openRequests = maintenance.filter((m) => m.status === 'open' || m.status === 'in_progress');

  return (
    <TenantLayout>
      <div className="mb-6">
        <h1 className="page-title">Hello, {firstName(tenantProfile.name)}</h1>
        <p className="text-ink-soft text-sm mt-1">
          Room {tenantProfile.room_number ?? '—'} · {formatMonth(month)}
        </p>
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-ink">
          {success}
        </div>
      )}

      {announcements.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-lg font-semibold mb-3 flex items-center gap-2">
            <Megaphone size={20} className="text-rose" />
            Notice Board
          </h2>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="card p-4 border-l-4 border-l-rose">
                <div className="flex items-center gap-2 mb-1">
                  {a.pinned && <Pin size={14} className="text-rose" />}
                  <h3 className="font-medium">{a.title}</h3>
                  <span className="text-xs text-ink-soft bg-cream px-2 py-0.5 rounded">
                    {ANNOUNCEMENT_CATEGORIES.find((c) => c.value === a.category)?.label}
                  </span>
                </div>
                <p className="text-sm text-ink-soft whitespace-pre-wrap">{a.body}</p>
                <p className="text-xs text-ink-soft mt-2">{formatDate(a.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <StatCard label="Monthly fee" value={formatCurrency(Number(tenantProfile.monthly_fee))} />
        <div className="card p-4">
          <p className="text-xs text-ink-soft font-medium uppercase tracking-wide mb-1">This month</p>
          <div className="mt-2">
            <PaymentStatusBadge status={status} dueAmount={due} />
          </div>
        </div>
        <StatCard label="Open requests" value={openRequests.length} />
      </div>

      <div className="card overflow-hidden mb-8">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-serif text-lg font-semibold">Maintenance Requests</h2>
          <button className="btn-primary text-sm" onClick={() => setRequestOpen(true)}>
            <Plus size={16} /> Report Issue
          </button>
        </div>
        {maintenance.length === 0 ? (
          <p className="p-8 text-center text-ink-soft text-sm">
            No requests yet. Report electrical, plumbing, WiFi, or other issues here.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {maintenance.map((m) => (
              <div key={m.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-sm text-ink-soft mt-1">{m.description}</p>
                    {m.staff_note && (
                      <p className="text-sm mt-2 p-2 bg-cream rounded text-ink">
                        <span className="font-medium">Staff: </span>{m.staff_note}
                      </p>
                    )}
                    <p className="text-xs text-ink-soft mt-2">
                      {MAINTENANCE_CATEGORIES.find((c) => c.value === m.category)?.label}
                      {' · '}{formatDate(m.created_at)}
                    </p>
                  </div>
                  <MaintenanceStatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </div>
        )}
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

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Report an Issue">
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as MaintenanceCategory })}>
              {MAINTENANCE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" required placeholder="e.g. WiFi not working in room"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={4} required
              placeholder="Describe the issue in detail…"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </Modal>
    </TenantLayout>
  );
}
