import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import {
  PrometheusRangeResponse,
  PrometheusVectorResponse,
  MemoryStats,
} from '../../core/models/metrics.models';

const PROM = '/prometheus/api/v1';

// Colores consistentes con el design system del proyecto
export const CHART_COLORS = {
  red:    'rgba(239, 68, 68,  0.85)',
  redBg:  'rgba(239, 68, 68,  0.15)',
  amber:  'rgba(245, 158, 11, 0.85)',
  amberBg:'rgba(245, 158, 11, 0.15)',
  green:  'rgba(34,  197, 94, 0.85)',
  greenBg:'rgba(34,  197, 94, 0.15)',
  blue:   'rgba(59,  130, 246, 0.85)',
  blueBg: 'rgba(59,  130, 246, 0.15)',
  muted:  'rgba(148, 163, 184, 0.35)',
};

export interface ErrorRateSeries {
  labels: string[];               // HH:mm
  datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string }[];
}

export interface TopEndpointsSeries {
  labels: string[];               // URI acortada
  data:   number[];               // req / s
}

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private http = inject(HttpClient);

  readonly isLoading   = signal(false);
  readonly error       = signal<string | null>(null);

  // Señales con datos procesados
  /** Renombrado internamente: ahora muestra todos los códigos HTTP, no solo errores */
  readonly errorRate   = signal<ErrorRateSeries | null>(null);
  readonly topEndpoints = signal<TopEndpointsSeries | null>(null);
  readonly memory      = signal<MemoryStats | null>(null);

  /** Carga las 3 métricas en paralelo */
  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const now   = Math.floor(Date.now() / 1000);
    const start = now - 2 * 3600; // 2 horas atrás
    const step  = 60;             // punto cada 60 s

    forkJoin({
      // Todos los códigos HTTP (2xx/3xx en azul/verde, 4xx ámbar, 5xx rojo)
      errorRate: this.http.get<PrometheusRangeResponse>(`${PROM}/query_range`, {
        params: {
          query: `sum by (status) (rate(http_server_requests_seconds_count[5m]))`,
          start: String(start),
          end:   String(now),
          step:  String(step),
        },
      }),
      topEndpoints: this.http.get<PrometheusVectorResponse>(`${PROM}/query`, {
        params: {
          // Solo endpoints de la API real, últimas 24 h para que siempre haya datos
          query: `topk(8, sum by (uri) (increase(http_server_requests_seconds_count{uri=~"/api.*"}[24h])))`,
        },
      }),
      // Filtrar solo heap para evitar valores -1 en áreas non-heap
      memUsed: this.http.get<PrometheusVectorResponse>(`${PROM}/query`, {
        params: { query: `sum(jvm_memory_used_bytes{area="heap"})` },
      }),
      memMax: this.http.get<PrometheusVectorResponse>(`${PROM}/query`, {
        params: { query: `sum(jvm_memory_max_bytes{area="heap"})` },
      }),
    }).subscribe({
      next: ({ errorRate, topEndpoints, memUsed, memMax }) => {
        this.errorRate.set(this.parseErrorRate(errorRate));
        this.topEndpoints.set(this.parseTopEndpoints(topEndpoints));
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

  private parseErrorRate(res: PrometheusRangeResponse): ErrorRateSeries {
    if (!res.data.result.length) {
      return { labels: [], datasets: [] };
    }

    // Etiquetas de tiempo del primer resultado (todas las series comparten la misma timeline)
    const labels = res.data.result[0].values.map(([ts]) => {
      const d = new Date(ts * 1000);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    const statusColors: Record<string, { border: string; bg: string }> = {
      '2': { border: CHART_COLORS.green, bg: CHART_COLORS.greenBg },
      '3': { border: CHART_COLORS.blue,  bg: CHART_COLORS.blueBg  },
      '4': { border: CHART_COLORS.amber, bg: CHART_COLORS.amberBg },
      '5': { border: CHART_COLORS.red,   bg: CHART_COLORS.redBg   },
    };

    // Ordenar: 2xx primero, luego 3xx, 4xx, 5xx
    const sorted = [...res.data.result].sort((a, b) => {
      const sa = a.metric['status'] ?? '0';
      const sb = b.metric['status'] ?? '0';
      return sa.localeCompare(sb);
    });

    const datasets = sorted.map(series => {
      const status = series.metric['status'] ?? 'unknown';
      const group  = status[0];
      const colors = statusColors[group] ?? { border: CHART_COLORS.muted, bg: CHART_COLORS.muted };
      return {
        label:           `${status}xx`,
        data:            series.values.map(([, v]) => parseFloat(v)),
        borderColor:     colors.border,
        backgroundColor: colors.bg,
      };
    });

    return { labels, datasets };
  }

  private parseTopEndpoints(res: PrometheusVectorResponse): TopEndpointsSeries {
    const results = [...res.data.result]
      .sort((a, b) => parseFloat(b.value[1]) - parseFloat(a.value[1]));

    return {
      labels: results.map(r => {
        const uri = r.metric['uri'] ?? 'unknown';
        // Acortar URIs largas: /api/v1/users/{id} → /users/{id}
        return uri.replace(/^\/api\/v\d+/, '');
      }),
      data: results.map(r => Math.round(parseFloat(r.value[1]) * 100) / 100),
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
      usedBytes,
      maxBytes,
      freeBytes,
      usedMB: Math.round(usedBytes / 1024 / 1024),
      maxMB:  Math.round(maxBytes  / 1024 / 1024),
    };
  }
}
