import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { usePublicData } from '../../context/SettingsContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export function CustomerRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = usePublicData();
  const { customer, isLoading: authLoading, setAuthenticatedCustomer } = useCustomerAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fromState = (location.state as { from?: string } | null)?.from;
  const redirectTo = fromState || '/account';

  if (!authLoading && customer) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const created = await api.customerRegister({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      setAuthenticatedCustomer(created);
      toast.success(`Welcome to ${settings.resortName}, ${created.name}.`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title={`Create Guest Account — ${settings.resortName} Samalbong`}
        description="Register a CLOUD VALLEY guest account to submit room reservation requests and manage your stays."
        canonicalPath="/register"
      />

      <section className="py-16 sm:py-24 bg-[#F8F5EF]">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-lg border border-[#18352B]/12 p-7 sm:p-9 space-y-6">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-md bg-[#234638]/10 text-[#234638] flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                Guest Registration
              </p>
              <h1 className="font-display text-3xl font-medium text-[#18352B]">
                Create Your Account
              </h1>
              <p className="text-sm text-[#58636B]">
                Create an account to request suites at Samalbong and track your booking status anytime.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Full Name *</Label>
                <Input
                  id="reg-name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Ananya Chatterjee"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email Address *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Phone / WhatsApp Number *</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password * (min 8 characters)</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
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

              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm">Confirm Password *</Label>
                <Input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="pt-5 border-t border-[#18352B]/10 text-center">
              <p className="text-xs text-[#58636B]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  state={fromState ? { from: fromState } : undefined}
                  className="font-semibold text-[#234638] hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
