import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { SelectField } from '../../components/ui/select';
import { MESSAGE_STATUSES } from '../../../shared/constants/index.ts';
import { formatDateShort } from '../../lib/utils';
import type { MessageStatus } from '../../../shared/types/index.ts';

export function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');

  const messagesQuery = useQuery({
    queryKey: ['admin', 'messages', { status, search }],
    queryFn: () =>
      api.getAdminMessages({
        status: status === 'All' ? undefined : status,
        search: search || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status: next }: { id: string; status: MessageStatus }) =>
      api.updateMessageStatus(id, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast.success('Message status updated.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
      toast.success('Message deleted.');
    },
  });

  const messages = messagesQuery.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900">Contact Messages</h1>
        <p className="text-xs text-slate-500">
          Review, mark replied, archive, or delete guest inquiries from the contact desk.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by guest name, email, phone, or subject..."
            className="pl-9"
          />
        </div>
        <SelectField
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-48"
        >
          <option value="All">All Messages</option>
          {MESSAGE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-xs text-slate-500">
            No contact inquiries found.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className="bg-white rounded-lg border border-slate-200 p-5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm text-slate-900">{msg.subject}</h2>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {msg.name} · {msg.email} · {msg.phone} · {formatDateShort(msg.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <SelectField
                    value={msg.status}
                    onChange={(e) =>
                      statusMutation.mutate({
                        id: msg._id,
                        status: e.target.value as MessageStatus,
                      })
                    }
                    className="h-8 text-xs w-32"
                  >
                    {MESSAGE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </SelectField>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-700 hover:bg-red-50"
                    onClick={() => deleteMutation.mutate(msg._id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-slate-700 bg-slate-50 rounded p-3.5 leading-relaxed">
                {msg.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
