"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { AlgorithmChart } from "@/components/molecules/AlgorithmChart";
import { getSortingResults } from "@/lib/api";
import type { SortResult } from "@/lib/types";

const ALGORITHM_NAMES = [
  "TimSort",
  "Comb Sort",
  "Selection Sort",
  "Tree Sort",
  "Pigeonhole Sort",
  "BucketSort",
  "QuickSort",
  "HeapSort",
  "Bitonic Sort",
  "Gnome Sort",
  "Binary Insertion Sort",
  "RadixSort",
];

function findResult(results: SortResult[], name: string): SortResult | undefined {
  const normalized = name.toLowerCase().replace(/\s+/g, "");
  return results.find(
    (r) => r.algorithmName.toLowerCase().replace(/\s+/g, "") === normalized,
  );
}

export function SortingPanel() {
  const [results, setResults] = useState<SortResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSortingResults();
      setResults(data);
      setFetched(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado + botón */}
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Tabla 1. Análisis de datos enteros
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

      {/* Layout: tabla izquierda | gráfica derecha */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        {/* Tabla */}
        <div className="min-w-0 xl:w-[480px] xl:shrink-0">
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Método de ordenamiento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Tamaño
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Tiempo (ms)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-black">
                {ALGORITHM_NAMES.map((name, i) => {
                  const r = findResult(results, name);
                  return (
                    <tr
                      key={name}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {i + 1}. {name}
                        {r ? (
                          <span className="ml-2 text-xs font-normal text-zinc-400">
                            {r.bigOComplexity}
                          </span>
                        ) : (
                          <span className="ml-2 text-xs font-normal text-zinc-300 dark:text-zinc-600">
                            O(…)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {r ? r.size.toLocaleString("es-CO") : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {r ? r.timeInMilliseconds.toFixed(4) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráfica */}
        <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          {fetched && results.length > 0 ? (
            <AlgorithmChart results={results} />
          ) : (
            <div className="flex min-h-[360px] items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
              {loading
                ? "Calculando tiempos…"
                : "La gráfica aparecerá luego de ejecutar el análisis"}
            </div>
          )}
        </div>
      </div>

      {!fetched && !loading && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Presiona &quot;Ejecutar análisis&quot; para obtener los tiempos de
          ejecución desde el backend.
        </p>
      )}
    </div>
  );
}
