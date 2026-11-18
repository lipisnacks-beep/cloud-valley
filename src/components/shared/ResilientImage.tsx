import { useState } from 'react';
import { Mountain } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  loading?: 'lazy' | 'eager';
}

export function ResilientImage({
  src,
  alt,
  className,
  containerClassName,
  loading = 'lazy',
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex flex-col items-center justify-center bg-gradient-to-br from-[#234638] via-[#18352B] to-[#2d5747] text-[#F8F5EF]/80 p-6 text-center',
          containerClassName,
          className
        )}
      >
        <Mountain className="w-8 h-8 mb-2 text-[#C6A66B]" strokeWidth={1.5} />
        <span className="text-xs font-medium tracking-wide opacity-80 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
