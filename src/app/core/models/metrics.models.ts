/** Tipos de respuesta de la Prometheus HTTP API v1 */

export interface PrometheusRangeResult {
  metric: Record<string, string>;
  values: [number, string][]; // [unix_timestamp, value_string]
}

export interface PrometheusVectorResult {
  metric: Record<string, string>;
  value: [number, string]; // [unix_timestamp, value_string]
}

export interface PrometheusRangeResponse {
  status: 'success' | 'error';
  data: {
    resultType: 'matrix';
    result: PrometheusRangeResult[];
  };
}

export interface PrometheusVectorResponse {
  status: 'success' | 'error';
  data: {
    resultType: 'vector';
    result: PrometheusVectorResult[];
  };
}

/** Datos procesados listos para Chart.js */
export interface MemoryStats {
  usedBytes:  number;
  maxBytes:   number;
  freeBytes:  number;
  usedMB:     number;
  maxMB:      number;
}
