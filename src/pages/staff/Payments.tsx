import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { paymentsApi, tenantsApi, roomsApi, exportApi } from '../../lib/api';
import { formatCurrency, formatDate, formatMonth } from '../../lib/utils';
import { StaffLayout } from '../../components/Layout';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { PageHeader, EmptyState } from '../../components/ui';
import { ExportMenu } from '../../components/ExportMenu';
import { PropertyFilterBanner } from '../../components/PropertyFilterBanner';
import { Banner } from '../../components/Banner';
import { useProperty } from '../../contexts/PropertyContext';
import { PAYMENT_MODES } from '../../types/database';
import type { Payment, Tenant, Room, PaymentMode } from '../../types/database';

interface PaymentRow extends Payment {
  tenant?: Tenant & { room?: Room };
}

export default function Payments() {
  const { selectedPropertyId, selectedProperty } = useProperty();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [tenants, setTenants] = useState<(Tenant & { room?: Room })[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exportMsg, setExportMsg] = useState('');

  const [form, setForm] = useState({
    tenant_id: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    for_month: new Date().toISOString().slice(0, 7),
    mode: 'Cash' as PaymentMode,
  });

  useEffect(() => { loadData(); }, [selectedPropertyId]);

  async function loadData() {
    setLoading(true);
    try {
      const [pData, tData, rData] = await Promise.all([
        paymentsApi.list(selectedPropertyId),
        tenantsApi.list(selectedPropertyId),
        roomsApi.list(selectedPropertyId),
      ]);
      const rooms = rData;
      const tenantsWithRooms = tData
        .filter((t) => t.active)
        .map((t) => ({
          ...t,
          room: rooms.find((r) => r.id === t.room_id),
        }));
      setTenants(tenantsWithRooms);
      setPayments(pData.map((p) => ({
        ...p,
        tenant: tenantsWithRooms.find((t) => t.id === p.tenant_id),
      })));
    } catch {
      // keep empty state
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await paymentsApi.create({
        tenant_id: form.tenant_id,
        amount: parseFloat(form.amount),
        date: form.date,
        for_month: form.for_month,
        mode: form.mode,
      });
      setAddOpen(false);
      setForm({ tenant_id: '', amount: '', date: new Date().toISOString().slice(0, 10), for_month: new Date().toISOString().slice(0, 7), mode: 'Cash' });
      setSuccess('Payment recorded. A receipt email with PDF was sent to the tenant.');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      await paymentsApi.delete(deleteId);
      setDeleteId(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment');
    }
    setSubmitting(false);
  }

  if (loading) {
    return <StaffLayout><p className="text-ink-soft">Loading…</p></StaffLayout>;
  }

  return (
    <StaffLayout>
      <PageHeader
        title="Payments"
        subtitle={selectedProperty ? selectedProperty.name : undefined}
        action={
          <div className="flex gap-2">
            <ExportMenu
              onExport={(format) => exportApi.payments(format, selectedPropertyId)}
              onSuccess={(format) => setExportMsg(`Exported payments as ${format.toUpperCase()}.`)}
              onError={(err) => setError(err.message)}
            />
            <button className="btn-primary" onClick={() => { setSuccess(''); setAddOpen(true); }}>
              <Plus size={18} /> Record Payment
            </button>
          </div>
        }
      />

      <PropertyFilterBanner />
      {success && <Banner message={success} variant="success" onDismiss={() => setSuccess('')} />}
      {exportMsg && <Banner message={exportMsg} variant="info" onDismiss={() => setExportMsg('')} />}
      {error && !addOpen && <Banner message={error} variant="error" onDismiss={() => setError('')} />}

      {payments.length === 0 ? (
        <EmptyState message="No payments recorded yet. Click + Record Payment to log one." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/50">
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Tenant</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Room</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">For Month</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Amount</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Mode</th>
                  <th className="text-right px-5 py-3 font-medium text-ink-soft"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-ink-soft">{formatDate(p.date)}</td>
                    <td className="px-5 py-3 font-medium">{p.tenant?.name ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs">{p.tenant?.room?.room_number ?? '—'}</td>
                    <td className="px-5 py-3">{formatMonth(p.for_month)}</td>
                    <td className="px-5 py-3 font-mono font-medium">{formatCurrency(Number(p.amount))}</td>
                    <td className="px-5 py-3 text-ink-soft">{p.mode}</td>
                    <td className="px-5 py-3 text-right">
                      <button className="btn-ghost text-rose p-1" onClick={() => setDeleteId(p.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Record Payment" wide>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label">Tenant</label>
            <select className="input" required value={form.tenant_id}
              onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}>
              <option value="">Select tenant…</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — Room {t.room?.room_number ?? '?'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input className="input font-mono" type="number" min="1" required value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" required value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">For month</label>
            <input className="input" type="month" required value={form.for_month}
              onChange={(e) => setForm({ ...form, for_month: e.target.value })} />
          </div>
          <div>
            <label className="label">Mode</label>
            <select className="input" value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value as PaymentMode })}>
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          <p className="text-xs text-ink-soft">
            A receipt email with PDF attachment is sent to the tenant automatically.
          </p>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Record Payment'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Payment"
        message="This payment will be removed from totals but kept in the activity log for your records."
        confirmLabel="Delete"
        loading={submitting}
      />
    </StaffLayout>
  );
}
