import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Skeleton } from '../../components/ui/skeleton';
import { ResilientImage } from '../../components/shared/ResilientImage';
import { formatCurrency } from '../../lib/utils';

export function AdminRoomsPage() {
  const queryClient = useQueryClient();

  const roomsQuery = useQuery({
    queryKey: ['admin', 'rooms'],
    queryFn: api.getAdminRooms,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.toggleRoomStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'rooms'] });
      toast.success('Room status updated.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'rooms'] });
      toast.success('Room category removed.');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Unable to delete room.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Room Management</h1>
          <p className="text-xs text-slate-500">
            Manage suite categories, nightly tariffs, unit counts, and website visibility.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/rooms/create" className="inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Add New Room</span>
          </Link>
        </Button>
      </div>

      {roomsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-medium">Room</th>
                  <th className="py-3 px-4 font-medium text-right">Rate / Night</th>
                  <th className="py-3 px-4 font-medium text-right">Max Guests</th>
                  <th className="py-3 px-4 font-medium text-right">Units</th>
                  <th className="py-3 px-4 font-medium">Featured</th>
                  <th className="py-3 px-4 font-medium">Active</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(roomsQuery.data || []).map((room) => (
                  <tr key={room._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 rounded overflow-hidden shrink-0 bg-slate-100">
                          <ResilientImage
                            src={room.images[0]?.url}
                            alt={room.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{room.name}</p>
                          <p className="text-slate-500 font-mono text-[11px]">/{room.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium">
                      {formatCurrency(room.pricePerNight)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{room.maxGuests}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{room.totalUnits}</td>
                    <td className="py-3 px-4">{room.isFeatured ? 'Yes' : 'No'}</td>
                    <td className="py-3 px-4">
                      <Switch
                        checked={room.isActive}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: room._id, isActive: checked })
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/rooms/${room._id}/edit`}>
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-700 hover:bg-red-50"
                          onClick={() => deleteMutation.mutate(room._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
