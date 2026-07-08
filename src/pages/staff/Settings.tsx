import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { staffApi, propertiesApi, remindersApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { useProperty } from '../../contexts/PropertyContext';
import { StaffLayout } from '../../components/Layout';
import { ConfirmDialog, Modal } from '../../components/Modal';
import { PageHeader } from '../../components/ui';
import type { StaffProfile, Property } from '../../types/database';

export default function Settings() {
  const { staffUser } = useAuth();
  const isOwner = staffUser?.is_owner ?? false;
  const { pgName, updatePgName } = useBusiness();
  const { properties, refreshProperties } = useProperty();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [name, setName] = useState(pgName);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reminderType, setReminderType] = useState<'due' | 'overdue'>('due');
  const [reminderForce, setReminderForce] = useState(false);
  const [reminderRunning, setReminderRunning] = useState(false);
  const [removeStaff, setRemoveStaff] = useState<StaffProfile | null>(null);

  useEffect(() => {
    setName(pgName);
  }, [pgName]);

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    setLoading(true);
    try {
      const data = await staffApi.list();
      setStaff(data);
    } catch {
      // keep empty state
    }
    setLoading(false);
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error: err } = await updatePgName(name.trim());
    setSaving(false);
    if (err) setError(err);
    else setSuccess('Business name updated.');
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await staffApi.invite(inviteEmail.trim(), invitePassword);
      setSuccess(
        `Invitation email sent to ${inviteEmail.trim()}. They will receive the login link, email, and temporary password. After first sign-in, they should use Forgot password to set their own password.`
      );
      setInviteEmail('');
      setInvitePassword('');
      loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite staff');
    }
    setSaving(false);
  }

  async function handleCreateProperty(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await propertiesApi.create({
        name: propertyName.trim(),
        address: propertyAddress.trim() || null,
      });
      setPropertyName('');
      setPropertyAddress('');
      setSuccess('Property created.');
      await refreshProperties();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property');
    }
    setSaving(false);
  }

  async function handleUpdateProperty(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProperty) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await propertiesApi.update(editingProperty.id, {
        name: editName.trim(),
        address: editAddress.trim() || null,
      });
      setEditingProperty(null);
      setSuccess('Property updated.');
      await refreshProperties();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property');
    }
    setSaving(false);
  }

  async function handleRunReminders() {
    setReminderRunning(true);
    setError('');
    setSuccess('');
    try {
      const result = await remindersApi.run(reminderType, reminderForce);
      setSuccess(
        `Rent reminders sent to ${result.sent} tenant${result.sent === 1 ? '' : 's'} (${result.type}).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reminders');
    }
    setReminderRunning(false);
  }

  async function handleRemoveStaff() {
    if (!removeStaff) return;
    setSaving(true);
    try {
      await staffApi.remove(removeStaff.id);
      setRemoveStaff(null);
      loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove staff');
    }
    setSaving(false);
  }

  return (
    <StaffLayout>
      <PageHeader title="Settings" />

      <div className="space-y-6 max-w-xl">
        <div className="card p-5">
          <h2 className="font-serif text-lg font-semibold mb-4">Business Info</h2>
          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label className="label">PG Name</label>
              <input className="input" required value={name}
                onChange={(e) => setName(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>

        <div className="card p-5">
          <h2 className="font-serif text-lg font-semibold mb-4">Properties</h2>
          {properties.length === 0 ? (
            <p className="text-ink-soft text-sm mb-4">No properties yet.</p>
          ) : (
            <div className="space-y-3 mb-6">
              {properties.map((p) => (
                <div key={p.id} className="flex items-start justify-between py-2 border-b border-border last:border-0 gap-3">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    {p.address && <p className="text-xs text-ink-soft mt-0.5">{p.address}</p>}
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      className="btn-ghost text-sm shrink-0"
                      onClick={() => {
                        setEditingProperty(p);
                        setEditName(p.name);
                        setEditAddress(p.address ?? '');
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isOwner ? (
            <form onSubmit={handleCreateProperty} className="space-y-3">
              <h3 className="text-sm font-medium text-ink">Add Property</h3>
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  required
                  placeholder="e.g. Green Valley PG"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Address (optional)</label>
                <input
                  className="input"
                  placeholder="Street, area, city"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-secondary w-full" disabled={saving}>
                Add Property
              </button>
            </form>
          ) : (
            <p className="text-ink-soft text-sm">Only the organization owner can manage properties.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-serif text-lg font-semibold mb-2">Automations</h2>
          <p className="text-ink-soft text-sm mb-4">
            Rent reminders are emailed automatically on the 5th (due) and 10th (overdue) of each month
            to tenants with pending or partial dues. Use the button below to test without waiting for the cron job.
          </p>
          {isOwner ? (
            <div className="space-y-3">
              <div>
                <label className="label">Reminder type</label>
                <select
                  className="input"
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value as 'due' | 'overdue')}
                >
                  <option value="due">Due (friendly reminder)</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderForce}
                  onChange={(e) => setReminderForce(e.target.checked)}
                  className="rounded border-border"
                />
                Re-send even if already sent this month
              </label>
              <button
                type="button"
                className="btn-secondary w-full"
                disabled={reminderRunning}
                onClick={handleRunReminders}
              >
                {reminderRunning ? 'Sending…' : 'Send rent reminders now'}
              </button>
              <p className="text-xs text-ink-soft">
                Requires Resend configured. Tenants must have an email and unpaid/partial rent for the current month.
              </p>
            </div>
          ) : (
            <p className="text-ink-soft text-sm">Only the organization owner can trigger test reminders.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-serif text-lg font-semibold mb-4">Staff Accounts</h2>
          {loading ? (
            <p className="text-ink-soft text-sm">Loading…</p>
          ) : (
            <div className="space-y-3 mb-6">
              {staff.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.email}</p>
                    {s.is_owner && (
                      <span className="text-xs text-rose bg-rose-soft px-2 py-0.5 rounded-full">Owner</span>
                    )}
                  </div>
                  {!s.is_owner && isOwner && (
                    <button className="btn-ghost text-rose p-1" onClick={() => setRemoveStaff(s)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isOwner ? (
            <>
              <h3 className="text-sm font-medium text-ink mb-1">Invite Staff</h3>
              <p className="text-ink-soft text-xs mb-3">
                An invitation email is sent with the staff login link, email, and the
                temporary password you set below. New staff should sign in, then use{' '}
                <span className="text-ink">Forgot password</span> on the login page to choose their own password.
              </p>
              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" required placeholder="staff@example.com"
                    value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                </div>
                <div>
                  <label className="label">Temporary password</label>
                  <input className="input" type="password" required placeholder="Min. 6 characters" minLength={6}
                    value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} />
                </div>
                <button type="submit" className="btn-secondary w-full" disabled={saving}>
                  Send Invite
                </button>
              </form>
            </>
          ) : (
            <p className="text-ink-soft text-sm">Only the organization owner can invite or remove staff.</p>
          )}
        </div>

        {error && <p className="text-rose text-sm">{error}</p>}
        {success && <p className="text-sage text-sm">{success}</p>}
      </div>

      <ConfirmDialog
        open={!!removeStaff}
        onClose={() => setRemoveStaff(null)}
        onConfirm={handleRemoveStaff}
        title="Remove Staff"
        message={`Remove ${removeStaff?.email} from staff?`}
        confirmLabel="Remove"
        loading={saving}
      />

      <Modal open={!!editingProperty} onClose={() => setEditingProperty(null)} title="Edit Property">
        <form onSubmit={handleUpdateProperty} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Address (optional)</label>
            <input
              className="input"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
            />
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Save Property'}
          </button>
        </form>
      </Modal>
    </StaffLayout>
  );
}
