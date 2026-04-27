import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  readonly svc = inject(ConfirmDialogService);
  readonly step = signal<1 | 2>(1);

  @HostListener('document:keydown.escape')
  onEsc() { this.cancel(); }

  next() { this.step.set(2); }

  cancel() {
    this.step.set(1);
    this.svc.close(false);
  }

  confirm() {
    this.step.set(1);
    this.svc.close(true);
  }
}
