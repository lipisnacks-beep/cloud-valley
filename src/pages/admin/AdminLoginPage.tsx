import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, isLoading: authLoading, setAuthenticatedAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from || '/admin';

  if (!authLoading && admin) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const authenticated = await api.login(email.trim(), password);
      setAuthenticatedAdmin(authenticated);
      toast.success('Signed in to CLOUD VALLEY Admin.');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="Admin Sign In — CLOUD VALLEY Samalbong" />
      <div className="min-h-screen bg-[#18352B] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#F8F5EF] rounded-lg border border-white/15 p-7 sm:p-9 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-md bg-[#234638] text-[#C6A66B] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-[#18352B]">
              CLOUD VALLEY Admin Portal
            </h1>
            <p className="text-xs text-[#58636B]">
              Authorized resort staff sign-in for reservation, room, and content management.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Administrator Email</Label>
              <Input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cloudvalleysamalbong.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="pt-4 border-t border-[#18352B]/10 flex items-center justify-between text-xs text-[#58636B]">
            <Link to="/" className="hover:text-[#18352B] hover:underline">
              Return to Public Website
            </Link>
            <span>Samalbong Operations</span>
          </div>
        </div>
      </div>
    </>
  );
}
