import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../lib/api';
import { ORG_ID_KEY } from '../../lib/api';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export default function ForgotPassword() {
  const [organizationId, setOrganizationId] = useState(
    () => localStorage.getItem(ORG_ID_KEY) || DEFAULT_ORG_ID
  );
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authApi.staffForgotPassword(organizationId.trim(), email.trim());
      setSuccess('If an account exists for that email, a reset link has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-rose">Nivas</h1>
          <p className="text-ink-soft text-sm mt-1">Reset your password</p>
          <p className="text-ink-soft text-xs mt-3 max-w-sm mx-auto">
            Enter the same organization ID and email you use to sign in. We will email you a link to
            set a new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Organization ID</label>
            <input
              className="input font-mono text-sm"
              type="text"
              required
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000001"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          {success && <p className="text-sage text-sm">{success}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait…' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <Link to="/login" className="text-sm text-ink-soft hover:text-rose">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
