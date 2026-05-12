import type {
  ActivesResponse,
  PricesResponse,
  JobStartResponse,
  JobStatusResponse,
  SortResult,
  TopVolumeDay,
  TimeSeriesField,
  TimeSeriesSimilarityResponse,
  PatternResult,
  VolatilityResult,
  VolatilityRankingResponse,
  CorrelationMatrixResponse,
  CorrelationField,
  CandlestickResponse,
} from "./types";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...options, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const getActives = () =>
  apiFetch<ActivesResponse>("/api/actives");

export const getActivePrices = (id: number) =>
  apiFetch<PricesResponse>(`/api/actives/${id}/prices`);

export const startFetchJob = () =>
  apiFetch<JobStartResponse>("/api/jobs/fetch-historical-data", {
    method: "POST",
  });

export const getJobStatus = () =>
  apiFetch<JobStatusResponse>("/api/jobs/status", { method: "POST" });

// TODO: confirmar el endpoint de resultados de ordenamiento con el equipo backend
export const getSortingResults = () =>
  apiFetch<SortResult[]>("/api/sorting/analysis");

export const getTopVolumeDays = () =>
  apiFetch<TopVolumeDay[]>("/api/sorting/top-volume-days");

export const getTimeSeriesSimilarity = (
  firstActiveId: number,
  secondActiveId: number,
  field: TimeSeriesField,
) =>
  apiFetch<TimeSeriesSimilarityResponse>(
    `/api/time-series-similarity/process?firstActiveId=${firstActiveId}&secondActiveId=${secondActiveId}&field=${field}`,
  );

// ============================================================
// R3 — Patrones y volatilidad
// ============================================================

export const getPatternsByActive = (activeId: number, windowSize = 10) =>
  apiFetch<PatternResult[]>(
    `/api/analysis/patterns/${activeId}?windowSize=${windowSize}`,
  );

export const getAllPatterns = (windowSize = 10) =>
  apiFetch<Record<string, PatternResult[]>>(
    `/api/analysis/patterns?windowSize=${windowSize}`,
  );

export const getVolatility = (activeId: number) =>
  apiFetch<VolatilityResult>(`/api/analysis/volatility/${activeId}`);

export const getRiskRanking = () =>
  apiFetch<VolatilityRankingResponse>("/api/analysis/risk-ranking");

// ============================================================
// R4 — Matriz de correlación
// ============================================================

export const getCorrelationMatrix = (field: CorrelationField = "close") =>
  apiFetch<CorrelationMatrixResponse>(
    `/api/correlation-matrix?field=${field}`,
  );

// ============================================================
// R4 — Velas + SMA
// ============================================================

export const getCandlestickData = (activeId: number, smaPeriod = 20) =>
  apiFetch<CandlestickResponse>(
    `/api/visualization/candlestick/${activeId}?smaPeriod=${smaPeriod}`,
  );
