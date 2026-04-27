import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type KpiCardIcon = 'users' | 'home' | 'ticket' | 'grid';
export type KpiCardColor = 'green' | 'orange' | 'blue';

/**
 * KpiCardComponent — tarjeta de métrica reutilizable.
 *
 * Uso:
 *   <app-kpi-card
 *     title="Usuarios Totales"
 *     [value]="totalUsers()"
 *     icon="users"
 *     color="green"
 *     [loading]="isLoading()"
 *   />
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css',
})
export class KpiCardComponent {
  @Input({ required: true }) title!: string;
  @Input() value: number | string = 0;
  @Input() icon: KpiCardIcon = 'grid';
  @Input() color: KpiCardColor = 'green';
  @Input() loading = false;
  /** Texto de descripción secundario (opcional). */
  @Input() description?: string;
}
