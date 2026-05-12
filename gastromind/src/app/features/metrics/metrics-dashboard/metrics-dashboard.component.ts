import {
  Component, ElementRef, OnDestroy, ViewChild,
  afterNextRender, effect, inject, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
  DoughnutController, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js';
import { MetricsService, CHART_COLORS, TimeSeries } from '../metrics.service';

Chart.register(
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
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

  // Canvases siempre en el DOM → static: true + afterNextRender
  @ViewChild('trafficCanvas', { static: true }) trafficCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('memoryCanvas',  { static: true }) memoryCanvasRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('cpuCanvas',     { static: true }) cpuCanvasRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('latencyCanvas', { static: true }) latencyCanvasRef!: ElementRef<HTMLCanvasElement>;

  private trafficChart?: Chart;
  private memoryChart?:  Chart;
  private cpuChart?:     Chart;
  private latencyChart?: Chart;

  constructor() {
    afterNextRender(() => this.buildCharts());

    effect(() => {
      void this.svc.httpTraffic();
      void this.svc.cpuUsage();
      void this.svc.httpLatency();
      void this.svc.memory();
      if (this.trafficChart) {
        this.syncCharts();
      }
    });
  }

  ngOnInit(): void { this.svc.loadAll(); }

  ngOnDestroy(): void {
    this.trafficChart?.destroy();
    this.memoryChart?.destroy();
    this.cpuChart?.destroy();
    this.latencyChart?.destroy();
  }

  reload(): void {
    this.svc.loadAll();
  }

  // ── Construcción de charts ────────────────────────────────────────────────

  private buildCharts(): void {
    // 1. Tráfico HTTP por código de estado
    this.trafficChart = new Chart(this.trafficCanvasRef.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: '#94a3b8', boxWidth: 12, padding: 16 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(4)} req/s` } },
        },
        scales: {
          x: { ticks: { color: '#94a3b8', maxTicksLimit: 12 }, grid: { color: 'rgba(148,163,184,0.12)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.12)' },
               title: { display: true, text: 'req / s', color: '#94a3b8' } },
        },
      },
    });

    // 2. Memoria JVM heap (doughnut)
    this.memoryChart = new Chart(this.memoryCanvasRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Usada', 'Libre'],
        datasets: [{ data: [0, 1], backgroundColor: [CHART_COLORS.red, CHART_COLORS.muted], borderWidth: 0, hoverOffset: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, boxWidth: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} MB` } },
        },
      },
    });

    // 3. CPU del proceso (%)
    this.cpuChart = new Chart(this.cpuCanvasRef.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` CPU: ${(ctx.parsed.y as number).toFixed(2)} %` } },
        },
        scales: {
          x: { ticks: { color: '#94a3b8', maxTicksLimit: 10 }, grid: { color: 'rgba(148,163,184,0.12)' } },
          y: {
            min: 0, max: 100,
            ticks: { color: '#94a3b8', callback: v => `${v}%` },
            grid: { color: 'rgba(148,163,184,0.12)' },
            title: { display: true, text: 'CPU %', color: '#94a3b8' },
          },
        },
      },
    });

    // 4. Latencia media HTTP (ms)
    this.latencyChart = new Chart(this.latencyCanvasRef.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` Latencia: ${(ctx.parsed.y as number).toFixed(1)} ms` } },
        },
        scales: {
          x: { ticks: { color: '#94a3b8', maxTicksLimit: 10 }, grid: { color: 'rgba(148,163,184,0.12)' } },
          y: {
            min: 0,
            ticks: { color: '#94a3b8', callback: v => `${v} ms` },
            grid: { color: 'rgba(148,163,184,0.12)' },
            title: { display: true, text: 'ms', color: '#94a3b8' },
          },
        },
      },
    });

    this.syncCharts();
  }

  // ── Sincronización señales → charts ──────────────────────────────────────

  private syncCharts(): void {
    this.syncLine(this.trafficChart, this.svc.httpTraffic());
    this.syncLine(this.cpuChart,     this.svc.cpuUsage());
    this.syncLine(this.latencyChart, this.svc.httpLatency());

    const mem = this.svc.memory();
    if (mem && this.memoryChart) {
      this.memoryChart.data.datasets[0].data = [mem.usedMB, Math.round(mem.freeBytes / 1024 / 1024)];
      this.memoryChart.update('none');
    }
  }

  private syncLine(chart: Chart | undefined, data: TimeSeries | null): void {
    if (!chart || !data) return;
    chart.data.labels = data.labels;
    chart.data.datasets = data.datasets.map(d => ({
      ...d, tension: 0.35, fill: true, pointRadius: 0, pointHoverRadius: 4,
    }));
    chart.update('none');
  }

  get memStats() { return this.svc.memory(); }
}
