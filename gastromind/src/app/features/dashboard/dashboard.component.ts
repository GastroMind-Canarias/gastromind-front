import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { currentUser } from '../../core/store/auth.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, KpiCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  protected readonly svc = inject(DashboardService);
  /** Perfil del usuario logueado (viene del store, ya hidratado por LayoutComponent). */
  protected readonly user = currentUser;
  /** Fecha de hoy para el encabezado. */
  protected readonly today = new Date();

  ngOnInit(): void {
    this.svc.loadStats();
  }
}
