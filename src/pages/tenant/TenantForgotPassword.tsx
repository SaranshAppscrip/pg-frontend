import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, orgChoicesFromError, type OrgChoice } from '../../lib/api';

export default function TenantForgotPassword() {
  const [email, setEmail] = useState('');
  const [orgChoices, setOrgChoices] = useState<OrgChoice[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authApi.tenantForgotPassword(email.trim(), selectedOrgId || undefined);
      setSuccess('If an account exists for that email, a reset link has been sent.');
      setOrgChoices([]);
    } catch (err) {
      const choices = orgChoicesFromError(err);
      if (choices?.length) {
        setOrgChoices(choices);
        setSelectedOrgId(choices[0].organization_id);
        setError(err instanceof Error ? err.message : 'Select your organization to continue.');
      } else {
        setError(err instanceof Error ? err.message : 'Request failed');
      }
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
            Enter the email you use to sign in to the tenant portal.
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
            {loading ? 'Please wait…' : orgChoices.length > 0 ? 'Continue' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <Link to="/tenant/login" className="text-sm text-ink-soft hover:text-rose">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
