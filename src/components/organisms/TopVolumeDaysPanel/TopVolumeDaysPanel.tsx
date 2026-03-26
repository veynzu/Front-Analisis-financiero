"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { getTopVolumeDays } from "@/lib/api";
import type { TopVolumeDay } from "@/lib/types";

export function TopVolumeDaysPanel() {
  const [days, setDays] = useState<TopVolumeDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTopVolumeDays();
      setDays(data);
      setFetched(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Top volumen — 15 días principales
        </h2>
        <Button variant="ghost" onClick={handleFetch} disabled={loading} type="button">
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Ejecutando…
            </span>
          ) : (
            "Ejecutar análisis"
          )}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {fetched && days.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  #
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Fecha
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Activo
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Símbolo
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Volumen
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Apertura
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Máximo
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Mínimo
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Cierre
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-black">
              {days.map((row, i) => (
                <tr
                  key={row.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                    {i + 1}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                    {row.date}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                    {row.active.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                    {row.active.symbol}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                    {row.volume.toLocaleString("es-CO")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                    {row.open.toFixed(4)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-emerald-600 dark:text-emerald-400">
                    {row.high.toFixed(4)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-red-600 dark:text-red-400">
                    {row.low.toFixed(4)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                    {row.close.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {fetched && days.length === 0
              ? "El servidor no devolvió registros."
              : 'Presiona "Ejecutar análisis" para cargar los 15 días con mayor volumen.'}
          </p>
        )
      )}
    </div>
  );
}
