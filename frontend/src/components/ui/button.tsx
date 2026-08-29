import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40 min-h-[44px] px-4',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm shadow-primary/20',
        secondary: 'border border-secondary/30 bg-surface-base text-secondary hover:bg-secondary-subtle hover:border-secondary/45',
        tertiary: 'text-primary hover:bg-primary-subtle',
        destructive: 'bg-danger text-white hover:bg-danger/90 shadow-sm shadow-danger/15',
        ghost: 'hover:bg-surface-sunken text-text-secondary hover:text-text-primary',
      },
      size: {
        lg: 'h-12 px-6 text-base',
        md: 'h-10 px-4',
        sm: 'h-8 px-3 text-xs min-h-[32px]',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || loading} {...props}>
        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
export { Button, buttonVariants };
