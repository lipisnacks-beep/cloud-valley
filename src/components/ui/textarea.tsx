import * as React from 'react';
import { cn } from '../../lib/utils';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[96px] w-full rounded-md border border-[#18352B]/18 bg-white px-3.5 py-2.5 text-sm text-[#18352B] placeholder:text-[#58636B]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234638] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
