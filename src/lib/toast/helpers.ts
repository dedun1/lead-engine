import { toast } from 'sonner';

/** Error toast with optional retry — persists until dismissed. */
export function toastError(message: string, retry?: () => void) {
  toast.error(message, {
    duration: Infinity,
    action: retry
      ? { label: 'Retry', onClick: () => retry() }
      : undefined,
  });
}

export function toastSuccess(message: string) {
  toast.success(message, { duration: 3000 });
}
