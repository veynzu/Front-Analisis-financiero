import type {
  ActivesResponse,
  PricesResponse,
  JobStartResponse,
  JobStatusResponse,
  SortResult,
  TopVolumeDay,
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
  apiFetch<SortResult[]>("/api/sort");

export const getTopVolumeDays = () =>
  apiFetch<TopVolumeDay[]>("/api/sorting/top-volume-days");
