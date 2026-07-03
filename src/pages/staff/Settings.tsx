import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { staffApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { StaffLayout } from '../../components/Layout';
import { ConfirmDialog } from '../../components/Modal';
import { PageHeader } from '../../components/ui';
import type { StaffProfile } from '../../types/database';

export default function Settings() {
  const { staffUser } = useAuth();
  const { pgName, updatePgName } = useBusiness();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [name, setName] = useState(pgName);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
        `Invitation email sent to ${inviteEmail.trim()}. They will receive the login link, organization ID, and temporary password. After first sign-in, they should use Forgot password to set their own password.`
      );
      setInviteEmail('');
      setInvitePassword('');
      loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite staff');
    }
    setSaving(false);
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
                  {!s.is_owner && (
                    <button className="btn-ghost text-rose p-1" onClick={() => setRemoveStaff(s)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <h3 className="text-sm font-medium text-ink mb-1">Invite Staff</h3>
          <p className="text-ink-soft text-xs mb-3">
            An invitation email is sent with the staff login link, organization ID, email, and the
            temporary password you set below. New staff should sign in, then use{' '}
            <span className="text-ink">Forgot password</span> on the login page to choose their own password.
          </p>
          {staffUser?.organization_id && (
            <div className="mb-3">
              <label className="label">Organization ID (included in invite email)</label>
              <input
                className="input font-mono text-sm"
                type="text"
                readOnly
                value={staffUser.organization_id}
              />
            </div>
          )}
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
    </StaffLayout>
  );
}
