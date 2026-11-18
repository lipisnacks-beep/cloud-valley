import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { SelectField } from '../../components/ui/select';
import { FAQ_CATEGORIES } from '../../../shared/constants/index.ts';
import type { FAQ, HomeCMSContent } from '../../../shared/types/index.ts';

export function AdminContentPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'home' | 'policies' | 'faqs'>('home');
  const [policySlug, setPolicySlug] = useState('privacy-policy');

  const contentQuery = useQuery({
    queryKey: ['admin', 'content'],
    queryFn: api.getAdminContent,
  });

  const faqsQuery = useQuery({
    queryKey: ['admin', 'faqs'],
    queryFn: api.getAdminFAQs,
  });

  const [homeForm, setHomeForm] = useState<HomeCMSContent>({
    heroHeadline: '',
    heroSubtitle: '',
    heroImageUrl: '',
    welcomeTitle: '',
    welcomeBody: '',
    welcomeImageUrl: '',
    experienceTitle: '',
    experienceSubtitle: '',
    diningTitle: '',
    diningSubtitle: '',
    diningImageUrl: '',
    ctaTitle: '',
    ctaSubtitle: '',
    aboutStoryTitle: '',
    aboutStoryBody: '',
    aboutPhilosophy: '',
  });

  const [policyTitle, setPolicyTitle] = useState('');
  const [policySubtitle, setPolicySubtitle] = useState('');
  const [policyBody, setPolicyBody] = useState('');

  // New FAQ
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState<FAQ['category']>('Booking');

  useEffect(() => {
    const pages = contentQuery.data || [];
    const home = pages.find((p) => p.slug === 'home');
    if (home?.sections) {
      setHomeForm((prev) => ({ ...prev, ...(home.sections as Partial<HomeCMSContent>) }));
    }
    const pol = pages.find((p) => p.slug === policySlug);
    if (pol) {
      setPolicyTitle(pol.title);
      setPolicySubtitle(pol.subtitle || '');
      setPolicyBody(pol.body);
    }
  }, [contentQuery.data, policySlug]);

  const saveHomeMutation = useMutation({
    mutationFn: () =>
      api.updateContent({
        slug: 'home',
        title: 'CLOUD VALLEY — Samalbong',
        body: homeForm.welcomeBody,
        sections: homeForm as unknown as Record<string, string>,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'home-content'] });
      toast.success('Homepage & About content updated.');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Save failed.'),
  });

  const savePolicyMutation = useMutation({
    mutationFn: () =>
      api.updateContent({
        slug: policySlug,
        title: policyTitle,
        subtitle: policySubtitle,
        body: policyBody,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'page', policySlug] });
      toast.success('Policy page updated.');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Save failed.'),
  });

  const createFaqMutation = useMutation({
    mutationFn: () =>
      api.createFAQ({
        question: faqQuestion,
        answer: faqAnswer,
        category: faqCategory,
        isPublished: true,
        sortOrder: (faqsQuery.data?.length || 0) + 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'faqs'] });
      setFaqQuestion('');
      setFaqAnswer('');
      toast.success('FAQ added.');
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: api.deleteFAQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'faqs'] });
      toast.success('FAQ removed.');
    },
  });

  const handleImageUpload = async (
    field: 'heroImageUrl' | 'welcomeImageUrl' | 'diningImageUrl',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadImage(file, 'cloud-valley/cms');
      setHomeForm((prev) => ({ ...prev, [field]: res.url }));
      toast.success('Image uploaded.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            Homepage & Website Content
          </h1>
          <p className="text-xs text-slate-500">
            Edit homepage copy, hero photography, About story, legal policies, and FAQs.
          </p>
        </div>

        <div className="inline-flex p-1 bg-white rounded-md border border-slate-200">
          {[
            { id: 'home', label: 'Homepage & About' },
            { id: 'policies', label: 'Policy Pages' },
            { id: 'faqs', label: 'FAQs' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                tab === t.id ? 'bg-[#234638] text-white' : 'text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'home' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveHomeMutation.mutate();
          }}
          className="bg-white rounded-lg border border-slate-200 p-6 space-y-6"
        >
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Hero Section
            </h2>
            <div className="space-y-1.5">
              <Label>Hero Headline</Label>
              <Input
                value={homeForm.heroHeadline}
                onChange={(e) => setHomeForm({ ...homeForm, heroHeadline: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hero Subtitle</Label>
              <Textarea
                value={homeForm.heroSubtitle}
                onChange={(e) => setHomeForm({ ...homeForm, heroSubtitle: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hero Background Image</Label>
              <div className="flex gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 text-xs font-medium cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload('heroImageUrl', e)}
                  />
                </label>
                <Input
                  value={homeForm.heroImageUrl}
                  onChange={(e) => setHomeForm({ ...homeForm, heroImageUrl: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Welcome & About Story
            </h2>
            <div className="space-y-1.5">
              <Label>Welcome Title</Label>
              <Input
                value={homeForm.welcomeTitle}
                onChange={(e) => setHomeForm({ ...homeForm, welcomeTitle: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Welcome Paragraph</Label>
              <Textarea
                value={homeForm.welcomeBody}
                onChange={(e) => setHomeForm({ ...homeForm, welcomeBody: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>About Page Headline</Label>
              <Input
                value={homeForm.aboutStoryTitle}
                onChange={(e) => setHomeForm({ ...homeForm, aboutStoryTitle: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>About Story Body</Label>
              <Textarea
                value={homeForm.aboutStoryBody}
                onChange={(e) => setHomeForm({ ...homeForm, aboutStoryBody: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hospitality Philosophy</Label>
              <Textarea
                value={homeForm.aboutPhilosophy}
                onChange={(e) => setHomeForm({ ...homeForm, aboutPhilosophy: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Dining, Experiences & CTA
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Experience Section Heading</Label>
                <Input
                  value={homeForm.experienceTitle}
                  onChange={(e) => setHomeForm({ ...homeForm, experienceTitle: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Dining Section Heading</Label>
                <Input
                  value={homeForm.diningTitle}
                  onChange={(e) => setHomeForm({ ...homeForm, diningTitle: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Final CTA Title</Label>
                <Input
                  value={homeForm.ctaTitle}
                  onChange={(e) => setHomeForm({ ...homeForm, ctaTitle: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Final CTA Subtitle</Label>
                <Input
                  value={homeForm.ctaSubtitle}
                  onChange={(e) => setHomeForm({ ...homeForm, ctaSubtitle: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saveHomeMutation.isPending}>
              {saveHomeMutation.isPending ? 'Saving...' : 'Save Homepage & About'}
            </Button>
          </div>
        </form>
      )}

      {tab === 'policies' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            savePolicyMutation.mutate();
          }}
          className="bg-white rounded-lg border border-slate-200 p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Select Policy Document</Label>
            <SelectField value={policySlug} onChange={(e) => setPolicySlug(e.target.value)}>
              <option value="privacy-policy">Privacy Policy</option>
              <option value="terms">Terms & Conditions</option>
              <option value="cancellation-policy">Cancellation Policy</option>
            </SelectField>
          </div>
          <div className="space-y-1.5">
            <Label>Page Title</Label>
            <Input value={policyTitle} onChange={(e) => setPolicyTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Subtitle</Label>
            <Input value={policySubtitle} onChange={(e) => setPolicySubtitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Policy Body</Label>
            <Textarea
              rows={12}
              value={policyBody}
              onChange={(e) => setPolicyBody(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={savePolicyMutation.isPending}>
              Save Policy
            </Button>
          </div>
        </form>
      )}

      {tab === 'faqs' && (
        <div className="space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createFaqMutation.mutate();
            }}
            className="bg-white rounded-lg border border-slate-200 p-5 space-y-4"
          >
            <h2 className="text-sm font-semibold text-slate-900">Add New FAQ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Question *</Label>
                <Input
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <SelectField
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value as FAQ['category'])}
                >
                  {FAQ_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Answer *</Label>
              <Textarea
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={createFaqMutation.isPending}>
              <Plus className="w-4 h-4" />
              <span>Add FAQ</span>
            </Button>
          </form>

          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
            {(faqsQuery.data || []).map((faq) => (
              <div key={faq._id} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500">{faq.category}</span>
                  <p className="text-sm font-medium text-slate-900">{faq.question}</p>
                  <p className="text-xs text-slate-600">{faq.answer}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700"
                  onClick={() => deleteFaqMutation.mutate(faq._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
