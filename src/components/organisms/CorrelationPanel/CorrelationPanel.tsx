"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { getCorrelationMatrix } from "@/lib/api";
import type { CorrelationField, CorrelationMatrixResponse } from "@/lib/types";

const FIELD_OPTIONS: { value: CorrelationField; label: string }[] = [
  { value: "close", label: "Cierre (close)" },
  { value: "open", label: "Apertura (open)" },
  { value: "high", label: "Máximo (high)" },
  { value: "low", label: "Mínimo (low)" },
  { value: "volume", label: "Volumen (volume)" },
];

// Escala diverging: rojo (-1) → blanco (0) → verde (+1)
function correlationColor(value: number): string {
  const v = Math.max(-1, Math.min(1, value));
  if (v >= 0) {
    const t = v;
    const r = Math.round(255 - (255 - 22) * t);
    const g = Math.round(255 - (255 - 163) * t);
    const b = Math.round(255 - (255 - 74) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const t = -v;
  const r = Math.round(255 - (255 - 220) * t);
  const g = Math.round(255 - (255 - 38) * t);
  const b = Math.round(255 - (255 - 38) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function textColorFor(value: number): string {
  return Math.abs(value) > 0.5 ? "#ffffff" : "#18181b";
}

type Hover = { row: number; col: number; value: number | null; x: number; y: number } | null;

function Heatmap({ data }: { data: CorrelationMatrixResponse }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover>(null);

  const n = data.labels.length;
  const cellSize = Math.max(24, Math.min(40, Math.floor(640 / Math.max(n, 1))));

  return (
    <div className="overflow-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
      <div ref={containerRef} className="relative inline-block">
        <table
          className="border-collapse text-xs"
          onMouseLeave={() => setHover(null)}
        >
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white p-1 dark:bg-black" />
              {data.labels.map((lbl) => (
                <th
                  key={lbl}
                  className="px-1 py-2 text-zinc-600 dark:text-zinc-400"
                  style={{
                    minWidth: cellSize,
                    fontSize: 10,
                  }}
                >
                  <div
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lbl}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row, i) => (
              <tr key={`row-${i}`}>
                <td
                  className="sticky left-0 z-10 bg-white px-2 text-right font-medium text-zinc-700 dark:bg-black dark:text-zinc-300"
                  style={{ fontSize: 10 }}
                >
                  {data.labels[i]}
                </td>
                {row.map((value, j) => {
                  const v = value ?? 0;
                  const isNull = value === null;
                  return (
                    <td
                      key={`${i}-${j}`}
                      onMouseEnter={(e) => {
                        const containerRect =
                          containerRef.current?.getBoundingClientRect();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHover({
                          row: i,
                          col: j,
                          value: value,
                          x: rect.left - (containerRect?.left ?? 0) + rect.width / 2,
                          y: rect.top - (containerRect?.top ?? 0),
                        });
                      }}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: isNull ? "#f4f4f5" : correlationColor(v),
                        color: isNull ? "#a1a1aa" : textColorFor(v),
                        fontWeight: 500,
                        textAlign: "center",
                        cursor: "default",
                      }}
                    >
                      {isNull ? "—" : v.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {hover && (
          <div
            className="pointer-events-none absolute z-20 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 shadow-md dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
            style={{
              left: hover.x,
              top: Math.max(0, hover.y - 36),
              transform: "translateX(-50%)",
            }}
          >
            <span className="font-medium">{data.labels[hover.row]}</span> ·{" "}
            <span className="font-medium">{data.labels[hover.col]}</span>:{" "}
            <span className="font-semibold">
              {hover.value === null ? "sin datos comunes" : hover.value.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>-1</span>
        <div
          className="h-2 flex-1 rounded-full"
          style={{
            background:
              "linear-gradient(to right, rgb(220,38,38), rgb(255,255,255), rgb(22,163,74))",
            maxWidth: 360,
          }}
        />
        <span>+1</span>
        <span className="ml-3">Pearson · diverging</span>
      </div>
    </div>
  );
}

export function CorrelationPanel() {
  const [field, setField] = useState<CorrelationField>("close");
  const [data, setData] = useState<CorrelationMatrixResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await getCorrelationMatrix(field);
      setData(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Matriz de correlación
        </h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Campo
          </label>
          <select
            value={field}
            onChange={(e) => setField(e.target.value as CorrelationField)}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-black dark:text-zinc-100"
          >
            {FIELD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <Button variant="ghost" onClick={handleFetch} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Calculando…
            </span>
          ) : (
            "Recalcular"
          )}
        </Button>

        {data && (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-zinc-500 dark:text-zinc-400">
              Tiempo de cálculo:
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {data.executionTime} ms
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Coeficiente de correlación de Pearson par a par entre todos los
        activos del portafolio, alineado por fechas comunes. Los pares sin
        fechas comunes aparecen como &quot;—&quot;.
      </p>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {loading && !data && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {data && <Heatmap data={data} />}
    </div>
  );
}
