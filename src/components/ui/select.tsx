import * as React from 'react';
import { cn } from '../../lib/utils';

export const SelectField = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-[#18352B]/18 bg-white px-3 py-2 text-sm text-[#18352B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234638] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
SelectField.displayName = 'SelectField';
