import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isApiConfigured, type OrgChoice } from '../../lib/api';

export default function StaffLogin() {
  const { signInStaff, isStaff } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgChoices, setOrgChoices] = useState<OrgChoice[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err, orgChoices: choices } = await signInStaff(
      email,
      password,
      selectedOrgId || undefined
    );
    setLoading(false);
    if (choices?.length) {
      setOrgChoices(choices);
      setSelectedOrgId(choices[0].organization_id);
      setError(err ?? 'Select your organization to continue.');
      return;
    }
    setOrgChoices([]);
    if (err) setError(err);
  }

  if (isStaff) return <Navigate to="/" replace />;

  if (!isApiConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <h1 className="font-serif text-2xl font-semibold text-rose mb-2">Nivas</h1>
          <p className="text-ink-soft text-sm mb-4">
            API URL is not configured. Copy <code className="text-xs bg-cream px-1 rounded">.env.example</code> to{' '}
            <code className="text-xs bg-cream px-1 rounded">.env</code> and set{' '}
            <code className="text-xs bg-cream px-1 rounded">VITE_API_URL</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-rose">Nivas</h1>
          <p className="text-ink-soft text-sm mt-1">Staff Portal</p>
          <p className="text-ink-soft text-xs mt-3 max-w-sm mx-auto">
            Invited by email? Sign in with your email and temporary password.
            Then use Forgot password to set a new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {orgChoices.length > 0 && (
            <div>
              <label className="label">Organization</label>
              <select
                className="input"
                required
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
              >
                {orgChoices.map((org) => (
                  <option key={org.organization_id} value={org.organization_id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait…' : orgChoices.length > 0 ? 'Continue' : 'Sign In'}
          </button>
          <p className="text-center">
            <Link to="/forgot-password" className="text-sm text-ink-soft hover:text-rose">
              Forgot password?
            </Link>
          </p>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <Link to="/tenant/login" className="text-sm text-ink-soft hover:text-rose">
            Tenant? Sign in with email →
          </Link>
        </div>
      </div>
    </div>
  );
}
