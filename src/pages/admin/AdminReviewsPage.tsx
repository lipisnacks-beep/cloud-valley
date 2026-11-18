import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import type { Review } from '../../../shared/types/index.ts';

export function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestLocation, setGuestLocation] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sourceLabel, setSourceLabel] = useState('Direct Guest Stay');
  const [stayDate, setStayDate] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  const reviewsQuery = useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: api.getAdminReviews,
  });

  const openCreate = () => {
    setEditing(null);
    setGuestName('');
    setGuestLocation('');
    setRating(5);
    setComment('');
    setSourceLabel('Direct Guest Stay');
    setStayDate('November 2026');
    setIsFeatured(true);
    setIsPublished(true);
    setOpen(true);
  };

  const openEdit = (r: Review) => {
    setEditing(r);
    setGuestName(r.guestName);
    setGuestLocation(r.guestLocation || '');
    setRating(r.rating);
    setComment(r.comment);
    setSourceLabel(r.sourceLabel || '');
    setStayDate(r.stayDate || '');
    setIsFeatured(r.isFeatured);
    setIsPublished(r.isPublished);
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        guestName,
        guestLocation,
        rating: Number(rating),
        comment,
        sourceLabel,
        stayDate,
        isFeatured,
        isPublished,
      };
      return editing ? api.updateReview(editing._id, payload) : api.createReview(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'reviews'] });
      toast.success('Review saved.');
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Save failed.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'reviews'] });
      toast.success('Review deleted.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Review Management</h1>
          <p className="text-xs text-slate-500">
            Curate verified guest testimonials displayed on the CLOUD VALLEY website.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          <span>Add Review</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(reviewsQuery.data || []).map((rev) => (
          <div
            key={rev._id}
            className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5 text-[#C6A66B]">
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">
                  {rev.isPublished ? 'Published' : 'Hidden'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">“{rev.comment}”</p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-semibold text-slate-900">{rev.guestName}</p>
                <p className="text-slate-500">{rev.guestLocation || rev.stayDate}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(rev)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700"
                  onClick={() => deleteMutation.mutate(rev._id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Review' : 'Add Guest Review'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Guest Name *</Label>
                <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>City / Location</Label>
                <Input value={guestLocation} onChange={(e) => setGuestLocation(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Rating (1–5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Stay Date</Label>
                <Input value={stayDate} onChange={(e) => setStayDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Source Label</Label>
              <Input value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Review Quote *</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} required />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-xs font-medium">
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                <span>Featured on Home</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium">
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                <span>Published</span>
              </label>
            </div>
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
