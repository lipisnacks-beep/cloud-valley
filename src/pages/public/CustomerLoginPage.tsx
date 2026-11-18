import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { usePublicData } from '../../context/SettingsContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = usePublicData();
  const { customer, isLoading: authLoading, setAuthenticatedCustomer } = useCustomerAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fromState = (location.state as { from?: string } | null)?.from;
  const redirectTo = fromState || '/account';
  const redirectedForBooking = Boolean(fromState && fromState.startsWith('/booking'));

  if (!authLoading && customer) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const authenticated = await api.customerLogin(email.trim(), password);
      setAuthenticatedCustomer(authenticated);
      toast.success(`Welcome back, ${authenticated.name}.`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title={`Guest Sign In — ${settings.resortName} Samalbong`}
        description="Sign in to your CLOUD VALLEY guest account to request a stay and manage your reservations."
        canonicalPath="/login"
      />

      <section className="py-16 sm:py-24 bg-[#F8F5EF]">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-lg border border-[#18352B]/12 p-7 sm:p-9 space-y-6">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-md bg-[#234638]/10 text-[#234638] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                Guest Portal
              </p>
              <h1 className="font-display text-3xl font-medium text-[#18352B]">
                Sign In to Your Account
              </h1>
              <p className="text-sm text-[#58636B]">
                {redirectedForBooking
                  ? 'Please sign in or create a guest account to complete your stay request.'
                  : 'Access your reservations, check confirmation updates, and manage your stays at Samalbong.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="customer-email">Email Address</Label>
                <Input
                  id="customer-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customer-password">Password</Label>
                <div className="relative">
                  <Input
                    id="customer-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#58636B] hover:text-[#18352B] p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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

            <div className="pt-5 border-t border-[#18352B]/10 space-y-3 text-center">
              <p className="text-xs text-[#58636B]">
                New to {settings.resortName}?{' '}
                <Link
                  to="/register"
                  state={fromState ? { from: fromState } : undefined}
                  className="font-semibold text-[#234638] hover:underline"
                >
                  Create a guest account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
