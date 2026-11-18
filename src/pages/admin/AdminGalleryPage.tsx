import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { SelectField } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ResilientImage } from '../../components/shared/ResilientImage';
import { GALLERY_CATEGORIES } from '../../../shared/constants/index.ts';
import type { GalleryItem } from '../../../shared/types/index.ts';

export function AdminGalleryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | undefined>();
  const [category, setCategory] = useState<GalleryItem['category']>('Resort');
  const [alt, setAlt] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);
  const [uploading, setUploading] = useState(false);

  const galleryQuery = useQuery({
    queryKey: ['admin', 'gallery'],
    queryFn: api.getAdminGallery,
  });

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setImageUrl('');
    setCloudinaryPublicId(undefined);
    setCategory('Resort');
    setAlt('');
    setIsFeatured(false);
    setIsPublished(true);
    setSortOrder((galleryQuery.data?.length || 0) + 1);
    setOpen(true);
  };

  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    setTitle(item.title);
    setImageUrl(item.imageUrl);
    setCloudinaryPublicId(item.cloudinaryPublicId);
    setCategory(item.category);
    setAlt(item.alt);
    setIsFeatured(item.isFeatured);
    setIsPublished(item.isPublished);
    setSortOrder(item.sortOrder);
    setOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadImage(file, 'cloud-valley/gallery');
      setImageUrl(res.url);
      setCloudinaryPublicId(res.publicId);
      if (!alt) setAlt(title || file.name.replace(/\.[^/.]+$/, ''));
      toast.success('Photo uploaded.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        imageUrl,
        cloudinaryPublicId,
        category,
        alt,
        isFeatured,
        isPublished,
        sortOrder: Number(sortOrder),
      };
      return editing
        ? api.updateGalleryItem(editing._id, payload)
        : api.createGalleryItem(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'gallery'] });
      toast.success(editing ? 'Gallery photo updated.' : 'Photo added to gallery.');
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Save failed.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteGalleryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'gallery'] });
      toast.success('Photo deleted.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Gallery Management</h1>
          <p className="text-xs text-slate-500">
            Upload resort photographs via Cloudinary or local storage and curate categories.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          <span>Add Photo</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(galleryQuery.data || []).map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="aspect-[4/3] bg-slate-100">
                <ResilientImage src={item.imageUrl} alt={item.alt} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-1">
                <p className="text-xs text-slate-500">
                  {item.category} · Order {item.sortOrder} · {item.isPublished ? 'Published' : 'Hidden'}
                </p>
                <h2 className="font-medium text-sm text-slate-900">{item.title}</h2>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
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
            <DialogTitle>{editing ? 'Edit Gallery Photo' : 'Add Gallery Photo'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Photo Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>Upload Image or Paste URL *</Label>
              <div className="flex gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 bg-white text-xs font-medium cursor-pointer hover:bg-slate-50 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... or /src/assets/..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <SelectField
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GalleryItem['category'])}
                >
                  {GALLERY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Accessible Alt Text *</Label>
              <Input value={alt} onChange={(e) => setAlt(e.target.value)} required />
            </div>

            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium">
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                <span>Featured</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium">
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                <span>Published</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save Photo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
