import { Injectable, signal } from '@angular/core';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  tone: ToastTone;
  durationMs: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastsStore = signal<ToastItem[]>([]);
  private readonly dismissTimers = new Map<string, number>();

  readonly toasts = this.toastsStore.asReadonly();

  show(toast: Omit<ToastItem, 'id'>): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toastItem: ToastItem = {
      id,
      ...toast,
    };

    this.toastsStore.update((items) => [...items, toastItem].slice(-4));
    this.scheduleDismiss(toastItem);

    return id;
  }

  showSuccess(title: string, message: string, durationMs = 4200): string {
    return this.show({ title, message, tone: 'success', durationMs });
  }

  showError(title: string, message: string, durationMs = 5200): string {
    return this.show({ title, message, tone: 'danger', durationMs });
  }

  showInfo(title: string, message: string, durationMs = 4200): string {
    return this.show({ title, message, tone: 'info', durationMs });
  }

  dismiss(toastId: string): void {
    const timer = this.dismissTimers.get(toastId);

    if (timer) {
      window.clearTimeout(timer);
      this.dismissTimers.delete(toastId);
    }

    this.toastsStore.update((items) => items.filter((item) => item.id !== toastId));
  }

  private scheduleDismiss(toast: ToastItem): void {
    const timer = window.setTimeout(() => {
      this.dismiss(toast.id);
    }, toast.durationMs);

    this.dismissTimers.set(toast.id, timer);
  }
}