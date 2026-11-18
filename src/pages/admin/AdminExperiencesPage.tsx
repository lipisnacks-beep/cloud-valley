import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { SelectField } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ResilientImage } from '../../components/shared/ResilientImage';
import { DEFAULT_IMAGES, EXPERIENCE_CATEGORIES } from '../../../shared/constants/index.ts';
import type { Experience } from '../../../shared/types/index.ts';

export function AdminExperiencesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<Experience['category']>('Nature Walk');
  const [location, setLocation] = useState('Samalbong Hills');
  const [duration, setDuration] = useState('2 hours');
  const [bestTime, setBestTime] = useState('Morning');
  const [distance, setDistance] = useState('On-property');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGES.trail);
  const [isPublished, setIsPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);

  const expQuery = useQuery({
    queryKey: ['admin', 'experiences'],
    queryFn: api.getAdminExperiences,
  });

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setSlug('');
    setCategory('Nature Walk');
    setLocation('Samalbong');
    setDuration('2 hours');
    setBestTime('Morning');
    setDistance('On-property');
    setDescription('');
    setImageUrl(DEFAULT_IMAGES.trail);
    setIsPublished(true);
    setSortOrder((expQuery.data?.length || 0) + 1);
    setOpen(true);
  };

  const openEdit = (item: Experience) => {
    setEditing(item);
    setTitle(item.title);
    setSlug(item.slug);
    setCategory(item.category);
    setLocation(item.location);
    setDuration(item.duration || '');
    setBestTime(item.bestTime || '');
    setDistance(item.distance || '');
    setDescription(item.description);
    setImageUrl(item.images[0]?.url || DEFAULT_IMAGES.trail);
    setIsPublished(item.isPublished);
    setSortOrder(item.sortOrder);
    setOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadImage(file, 'cloud-valley/experiences');
      setImageUrl(res.url);
      toast.success('Image uploaded.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed.');
    }
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        slug:
          slug ||
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
        category,
        location,
        duration,
        bestTime,
        distance,
        description,
        images: [{ url: imageUrl, alt: title }],
        isPublished,
        sortOrder: Number(sortOrder),
      };
      return editing
        ? api.updateExperience(editing._id, payload)
        : api.createExperience(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'experiences'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'experiences'] });
      toast.success(editing ? 'Experience updated.' : 'Experience added.');
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Could not save experience.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'experiences'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'experiences'] });
      toast.success('Experience deleted.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            Experiences Management
          </h1>
          <p className="text-xs text-slate-500">
            Manage guided trails, tea walks, and local Kalimpong sightseeing experiences.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          <span>Add Experience</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(expQuery.data || []).map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-between"
          >
            <div className="flex gap-4 p-4">
              <div className="h-24 w-28 rounded overflow-hidden shrink-0 bg-slate-100">
                <ResilientImage
                  src={item.images[0]?.url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-slate-500">
                  {item.category} · {item.location} · {item.isPublished ? 'Published' : 'Draft'}
                </p>
                <h2 className="font-medium text-sm text-slate-900">{item.title}</h2>
                <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-slate-100 flex justify-between">
              <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-700 hover:bg-red-50"
                onClick={() => deleteMutation.mutate(item._id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editing) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, '')
                      );
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug *</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <SelectField
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Experience['category'])}
                >
                  {EXPERIENCE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="space-y-1.5">
                <Label>Location *</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Input value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Best Time</Label>
                <Input value={bestTime} onChange={(e) => setBestTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Distance</Label>
                <Input value={distance} onChange={(e) => setDistance(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <div className="flex gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 bg-white text-xs font-medium cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <span>Published</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
