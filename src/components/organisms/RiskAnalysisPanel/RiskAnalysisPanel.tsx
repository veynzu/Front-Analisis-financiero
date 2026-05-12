"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import {
  getActives,
  getAllPatterns,
  getPatternsByActive,
  getRiskRanking,
} from "@/lib/api";
import type {
  Active,
  PatternResult,
  RiskCategory,
  VolatilityRankingResponse,
} from "@/lib/types";

type SubView = "ranking" | "patterns";

const RISK_BADGE: Record<RiskCategory, { variant: "success" | "warning" | "error"; label: string }> = {
  CONSERVADOR: { variant: "success", label: "Conservador" },
  MODERADO: { variant: "warning", label: "Moderado" },
  AGRESIVO: { variant: "error", label: "Agresivo" },
};

const TAB_BTN =
  "rounded-lg px-4 py-2 text-sm font-medium transition-colors";
const TAB_ACTIVE = "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900";
const TAB_INACTIVE =
  "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800";

function formatPct(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function RiskRankingView() {
  const [data, setData] = useState<VolatilityRankingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await getRiskRanking();
      setData(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Ranking de riesgo del portafolio
        </h3>
        <Button variant="ghost" onClick={handleFetch} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Calculando…
            </span>
          ) : (
            "Calcular ranking"
          )}
        </Button>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Ordena los activos por volatilidad histórica anualizada
        (σ_diaria × √252) calculada sobre los retornos logarítmicos. El
        ordenamiento se hace en el backend con un QuickSort manual.
      </p>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(data.categoryDistribution) as RiskCategory[]).map(
              (cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <Badge variant={RISK_BADGE[cat].variant}>
                    {RISK_BADGE[cat].label}
                  </Badge>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {data.categoryDistribution[cat]}
                  </span>
                </div>
              ),
            )}
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-zinc-500 dark:text-zinc-400">Total:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {data.totalActives}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Símbolo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    μ diaria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    σ diaria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    σ anual
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Datos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-black">
                {data.ranking.map((row, i) => (
                  <tr
                    key={row.activeSymbol}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
                      {i + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                      {row.activeSymbol}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                      {row.activeName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                      {formatPct(row.meanDailyReturn, 4)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                      {formatPct(row.standardDeviation, 4)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                      {formatPct(row.historicalVolatility)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <Badge variant={RISK_BADGE[row.riskCategory].variant}>
                        {RISK_BADGE[row.riskCategory].label}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-zinc-400">
                      {row.dataPointsUsed.toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Presiona &quot;Calcular ranking&quot; para obtener el listado
          ordenado por volatilidad anualizada.
        </p>
      )}
    </div>
  );
}

function PatternsView({ actives }: { actives: Active[] }) {
  const [scope, setScope] = useState<"single" | "all">("single");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState(10);
  const [results, setResults] = useState<PatternResult[]>([]);
  const [allResults, setAllResults] = useState<Record<string, PatternResult[]> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    if (actives.length > 0 && activeId === null) {
      setActiveId(actives[0].id);
    }
  }, [actives, activeId]);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setAllResults(null);
    setExpandedKey(null);
    try {
      if (scope === "single" && activeId !== null) {
        const data = await getPatternsByActive(activeId, windowSize);
        setResults(data);
      } else if (scope === "all") {
        const data = await getAllPatterns(windowSize);
        setAllResults(data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Patrones por ventana deslizante
      </h3>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Detecta dos patrones formalizados —{" "}
        <strong>Bullish Streak</strong> (≥3 días consecutivos al alza dentro
        de la ventana) y <strong>Volume Spike Reversal</strong> (volumen ≥
        2× promedio de la ventana acompañado de reversión de tendencia) —
        recorriendo la serie con una ventana fija. Complejidad O(n·w).
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Alcance
          </label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as "single" | "all")}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-black dark:text-zinc-100"
          >
            <option value="single">Un activo</option>
            <option value="all">Todo el portafolio</option>
          </select>
        </div>

        {scope === "single" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Activo
            </label>
            <select
              value={activeId ?? ""}
              onChange={(e) => setActiveId(Number(e.target.value))}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-black dark:text-zinc-100"
            >
              {actives.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.symbol} — {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Tamaño de ventana
          </label>
          <select
            value={windowSize}
            onChange={(e) => setWindowSize(Number(e.target.value))}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-black dark:text-zinc-100"
          >
            <option value={5}>5 (semana)</option>
            <option value={10}>10 (bisemanal)</option>
            <option value={20}>20 (mes)</option>
            <option value={60}>60 (trimestre)</option>
          </select>
        </div>

        <Button onClick={handleFetch} disabled={loading} variant="primary">
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Analizando…
            </span>
          ) : (
            "Detectar patrones"
          )}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {scope === "single" && results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((p) => {
            const key = `${p.activeSymbol}-${p.patternName}`;
            const isOpen = expandedKey === key;
            return (
              <div
                key={key}
                className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {p.patternName}
                    </span>
                    <span className="max-w-2xl text-xs text-zinc-500 dark:text-zinc-400">
                      {p.patternDescription}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Frecuencia
                      </div>
                      <div className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {p.frequencyPercentage.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Ocurrencias / ventanas
                      </div>
                      <div className="font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">
                        {p.patternOccurrences.toLocaleString("es-CO")} /{" "}
                        {p.totalWindows.toLocaleString("es-CO")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedKey(isOpen ? null : key)}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      {isOpen ? "Ocultar fechas" : "Ver fechas"}
                    </button>
                  </div>
                </div>
                {isOpen && p.occurrenceDates.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border-t border-zinc-100 px-4 py-3 dark:border-zinc-900">
                    <div className="flex flex-wrap gap-1.5">
                      {p.occurrenceDates.map((d) => (
                        <span
                          key={d}
                          className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {isOpen && p.occurrenceDates.length === 0 && (
                  <div className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-400 dark:border-zinc-900">
                    No se detectaron ocurrencias del patrón.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {scope === "all" && allResults && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Símbolo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Patrón
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Frecuencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Ocurrencias
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Ventanas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-black">
              {Object.entries(allResults).flatMap(([symbol, list]) =>
                list.map((p) => (
                  <tr
                    key={`${symbol}-${p.patternName}`}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                      {symbol}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                      {p.patternName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                      {p.frequencyPercentage.toFixed(2)}%
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                      {p.patternOccurrences.toLocaleString("es-CO")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                      {p.totalWindows.toLocaleString("es-CO")}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function RiskAnalysisPanel() {
  const [actives, setActives] = useState<Active[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<SubView>("ranking");

  useEffect(() => {
    getActives()
      .then((data) => setActives(data.actives))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ranking", "Ranking de riesgo"],
            ["patterns", "Patrones (sliding window)"],
          ] as [SubView, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`${TAB_BTN} ${view === key ? TAB_ACTIVE : TAB_INACTIVE}`}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {view === "ranking" && <RiskRankingView />}
      {view === "patterns" && <PatternsView actives={actives} />}
    </div>
  );
}
