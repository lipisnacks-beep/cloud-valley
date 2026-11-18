import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import { usePublicData } from '../../context/SettingsContext';
import { cn, toInputDate } from '../../lib/utils';
import { Button } from '../ui/button';

interface BookingWidgetProps {
  variant?: 'hero' | 'surface';
  defaultRoomId?: string;
  className?: string;
}

export function BookingWidget({
  variant = 'hero',
  defaultRoomId = '',
  className,
}: BookingWidgetProps) {
  const navigate = useNavigate();
  const { rooms } = usePublicData();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDays = new Date(today);
  threeDays.setDate(threeDays.getDate() + 3);

  const [checkIn, setCheckIn] = useState(toInputDate(tomorrow));
  const [checkOut, setCheckOut] = useState(toInputDate(threeDays));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out must be after check-in.');
      return;
    }
    setError('');
    const qs = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
    });
    if (roomId) qs.set('roomId', roomId);
    navigate(`/booking?${qs.toString()}`);
  };

  const isHero = variant === 'hero';

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'rounded-lg p-4 sm:p-5 transition-colors',
        isHero
          ? 'bg-[#F8F5EF]/95 backdrop-blur-md text-[#18352B] shadow-xl border border-white/40'
          : 'bg-white text-[#18352B] border border-[#18352B]/12',
        className
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
        <div className="lg:col-span-3">
          <label
            htmlFor={`bw-checkin-${variant}`}
            className="flex items-center gap-1.5 text-xs font-medium text-[#58636B] mb-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-[#234638]" />
            <span>Check-in</span>
          </label>
          <input
            id={`bw-checkin-${variant}`}
            type="date"
            min={toInputDate(today)}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
            className="w-full h-10 rounded-md border border-[#18352B]/18 bg-white px-3 text-sm text-[#18352B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234638]"
          />
        </div>

        <div className="lg:col-span-3">
          <label
            htmlFor={`bw-checkout-${variant}`}
            className="flex items-center gap-1.5 text-xs font-medium text-[#58636B] mb-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-[#234638]" />
            <span>Check-out</span>
          </label>
          <input
            id={`bw-checkout-${variant}`}
            type="date"
            min={checkIn || toInputDate(tomorrow)}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
            className="w-full h-10 rounded-md border border-[#18352B]/18 bg-white px-3 text-sm text-[#18352B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234638]"
          />
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor={`bw-adults-${variant}`}
              className="flex items-center gap-1 text-xs font-medium text-[#58636B] mb-1.5"
            >
              <Users className="w-3.5 h-3.5 text-[#234638]" />
              <span>Adults</span>
            </label>
            <select
              id={`bw-adults-${variant}`}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full h-10 rounded-md border border-[#18352B]/18 bg-white px-2.5 text-sm text-[#18352B]"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor={`bw-children-${variant}`}
              className="block text-xs font-medium text-[#58636B] mb-1.5"
            >
              Children
            </label>
            <select
              id={`bw-children-${variant}`}
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="w-full h-10 rounded-md border border-[#18352B]/18 bg-white px-2.5 text-sm text-[#18352B]"
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="lg:col-span-2">
          <label
            htmlFor={`bw-room-${variant}`}
            className="block text-xs font-medium text-[#58636B] mb-1.5"
          >
            Room Preference
          </label>
          <select
            id={`bw-room-${variant}`}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full h-10 rounded-md border border-[#18352B]/18 bg-white px-2.5 text-sm text-[#18352B]"
          >
            <option value="">Any Suite</option>
            {rooms.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <Button type="submit" className="w-full h-10 px-4">
            <span>Check Dates</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error && <p className="mt-2.5 text-xs text-red-700 font-medium">{error}</p>}
    </form>
  );
}
