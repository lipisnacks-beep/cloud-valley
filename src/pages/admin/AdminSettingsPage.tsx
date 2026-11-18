import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import type { SiteSettings } from '../../../shared/types/index.ts';

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ['public', 'settings'],
    queryFn: api.getSettings,
  });

  const [form, setForm] = useState<SiteSettings>({
    resortName: 'CLOUD VALLEY',
    tagline: 'Samalbong Mountain Retreat',
    logoText: 'CLOUD VALLEY',
    logoUrl: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    googleMapsEmbedUrl: '',
    googleMapsLink: '',
    instagramUrl: '',
    facebookUrl: '',
    checkInTime: '1:00 PM',
    checkOutTime: '11:00 AM',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    defaultBookingPolicy: '',
    seoTitle: '',
    seoDescription: '',
    emailNotificationsEnabled: true,
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => api.updateSettings(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public', 'settings'] });
      toast.success('Website settings saved.');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Save failed.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900">Website Settings</h1>
        <p className="text-xs text-slate-500">
          Configure resort contact details, WhatsApp number, check-in timings, map URLs, and SEO metadata.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Resort Name</Label>
            <Input
              value={form.resortName}
              onChange={(e) => setForm({ ...form, resortName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Navbar Logo Wordmark</Label>
            <Input
              value={form.logoText}
              onChange={(e) => setForm({ ...form, logoText: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tagline</Label>
            <Input
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Primary Mobile / Reservations Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp Number (with country code)</Label>
            <Input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hosts</Label>
            <Input
              value={form.hosts || ''}
              onChange={(e) => setForm({ ...form, hosts: e.target.value })}
              placeholder="Joy Banerjee & Prasanta Das"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Additional Helpline Numbers (comma-separated)</Label>
            <Input
              value={(form.secondaryPhones || []).join(', ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  secondaryPhones: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="+91 97325 69816, +91 98045 84639, +91 82502 19594"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reservations Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Resort Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Check-in Time</Label>
            <Input
              value={form.checkInTime}
              onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Check-out Time</Label>
            <Input
              value={form.checkOutTime}
              onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Google Maps Embed URL</Label>
            <Input
              value={form.googleMapsEmbedUrl}
              onChange={(e) => setForm({ ...form, googleMapsEmbedUrl: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Google Maps Share Link</Label>
            <Input
              value={form.googleMapsLink}
              onChange={(e) => setForm({ ...form, googleMapsLink: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Instagram URL</Label>
            <Input
              value={form.instagramUrl || ''}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Facebook URL</Label>
            <Input
              value={form.facebookUrl || ''}
              onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Default Booking Policy Note</Label>
            <Textarea
              value={form.defaultBookingPolicy}
              onChange={(e) => setForm({ ...form, defaultBookingPolicy: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Default SEO Title</Label>
            <Input
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Default SEO Description</Label>
            <Textarea
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              required
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-xs font-medium pt-2">
          <Switch
            checked={form.emailNotificationsEnabled}
            onCheckedChange={(checked) =>
              setForm({ ...form, emailNotificationsEnabled: checked })
            }
          />
          <span>Enable SMTP Booking Email Notifications (when SMTP env vars are configured)</span>
        </label>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </form>
  );
}
