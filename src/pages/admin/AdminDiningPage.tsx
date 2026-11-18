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
import { DEFAULT_IMAGES, DINING_CATEGORIES } from '../../../shared/constants/index.ts';
import type { DiningItem } from '../../../shared/types/index.ts';

export function AdminDiningPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DiningItem | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DiningItem['category']>('Local Specialty');
  const [timing, setTiming] = useState('');
  const [dietaryNote, setDietaryNote] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGES.dining);
  const [isPublished, setIsPublished] = useState(true);

  const diningQuery = useQuery({
    queryKey: ['admin', 'dining'],
    queryFn: api.getAdminDining,
  });

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setCategory('Local Specialty');
    setTiming('7:30 PM – 9:30 PM');
    setDietaryNote('Vegetarian & local organic produce');
    setDescription('');
    setImageUrl(DEFAULT_IMAGES.dining);
    setIsPublished(true);
    setOpen(true);
  };

  const openEdit = (item: DiningItem) => {
    setEditing(item);
    setTitle(item.title);
    setCategory(item.category);
    setTiming(item.timing || '');
    setDietaryNote(item.dietaryNote || '');
    setDescription(item.description);
    setImageUrl(item.imageUrl);
    setIsPublished(item.isPublished);
    setOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadImage(file, 'cloud-valley/dining');
      setImageUrl(res.url);
      toast.success('Photo uploaded.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed.');
    }
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        category,
        timing,
        dietaryNote,
        description,
        imageUrl,
        alt: title,
        isPublished,
      };
      return editing
        ? api.updateDiningItem(editing._id, payload)
        : api.createDiningItem(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dining'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'dining'] });
      toast.success('Dining offering saved.');
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Save failed.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteDiningItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dining'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'dining'] });
      toast.success('Dining item deleted.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            Dining Content Management
          </h1>
          <p className="text-xs text-slate-500">
            Manage meal schedules, local Kalimpong specialties, and dining imagery.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          <span>Add Dining Item</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(diningQuery.data || []).map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="aspect-[4/3] bg-slate-100">
                <ResilientImage src={item.imageUrl} alt={item.alt} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-1.5">
                <p className="text-xs text-slate-500">
                  {item.category} {item.timing ? `· ${item.timing}` : ''}
                </p>
                <h2 className="font-medium text-sm text-slate-900">{item.title}</h2>
                <p className="text-xs text-slate-600 line-clamp-3">{item.description}</p>
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
            <DialogTitle>{editing ? 'Edit Dining Offering' : 'Add Dining Offering'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Meal Category</Label>
                <SelectField
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DiningItem['category'])}
                >
                  {DINING_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="space-y-1.5">
                <Label>Serving Hours</Label>
                <Input value={timing} onChange={(e) => setTiming(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Dietary Note</Label>
              <Input value={dietaryNote} onChange={(e) => setDietaryNote(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL *</Label>
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
            <div className="flex justify-end gap-2">
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
