import * as React from 'react';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

type ToastVariant = 'default' | 'destructive';

export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

type Listener = (toasts: ToastData[]) => void;

let memoryToasts: ToastData[] = [];
const listeners = new Set<Listener>();
let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

function emit() {
  listeners.forEach((l) => l([...memoryToasts]));
}

export function toast({ title, description, variant = 'default' }: Omit<ToastData, 'id'>) {
  const id = genId();
  memoryToasts = [{ id, title, description, variant }, ...memoryToasts].slice(0, TOAST_LIMIT);
  emit();
  window.setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    emit();
  }, TOAST_REMOVE_DELAY);
  return id;
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastData[]>(memoryToasts);

  React.useEffect(() => {
    listeners.add(setToasts);
    return () => { listeners.delete(setToasts); };
  }, []);

  return {
    toasts,
    toast,
    success: (description: string, title?: string) => toast({ title, description, variant: 'default' }),
    error: (description: string, title?: string) => toast({ title, description, variant: 'destructive' }),
  };
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, variant }) => (
        <Toast key={id} variant={variant}>
          <div className="grid gap-1 flex-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
