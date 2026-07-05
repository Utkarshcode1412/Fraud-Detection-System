import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('analyst@frauddetect.dev');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
            </svg>
          </div>
          <span className="font-display font-semibold text-xl">Sentry</span>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-xl p-6 shadow-card">
          <h1 className="font-display font-semibold text-lg mb-1">Analyst sign in</h1>
          <p className="text-sm text-ink-muted mb-6">Fraud detection console access</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-ink-muted mb-1.5 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:border-brand outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1.5 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin123!"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:border-brand outline-none"
              />
            </div>

            {error && <p className="text-signal-critical text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dim transition-colors text-white text-sm font-medium rounded-lg py-2.5 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-faint mt-4 font-mono">
          demo: analyst@frauddetect.dev / Admin123!
        </p>
      </div>
    </div>
  );
}
