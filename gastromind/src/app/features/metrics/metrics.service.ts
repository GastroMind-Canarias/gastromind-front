import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import {
  PrometheusRangeResponse,
  PrometheusVectorResponse,
  MemoryStats,
} from '../../core/models/metrics.models';

const PROM = '/prometheus/api/v1';

export const CHART_COLORS = {
  red:     'rgba(239, 68,  68,  0.85)',
  redBg:   'rgba(239, 68,  68,  0.15)',
  amber:   'rgba(245, 158, 11,  0.85)',
  amberBg: 'rgba(245, 158, 11,  0.15)',
  green:   'rgba(34,  197, 94,  0.85)',
  greenBg: 'rgba(34,  197, 94,  0.15)',
  blue:    'rgba(59,  130, 246, 0.85)',
  blueBg:  'rgba(59,  130, 246, 0.15)',
  indigo:  'rgba(99,  102, 241, 0.85)',
  indigoBg:'rgba(99,  102, 241, 0.15)',
  muted:   'rgba(148, 163, 184, 0.35)',
};

/** Serie temporal genérica para line charts */
export interface TimeSeries {
  labels:   string[];
  datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string }[];
}

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private http = inject(HttpClient);

  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);

  /** Tráfico HTTP por código de estado (2xx/3xx/4xx/5xx) */
  readonly httpTraffic = signal<TimeSeries | null>(null);

  /** Uso de CPU del proceso JVM (0–100 %) */
  readonly cpuUsage = signal<TimeSeries | null>(null);

  /** Latencia media de respuesta HTTP (ms) */
  readonly httpLatency = signal<TimeSeries | null>(null);

  /** Memoria heap JVM */
  readonly memory = signal<MemoryStats | null>(null);

  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const now   = Math.floor(Date.now() / 1000);
    const start = now - 2 * 3600; // últimas 2 h
    const step  = 60;             // punto cada 60 s

    forkJoin({
      // 1. Tráfico por código HTTP
      traffic: this.http.get<PrometheusRangeResponse>(`${PROM}/query_range`, {
        params: {
          query: `sum by (status) (rate(http_server_requests_seconds_count[5m]))`,
          start: String(start), end: String(now), step: String(step),
        },
      }),

      // 2. CPU del proceso (multiplicamos por 100 para obtener %)
      cpu: this.http.get<PrometheusRangeResponse>(`${PROM}/query_range`, {
        params: {
          query: `process_cpu_usage * 100`,
          start: String(start), end: String(now), step: String(step),
        },
      }),

      // 3. Latencia media global: sum(rate(seconds_sum)) / sum(rate(seconds_count)) → ms
      latency: this.http.get<PrometheusRangeResponse>(`${PROM}/query_range`, {
        params: {
          query: `sum(rate(http_server_requests_seconds_sum[5m])) / sum(rate(http_server_requests_seconds_count[5m])) * 1000`,
          start: String(start), end: String(now), step: String(step),
        },
      }),

      // 4. Memoria heap
      memUsed: this.http.get<PrometheusVectorResponse>(`${PROM}/query`, {
        params: { query: `sum(jvm_memory_used_bytes{area="heap"})` },
      }),
      memMax: this.http.get<PrometheusVectorResponse>(`${PROM}/query`, {
        params: { query: `sum(jvm_memory_max_bytes{area="heap"})` },
      }),
    }).subscribe({
      next: ({ traffic, cpu, latency, memUsed, memMax }) => {
        this.httpTraffic.set(this.parseTraffic(traffic));
        this.cpuUsage.set(this.parseCpu(cpu));
        this.httpLatency.set(this.parseLatency(latency));
        this.memory.set(this.parseMemory(memUsed, memMax));
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudo conectar con Prometheus. Comprueba que el servidor esté activo.');
        this.isLoading.set(false);
      },
    });
  }

  // ── Parsers ───────────────────────────────────────────────────────────────

  private parseTraffic(res: PrometheusRangeResponse): TimeSeries {
    if (!res.data.result.length) return { labels: [], datasets: [] };

    const labels = this.timeLabels(res.data.result[0].values);

    const statusColors: Record<string, { border: string; bg: string }> = {
      '2': { border: CHART_COLORS.green,  bg: CHART_COLORS.greenBg  },
      '3': { border: CHART_COLORS.blue,   bg: CHART_COLORS.blueBg   },
      '4': { border: CHART_COLORS.amber,  bg: CHART_COLORS.amberBg  },
      '5': { border: CHART_COLORS.red,    bg: CHART_COLORS.redBg    },
    };

    const sorted = [...res.data.result].sort((a, b) =>
      (a.metric['status'] ?? '0').localeCompare(b.metric['status'] ?? '0'));

    return {
      labels,
      datasets: sorted.map(s => {
        const status = s.metric['status'] ?? '?';
        const c = statusColors[status[0]] ?? { border: CHART_COLORS.muted, bg: CHART_COLORS.muted };
        return { label: `${status}xx`, data: s.values.map(([, v]) => parseFloat(v)), borderColor: c.border, backgroundColor: c.bg };
      }),
    };
  }

  private parseCpu(res: PrometheusRangeResponse): TimeSeries {
    const series = res.data.result[0];
    if (!series) return { labels: [], datasets: [] };
    return {
      labels: this.timeLabels(series.values),
      datasets: [{
        label: 'CPU (%)',
        data:  series.values.map(([, v]) => Math.round(parseFloat(v) * 100) / 100),
        borderColor:     CHART_COLORS.indigo,
        backgroundColor: CHART_COLORS.indigoBg,
      }],
    };
  }

  private parseLatency(res: PrometheusRangeResponse): TimeSeries {
    const series = res.data.result[0];
    if (!series) return { labels: [], datasets: [] };
    return {
      labels: this.timeLabels(series.values),
      datasets: [{
        label: 'Latencia media (ms)',
        data:  series.values.map(([, v]) => {
          const ms = parseFloat(v);
          return isNaN(ms) ? 0 : Math.round(ms * 10) / 10;
        }),
        borderColor:     CHART_COLORS.amber,
        backgroundColor: CHART_COLORS.amberBg,
      }],
    };
  }

  private parseMemory(
    memUsed: PrometheusVectorResponse,
    memMax:  PrometheusVectorResponse,
  ): MemoryStats {
    const usedBytes = parseFloat(memUsed.data.result[0]?.value[1] ?? '0');
    const maxBytes  = parseFloat(memMax.data.result[0]?.value[1]  ?? '0');
    const freeBytes = Math.max(0, maxBytes - usedBytes);
    return {
      usedBytes, maxBytes, freeBytes,
      usedMB: Math.round(usedBytes / 1024 / 1024),
      maxMB:  Math.round(maxBytes  / 1024 / 1024),
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private timeLabels(values: [number, string][]): string[] {
    return values.map(([ts]) => {
      const d = new Date(ts * 1000);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
  }
}
