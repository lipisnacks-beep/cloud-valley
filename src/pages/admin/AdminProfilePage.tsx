import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export function AdminProfilePage() {
  const { admin, refetchAdmin } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (admin) {
      setName(admin.name);
      setEmail(admin.email);
    }
  }, [admin]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateProfile({
        name,
        email,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      }),
    onSuccess: async () => {
      await refetchAdmin();
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Admin profile updated.');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Update failed.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900">Admin Profile</h1>
        <p className="text-xs text-slate-500">
          Update administrator display details or rotate your sign-in password.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Full Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Email Address</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h2 className="text-xs font-semibold text-slate-900">Change Password (Optional)</h2>
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>New Password (min 8 characters)</Label>
            <Input
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Update Profile'}
          </Button>
        </div>
      </div>
    </form>
  );
}
