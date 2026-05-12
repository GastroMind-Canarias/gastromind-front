import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  entityName?: string;
  resolve?: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly config = signal<ConfirmDialogConfig | null>(null);

  confirm(cfg: Omit<ConfirmDialogConfig, 'resolve'>): Promise<boolean> {
    return new Promise(resolve => {
      this.config.set({ ...cfg, resolve });
    });
  }

  close(result: boolean): void {
    this.config()?.resolve?.(result);
    this.config.set(null);
  }
}
