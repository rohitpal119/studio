import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles: flex display, min height, width, rounded corners, border, background, padding
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2',
          // Font size and line height for readability
          'text-base md:text-sm leading-relaxed', // Adjusted line height
          // Ring offset for focus state
          'ring-offset-background',
          // Placeholder text styling
          'placeholder:text-muted-foreground',
          // Focus state: remove default outline, apply custom ring
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          // Disabled state styling
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
