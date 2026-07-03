import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { roomsApi, tenantsApi, paymentsApi } from '../../lib/api';
import { currentMonth, formatCurrency, formatDate, getPaymentStatus } from '../../lib/utils';
import { StaffLayout } from '../../components/Layout';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { PaymentStatusBadge } from '../../components/StatusBadge';
import { PageHeader, EmptyState } from '../../components/ui';
import { PAYMENT_MODES } from '../../types/database';
import type { Room, Tenant, Payment, PaymentMode } from '../../types/database';

export default function RoomsTenants() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [addTenantRoomId, setAddTenantRoomId] = useState<string | null>(null);
  const [paymentTenant, setPaymentTenant] = useState<Tenant | null>(null);
  const [moveOutTenant, setMoveOutTenant] = useState<Tenant | null>(null);
  const [removeRoom, setRemoveRoom] = useState<Room | null>(null);

  const [roomForm, setRoomForm] = useState({ room_number: '', capacity: '2' });
  const [tenantForm, setTenantForm] = useState({
    name: '', email: '', password: '', phone: '', monthly_fee: '', join_date: new Date().toISOString().slice(0, 10),
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '', date: new Date().toISOString().slice(0, 10),
    for_month: currentMonth(), mode: 'Cash' as PaymentMode,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [r, t, p] = await Promise.all([
        roomsApi.list(),
        tenantsApi.list(),
        paymentsApi.list(),
      ]);
      setRooms(r);
      setTenants(t);
      setPayments(p);
    } catch {
      // keep empty state
    }
    setLoading(false);
  }

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await roomsApi.create({
        room_number: roomForm.room_number.trim(),
        capacity: parseInt(roomForm.capacity, 10),
      });
      setAddRoomOpen(false);
      setRoomForm({ room_number: '', capacity: '2' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add room');
    }
    setSubmitting(false);
  }

  async function handleAddTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!addTenantRoomId) return;
    setSubmitting(true);
    setError('');
    try {
      await tenantsApi.create({
        name: tenantForm.name.trim(),
        email: tenantForm.email.trim(),
        password: tenantForm.password,
        phone: tenantForm.phone.trim() || undefined,
        room_id: addTenantRoomId,
        monthly_fee: parseFloat(tenantForm.monthly_fee),
        join_date: tenantForm.join_date,
      });
      setAddTenantRoomId(null);
      setTenantForm({ name: '', email: '', password: '', phone: '', monthly_fee: '', join_date: new Date().toISOString().slice(0, 10) });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tenant');
    }
    setSubmitting(false);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentTenant) return;
    setSubmitting(true);
    setError('');
    try {
      await paymentsApi.create({
        tenant_id: paymentTenant.id,
        amount: parseFloat(paymentForm.amount),
        date: paymentForm.date,
        for_month: paymentForm.for_month,
        mode: paymentForm.mode,
      });
      setPaymentTenant(null);
      setPaymentForm({ amount: '', date: new Date().toISOString().slice(0, 10), for_month: currentMonth(), mode: 'Cash' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    }
    setSubmitting(false);
  }

  async function handleMoveOut() {
    if (!moveOutTenant) return;
    setSubmitting(true);
    try {
      await tenantsApi.moveOut(moveOutTenant.id);
      setMoveOutTenant(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move out tenant');
    }
    setSubmitting(false);
  }

  async function handleRemoveRoom() {
    if (!removeRoom) return;
    setSubmitting(true);
    try {
      await roomsApi.delete(removeRoom.id);
      setRemoveRoom(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove room');
    }
    setSubmitting(false);
  }

  const sortedRooms = [...rooms].sort((a, b) =>
    a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
  );

  if (loading) {
    return <StaffLayout><p className="text-ink-soft">Loading…</p></StaffLayout>;
  }

  return (
    <StaffLayout>
      <PageHeader
        title="Rooms & Tenants"
        action={
          <button className="btn-primary" onClick={() => setAddRoomOpen(true)}>
            <Plus size={18} /> Add Room
          </button>
        }
      />

      {sortedRooms.length === 0 ? (
        <EmptyState message="No rooms yet. Click + Add Room to get started." />
      ) : (
        <div className="space-y-5">
          {sortedRooms.map((room) => {
            const occupants = tenants.filter((t) => t.room_id === room.id && t.active);
            const atCapacity = occupants.length >= room.capacity;

            return (
              <div key={room.id} className="card overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div>
                    <h2 className="font-serif text-lg font-semibold">
                      Room {room.room_number}
                    </h2>
                    <p className="text-xs text-ink-soft">
                      {occupants.length}/{room.capacity} occupied
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary text-sm"
                      disabled={atCapacity}
                      onClick={() => setAddTenantRoomId(room.id)}
                      title={atCapacity ? 'Room is at capacity' : undefined}
                    >
                      <Plus size={16} /> Add Tenant
                    </button>
                    <button
                      className="btn-ghost text-rose"
                      disabled={occupants.length > 0}
                      onClick={() => setRemoveRoom(room)}
                      title={occupants.length > 0 ? 'Remove tenants first' : undefined}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {occupants.length === 0 ? (
                  <p className="p-5 text-sm text-ink-soft">No tenants in this room.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-cream/50">
                          <th className="text-left px-5 py-3 font-medium text-ink-soft">Name</th>
                          <th className="text-left px-5 py-3 font-medium text-ink-soft">Phone</th>
                          <th className="text-left px-5 py-3 font-medium text-ink-soft">Fee</th>
                          <th className="text-left px-5 py-3 font-medium text-ink-soft">Status</th>
                          <th className="text-left px-5 py-3 font-medium text-ink-soft">Joined</th>
                          <th className="text-right px-5 py-3 font-medium text-ink-soft">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {occupants.map((tenant) => {
                          const tenantPayments = payments.filter((p) => p.tenant_id === tenant.id);
                          const { status, due } = getPaymentStatus(Number(tenant.monthly_fee), tenantPayments);
                          return (
                            <tr key={tenant.id} className="border-b border-border last:border-0">
                              <td className="px-5 py-3 font-medium">{tenant.name}</td>
                              <td className="px-5 py-3 font-mono text-xs">{tenant.phone ?? '—'}</td>
                              <td className="px-5 py-3 font-mono">{formatCurrency(Number(tenant.monthly_fee))}</td>
                              <td className="px-5 py-3">
                                <PaymentStatusBadge status={status} dueAmount={due} />
                              </td>
                              <td className="px-5 py-3 text-ink-soft">{formatDate(tenant.join_date)}</td>
                              <td className="px-5 py-3 text-right space-x-2">
                                <button className="btn-ghost text-xs" onClick={() => {
                                  setPaymentTenant(tenant);
                                  setPaymentForm((f) => ({ ...f, amount: String(tenant.monthly_fee) }));
                                }}>
                                  Record Payment
                                </button>
                                <button className="btn-ghost text-xs text-rose" onClick={() => setMoveOutTenant(tenant)}>
                                  Move Out
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={addRoomOpen} onClose={() => setAddRoomOpen(false)} title="Add Room">
        <form onSubmit={handleAddRoom} className="space-y-4">
          <div>
            <label className="label">Room number</label>
            <input className="input" required value={roomForm.room_number}
              onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} placeholder="e.g. 101" />
          </div>
          <div>
            <label className="label">Capacity</label>
            <input className="input" type="number" min="1" max="10" required value={roomForm.capacity}
              onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} />
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Room'}
          </button>
        </form>
      </Modal>

      <Modal open={!!addTenantRoomId} onClose={() => setAddTenantRoomId(null)} title="Add Tenant">
        <form onSubmit={handleAddTenant} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={tenantForm.name}
              onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={tenantForm.email}
              onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={6} value={tenantForm.password}
              onChange={(e) => setTenantForm({ ...tenantForm, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input className="input" value={tenantForm.phone}
              onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })} placeholder="10-digit mobile" />
          </div>
          <div>
            <label className="label">Monthly fee (₹)</label>
            <input className="input" type="number" min="0" required value={tenantForm.monthly_fee}
              onChange={(e) => setTenantForm({ ...tenantForm, monthly_fee: e.target.value })} />
          </div>
          <div>
            <label className="label">Join date</label>
            <input className="input" type="date" required value={tenantForm.join_date}
              onChange={(e) => setTenantForm({ ...tenantForm, join_date: e.target.value })} />
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Tenant'}
          </button>
        </form>
      </Modal>

      <Modal open={!!paymentTenant} onClose={() => setPaymentTenant(null)} title="Record Payment">
        {paymentTenant && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <p className="text-sm text-ink-soft">Recording for <strong>{paymentTenant.name}</strong></p>
            <div>
              <label className="label">Amount (₹)</label>
              <input className="input font-mono" type="number" min="1" required value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" required value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
            </div>
            <div>
              <label className="label">For month</label>
              <input className="input" type="month" required value={paymentForm.for_month}
                onChange={(e) => setPaymentForm({ ...paymentForm, for_month: e.target.value })} />
            </div>
            <div>
              <label className="label">Mode</label>
              <select className="input" value={paymentForm.mode}
                onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value as PaymentMode })}>
                {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {error && <p className="text-rose text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Saving…' : 'Record Payment'}
            </button>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!moveOutTenant}
        onClose={() => setMoveOutTenant(null)}
        onConfirm={handleMoveOut}
        title="Move Out Tenant"
        message={`Mark ${moveOutTenant?.name} as moved out? Their history will be kept.`}
        confirmLabel="Move Out"
        loading={submitting}
      />

      <ConfirmDialog
        open={!!removeRoom}
        onClose={() => setRemoveRoom(null)}
        onConfirm={handleRemoveRoom}
        title="Remove Room"
        message={`Delete room ${removeRoom?.room_number}? This cannot be undone.`}
        confirmLabel="Remove Room"
        loading={submitting}
      />
    </StaffLayout>
  );
}
