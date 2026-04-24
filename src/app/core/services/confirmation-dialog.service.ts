import { Injectable, computed, signal } from '@angular/core';

export interface ConfirmationDialogRequest {
  title: string;
  message: string;
  hint?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmationDialogService {
  private readonly requestStore = signal<ConfirmationDialogRequest | null>(null);

  readonly request = this.requestStore.asReadonly();
  readonly open = computed(() => Boolean(this.request()));

  show(request: ConfirmationDialogRequest): void {
    this.requestStore.set(request);
  }

  async confirm(): Promise<void> {
    const request = this.request();

    if (!request) {
      return;
    }

    this.requestStore.set(null);
    await request.onConfirm();
  }

  cancel(): void {
    const request = this.request();

    this.requestStore.set(null);
    request?.onCancel?.();
  }
}