import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMedicineImageUpload } from '@/hooks/use-medicine-image-upload';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

type MedicineImageUploadProps = {
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (imageUrl: string) => void;
  testId?: string;
};

export function MedicineImageUpload({
  label,
  value,
  error,
  disabled = false,
  onChange,
  testId = 'medicine-image-upload',
}: MedicineImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewError, setPreviewError] = useState(false);
  const upload = useMedicineImageUpload();

  const handleFile = async (file: File | null) => {
    if (!file || disabled) return;
    setPreviewError(false);
    const result = await upload.mutateAsync({ file, replaceUrl: value || undefined });
    onChange(result.url);
  };

  return (
    <div className="min-w-0 space-y-2" data-testid={testId}>
      <Label>{label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken">
          {value && !previewError ? (
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-text-disabled">💊</div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            disabled={disabled || upload.isPending}
            data-testid={`${testId}-input`}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handleFile(file);
              event.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={disabled || upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {value ? 'Replace image' : 'Upload image'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn('w-full sm:w-auto justify-start')}
              disabled={disabled || upload.isPending}
              onClick={() => {
                onChange('');
                setPreviewError(false);
              }}
            >
              <X className="h-4 w-4" />
              Remove image
            </Button>
          )}
          <p className="text-xs text-text-secondary break-words">
            JPG, PNG, or WebP up to 5MB. Images are optimized to WebP before storage.
          </p>
          {upload.error && <p className="text-xs text-danger break-words">{upload.error.message}</p>}
          {error && <p className="text-xs text-danger break-words">{error}</p>}
        </div>
      </div>
    </div>
  );
}
