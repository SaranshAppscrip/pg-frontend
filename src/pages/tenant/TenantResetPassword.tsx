import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../lib/api';

export default function TenantResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Reset link is invalid or missing.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.tenantResetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
    setLoading(false);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <p className="text-rose text-sm mb-4">This reset link is invalid or has expired.</p>
          <Link to="/tenant/forgot-password" className="text-sm text-ink-soft hover:text-rose">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <p className="text-sage text-sm mb-4">Your password has been updated.</p>
          <Link to="/tenant/login" className="btn-primary inline-block">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-rose">Nivas</h1>
          <p className="text-ink-soft text-sm mt-1">Choose a new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New password</label>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait…' : 'Update password'}
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
