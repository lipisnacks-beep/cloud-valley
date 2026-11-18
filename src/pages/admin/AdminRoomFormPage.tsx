import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { ResilientImage } from '../../components/shared/ResilientImage';
import type { MediaImage } from '../../../shared/types/index.ts';

export function AdminRoomFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const roomsQuery = useQuery({
    queryKey: ['admin', 'rooms'],
    queryFn: api.getAdminRooms,
    enabled: isEdit,
  });

  const existing = (roomsQuery.data || []).find((r) => r._id === id);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerNight, setPricePerNight] = useState(5500);
  const [maxGuests, setMaxGuests] = useState(2);
  const [totalUnits, setTotalUnits] = useState(2);
  const [bedType, setBedType] = useState('King Bed');
  const [roomSize, setRoomSize] = useState('450 sq ft');
  const [viewType, setViewType] = useState('Valley & Pine Hills');
  const [amenitiesText, setAmenitiesText] = useState(
    'Private Deck, Heated Bedding, Mountain Breakfast, Wi-Fi'
  );
  const [images, setImages] = useState<MediaImage[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setSlug(existing.slug);
      setShortDescription(existing.shortDescription);
      setDescription(existing.description);
      setPricePerNight(existing.pricePerNight);
      setMaxGuests(existing.maxGuests);
      setTotalUnits(existing.totalUnits);
      setBedType(existing.bedType || '');
      setRoomSize(existing.roomSize || '');
      setViewType(existing.viewType || '');
      setAmenitiesText(existing.amenities.join(', '));
      setImages(existing.images || []);
      setIsFeatured(existing.isFeatured);
      setIsActive(existing.isActive);
      setSortOrder(existing.sortOrder);
    }
  }, [existing]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploadImage(file, 'cloud-valley/rooms');
      setImages((prev) => [...prev, { url: uploaded.url, publicId: uploaded.publicId, alt: name || 'Room photo' }]);
      toast.success('Image uploaded.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        slug,
        shortDescription,
        description,
        pricePerNight: Number(pricePerNight),
        maxGuests: Number(maxGuests),
        totalUnits: Number(totalUnits),
        bedType,
        roomSize,
        viewType,
        amenities: amenitiesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        images,
        isFeatured,
        isActive,
        sortOrder: Number(sortOrder),
      };
      return isEdit ? api.updateRoom(id!, payload) : api.createRoom(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'rooms'] });
      toast.success(isEdit ? 'Room updated.' : 'Room category created.');
      navigate('/admin/rooms');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save room.');
    },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to="/admin/rooms"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Rooms</span>
      </Link>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 space-y-6"
      >
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          {isEdit ? `Edit Room: ${existing?.name || ''}` : 'Create New Room Category'}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Room Name *</Label>
            <Input value={name} onChange={(e) => handleNameChange(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>URL Slug *</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Price Per Night (INR) *</Label>
            <Input
              type="number"
              min={0}
              value={pricePerNight}
              onChange={(e) => setPricePerNight(Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Total Units *</Label>
            <Input
              type="number"
              min={1}
              value={totalUnits}
              onChange={(e) => setTotalUnits(Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Max Guests *</Label>
            <Input
              type="number"
              min={1}
              value={maxGuests}
              onChange={(e) => setMaxGuests(Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Display Order</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Bed Type</Label>
            <Input value={bedType} onChange={(e) => setBedType(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Room Size</Label>
            <Input value={roomSize} onChange={(e) => setRoomSize(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>View Type</Label>
            <Input value={viewType} onChange={(e) => setViewType(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Short Summary *</Label>
            <Input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Full Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Amenities (comma-separated)</Label>
            <Input value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} />
          </div>
        </div>

        {/* Images */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <Label>Room Photographs</Label>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 bg-slate-50 text-xs font-medium cursor-pointer hover:bg-slate-100">
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
            <div className="flex gap-2 flex-1 min-w-[220px]">
              <Input
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                placeholder="Or paste image URL..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (manualImageUrl.trim()) {
                    setImages((prev) => [
                      ...prev,
                      { url: manualImageUrl.trim(), alt: name || 'Room photo' },
                    ]);
                    setManualImageUrl('');
                  }
                }}
              >
                Add URL
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-[4/3] rounded overflow-hidden border border-slate-200">
                <ResilientImage src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="Remove image"
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2.5 text-xs font-medium">
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            <span>Featured on Homepage</span>
          </label>
          <label className="flex items-center gap-2.5 text-xs font-medium">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span>Active on Public Website</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/rooms')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : isEdit ? 'Update Room' : 'Create Room'}
          </Button>
        </div>
      </form>
    </div>
  );
}
