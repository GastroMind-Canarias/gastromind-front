import {
  Component, ElementRef, OnDestroy, ViewChild,
  afterNextRender, effect, inject, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController,  BarElement,
  DoughnutController, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js';
import { MetricsService, CHART_COLORS } from '../metrics.service';

// Registrar solo los módulos necesarios (tree-shakeable)
Chart.register(
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController,  BarElement,
  DoughnutController, ArcElement,
  Tooltip, Legend, Filler,
);

@Component({
  selector: 'app-metrics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metrics-dashboard.component.html',
  styleUrl:    './metrics-dashboard.component.css',
})
export class MetricsDashboardComponent implements OnInit, OnDestroy {
  protected svc = inject(MetricsService);

  // static: true → los canvas están SIEMPRE en el DOM (no dentro de @if)
  // así ViewChild los encuentra desde el primer render y afterNextRender funciona
  @ViewChild('errorRateCanvas', { static: true }) errorRateCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('endpointsCanvas', { static: true }) endpointsCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('memoryCanvas',    { static: true }) memoryCanvasRef!:    ElementRef<HTMLCanvasElement>;

  private errorRateChart?: Chart;
  private endpointsChart?: Chart;
  private memoryChart?:    Chart;

  constructor() {
    // afterNextRender garantiza que los canvas están pintados en el DOM
    afterNextRender(() => this.buildCharts());

    // effect sincroniza datos → charts cada vez que cambian las señales
    effect(() => {
      const errData = this.svc.errorRate();
      const epData  = this.svc.topEndpoints();
      const memData = this.svc.memory();
      if (this.errorRateChart || this.endpointsChart || this.memoryChart) {
        this.syncCharts(errData, epData, memData);
      }
    });
  }

  ngOnInit(): void {
    this.svc.loadAll();
  }

  ngOnDestroy(): void {
    this.errorRateChart?.destroy();
    this.endpointsChart?.destroy();
    this.memoryChart?.destroy();
  }

  reload(): void {
    this.svc.loadAll();
  }

  // ── Inicialización de charts ──────────────────────────────────────────────

  private buildCharts(): void {
    // 1. Tráfico HTTP — line chart
    this.errorRateChart = new Chart(this.errorRateCanvasRef.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: '#94a3b8', boxWidth: 12, padding: 16 } },
          tooltip: { callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(4)} req/s`,
          }},
        },
        scales: {
          x: { ticks: { color: '#94a3b8', maxTicksLimit: 12 }, grid: { color: 'rgba(148,163,184,0.12)' } },
          y: {
            ticks: { color: '#94a3b8' },
            grid:  { color: 'rgba(148,163,184,0.12)' },
            title: { display: true, text: 'req / s', color: '#94a3b8' },
          },
        },
      },
    });

    // 2. Top endpoints — horizontal bar chart
    this.endpointsChart = new Chart(this.endpointsCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Peticiones (10 min)',
          data: [],
          backgroundColor: CHART_COLORS.blueBg,
          borderColor:     CHART_COLORS.blue,
          borderWidth: 1.5,
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} peticiones` } },
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.12)' } },
          y: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
        },
      },
    });

    // 3. JVM Memory — doughnut
    this.memoryChart = new Chart(this.memoryCanvasRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Usada', 'Libre'],
        datasets: [{
          data: [0, 1],
          backgroundColor: [CHART_COLORS.red, CHART_COLORS.muted],
          borderColor:     ['transparent', 'transparent'],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, boxWidth: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} MB` } },
        },
      },
    });

    // Sincronizar por si los datos ya llegaron antes del primer render
    this.syncCharts(this.svc.errorRate(), this.svc.topEndpoints(), this.svc.memory());
  }

  // ── Sincronizar datos → charts ────────────────────────────────────────────

  private syncCharts(
    errData  = this.svc.errorRate(),
    epData   = this.svc.topEndpoints(),
    memData  = this.svc.memory(),
  ): void {
    if (errData && this.errorRateChart) {
      this.errorRateChart.data.labels   = errData.labels;
      this.errorRateChart.data.datasets = errData.datasets.map(d => ({
        ...d,
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
      }));
      this.errorRateChart.update('none');
    }

    if (epData && this.endpointsChart) {
      this.endpointsChart.data.labels           = epData.labels;
      this.endpointsChart.data.datasets[0].data = epData.data;
      this.endpointsChart.update('none');
    }

    if (memData && this.memoryChart) {
      this.memoryChart.data.datasets[0].data = [
        memData.usedMB,
        Math.round(memData.freeBytes / 1024 / 1024),
      ];
      this.memoryChart.update('none');
    }
  }

  get memStats() { return this.svc.memory(); }
}
