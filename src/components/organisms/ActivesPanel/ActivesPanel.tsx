"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/atoms/Spinner";
import { getActives, getActivePrices } from "@/lib/api";
import type { Active, Price } from "@/lib/types";

const PRICE_COLUMNS: { key: keyof Price; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "date", label: "Fecha" },
  { key: "open", label: "Apertura" },
  { key: "close", label: "Cierre" },
  { key: "high", label: "Máximo" },
  { key: "low", label: "Mínimo" },
  { key: "volume", label: "Volumen" },
];

function formatValue(key: keyof Price, value: number | string): string {
  if (key === "date") return String(value);
  if (key === "volume") return Number(value).toLocaleString("es-CO");
  if (key === "id") return String(value);
  return Number(value).toFixed(4);
}

export function ActivesPanel() {
  const [actives, setActives] = useState<Active[]>([]);
  const [selected, setSelected] = useState<Active | null>(null);
  const [prices, setPrices] = useState<Price[]>([]);
  const [loadingActives, setLoadingActives] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActives()
      .then((data) => setActives(data.actives))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingActives(false));
  }, []);

  const handleSelect = async (active: Active) => {
    if (selected?.id === active.id) return;
    setSelected(active);
    setLoadingPrices(true);
    setPrices([]);
    try {
      const data = await getActivePrices(active.id);
      setPrices(data.prices);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingPrices(false);
    }
  };

  if (loadingActives) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </p>
    );
  }

  return (
    <div className="flex gap-5 min-h-[480px]">
      {/* Lista de activos */}
      <aside className="w-60 shrink-0">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {actives.length} activos
        </p>
        <ul className="flex flex-col gap-0.5">
          {actives.map((active) => {
            const isSelected = selected?.id === active.id;
            return (
              <li key={active.id}>
                <button
                  onClick={() => handleSelect(active)}
                  className={`group w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="font-semibold">{active.symbol}</span>
                  <span
                    className={`ml-2 text-xs ${
                      isSelected
                        ? "text-zinc-300 dark:text-zinc-600"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {active.name}
                  </span>
                  <span
                    className={`ml-1 text-xs ${
                      isSelected ? "opacity-70" : "text-zinc-400"
                    }`}
                  >
                    ({active.priceCount})
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Tabla de precios */}
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800">
            Selecciona un activo para ver sus precios
          </div>
        ) : loadingPrices ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {selected.name}
              </h2>
              <p className="text-xs text-zinc-400">
                {selected.symbol} · {prices.length} registros
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    {PRICE_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      ID Activo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-black">
                  {prices.map((price) => (
                    <tr
                      key={price.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                    >
                      {PRICE_COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className={`whitespace-nowrap px-4 py-2.5 ${
                            col.key === "high"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : col.key === "low"
                                ? "text-red-600 dark:text-red-400"
                                : col.key === "date"
                                  ? "font-medium text-zinc-900 dark:text-zinc-100"
                                  : "text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {formatValue(col.key, price[col.key])}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-400">
                        {selected.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
