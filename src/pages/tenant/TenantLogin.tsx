import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isApiConfigured, ORG_ID_KEY } from '../../lib/api';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export default function TenantLogin() {
  const { signInTenant, tenantToken } = useAuth();
  const [organizationId, setOrganizationId] = useState(
    () => localStorage.getItem(ORG_ID_KEY) || DEFAULT_ORG_ID
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (tenantToken) return <Navigate to="/tenant" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await signInTenant(organizationId.trim(), email, password);
    setLoading(false);
    if (err) setError(err);
  }

  if (!isApiConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <h1 className="font-serif text-2xl font-semibold text-rose mb-2">Nivas</h1>
          <p className="text-ink-soft text-sm">API URL is not configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-rose">Nivas</h1>
          <p className="text-ink-soft text-sm mt-1">Tenant Portal</p>
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
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <Link to="/login" className="text-sm text-ink-soft hover:text-rose">
            ← Staff login
          </Link>
        </div>
      </div>
    </div>
  );
}
