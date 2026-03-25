"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { startFetchJob, getJobStatus } from "@/lib/api";
import type { JobStatusResponse } from "@/lib/types";

export function JobControl() {
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollStatus = useCallback(async (): Promise<boolean> => {
    try {
      const data = await getJobStatus();
      setStatus(data);
      return data.running;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!status?.running) return;
    const interval = setInterval(async () => {
      const stillRunning = await pollStatus();
      if (!stillRunning) clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [status?.running, pollStatus]);

  const handlePopulate = async () => {
    setStarting(true);
    setError(null);
    try {
      await startFetchJob();
      await pollStatus();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setStarting(false);
    }
  };

  const isRunning = starting || (status?.running ?? false);

  const badgeVariant = status?.running
    ? "warning"
    : status?.progress === 100
      ? "success"
      : "neutral";

  const badgeLabel = status?.running
    ? `Ejecutando… ${status.progress}%`
    : status?.progress === 100
      ? "Completado"
      : status
        ? "En espera"
        : null;

  const validSymbols = status?.processedSymbols.filter(Boolean) ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handlePopulate} disabled={isRunning} type="button">
          {isRunning ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Procesando…
            </span>
          ) : (
            "Poblar base de datos"
          )}
        </Button>

        {badgeLabel && (
          <Badge variant={badgeVariant}>{badgeLabel}</Badge>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {validSymbols.length > 0 && !status?.running && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium">Símbolos procesados:</span>{" "}
          {validSymbols.join(", ")}
        </p>
      )}
    </div>
  );
}
