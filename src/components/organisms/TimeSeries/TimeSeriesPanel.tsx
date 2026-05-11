"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { Line, Bar, Scatter } from "react-chartjs-2";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { getActives, getTimeSeriesSimilarity } from "@/lib/api";
import type {
  Active,
  TimeSeriesField,
  TimeSeriesSimilarityResponse,
  WarpingPathPoint,
} from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const FIELD_OPTIONS: { value: TimeSeriesField; label: string }[] = [
  { value: "close", label: "Cierre (close)" },
  { value: "open", label: "Apertura (open)" },
  { value: "high", label: "Máximo (high)" },
  { value: "low", label: "Mínimo (low)" },
  { value: "volume", label: "Volumen (volume)" },
];

const FIELD_LABELS: Record<TimeSeriesField, string> = {
  close: "Precio de cierre",
  open: "Precio de apertura",
  high: "Máximo",
  low: "Mínimo",
  volume: "Volumen",
};

type ChartTab = "price" | "distance" | "dtw" | "pearson" | "cosine";

function buildPriceData(result: TimeSeriesSimilarityResponse, active1: Active | null, active2: Active | null) {
  const first = result.firstActivePriceData ?? [];
  const second = result.secondActivePriceData ?? [];

  const dateSet = new Set<string>();
  first.forEach((d) => dateSet.add(d.date));
  second.forEach((d) => dateSet.add(d.date));
  const dates = Array.from(dateSet).sort();

  const firstMap = new Map(first.map((d) => [d.date, d.valueObtained]));
  const secondMap = new Map(second.map((d) => [d.date, d.valueObtained]));

  return {
    labels: dates,
    datasets: [
      {
        label: active1 ? `${active1.symbol} — ${active1.name}` : "Activo 1",
        data: dates.map((d) => firstMap.get(d) ?? null),
        borderColor: "rgba(99, 102, 241, 0.9)",
        backgroundColor: "rgba(99, 102, 241, 0.15)",
        pointBackgroundColor: "rgba(99, 102, 241, 1)",
        pointRadius: 2,
        borderWidth: 2,
        tension: 0.1,
        fill: false,
      },
      {
        label: active2 ? `${active2.symbol} — ${active2.name}` : "Activo 2",
        data: dates.map((d) => secondMap.get(d) ?? null),
        borderColor: "rgba(16, 185, 129, 0.9)",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        pointBackgroundColor: "rgba(16, 185, 129, 1)",
        pointRadius: 2,
        borderWidth: 2,
        tension: 0.1,
        fill: false,
      },
    ],
  };
}

function buildDistanceData(result: TimeSeriesSimilarityResponse) {
  const list = result.euclidean?.distanceList ?? [];
  return {
    labels: list.map((d) => d.date),
    datasets: [
      {
        label: "Distancia euclídeana",
        data: list.map((d) => d.distance),
        backgroundColor: "rgba(139, 92, 246, 0.7)",
        borderColor: "rgba(139, 92, 246, 1)",
        borderWidth: 1,
        borderRadius: 3,
        borderSkipped: false as const,
      },
    ],
  };
}

function WarpingPathChart({
  firstDates,
  secondDates,
  warpingPath,
  firstActive,
  secondActive,
}: {
  firstDates: string[];
  secondDates: string[];
  warpingPath: WarpingPathPoint[];
  firstActive: Active | null;
  secondActive: Active | null;
}) {
  const maxDim = Math.max(firstDates.length, secondDates.length);

  const pathData = warpingPath
    .map((p) => ({
      x: firstDates.indexOf(p.dateX),
      y: secondDates.indexOf(p.dateY),
    }))
    .filter((p) => p.x !== -1 && p.y !== -1);

  const diagonal = Array.from({ length: maxDim }, (_, i) => ({ x: i, y: i }));

  return (
    <div style={{ height: 500 }}>
      <Scatter
        data={{
          datasets: [
            {
              label: "Diagonal (referencia)",
              data: diagonal,
              showLine: true,
              borderColor: "rgba(0, 0, 0, 0.15)",
              borderWidth: 1,
              borderDash: [4, 4] as unknown as number[],
              pointRadius: 0,
              pointHoverRadius: 0,
            },
            {
              label: "Warping path",
              data: pathData,
              showLine: true,
              borderColor: "#ef4444",
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 3,
              backgroundColor: "#ef4444",
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: false as const,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "Ruta de alineación (Warping Path)",
              font: { size: 13, weight: "bold" },
              color: "#71717a",
              padding: { bottom: 16 },
            },
            tooltip: {
              callbacks: {
                title() { return ""; },
                label(ctx: { parsed: { x: number | null; y: number | null } }) {
                  const ix = Math.round(ctx.parsed.x ?? 0);
                  const iy = Math.round(ctx.parsed.y ?? 0);
                  const dx = firstDates[ix] ?? `#${ix}`;
                  const dy = secondDates[iy] ?? `#${iy}`;
                  return `${dx} → ${dy}`;
                },
              },
            },
          },
          scales: {
            x: {
              type: "linear",
              offset: false,
              min: -0.5,
              max: maxDim - 0.5,
              title: {
                display: true,
                text: firstActive ? `${firstActive.symbol} (índice)` : "Primer activo",
                color: "#a1a1aa",
                font: { size: 11 },
              },
              ticks: {
                color: "#71717a",
                font: { size: 8 },
                maxTicksLimit: 15,
                callback(this: { getLabelForValue: (v: number) => string }, value: string | number) {
                  const idx = Math.round(Number(value));
                  const lbl = firstDates[idx];
                  return lbl && lbl.length >= 10 ? lbl.slice(5) : (lbl ?? "");
                },
              },
              grid: { display: false },
            },
            y: {
              type: "linear",
              offset: false,
              reverse: true,
              min: -0.5,
              max: maxDim - 0.5,
              title: {
                display: true,
                text: secondActive ? `${secondActive.symbol} (índice)` : "Segundo activo",
                color: "#a1a1aa",
                font: { size: 11 },
              },
              ticks: {
                color: "#71717a",
                font: { size: 8 },
                maxTicksLimit: 15,
                callback(this: { getLabelForValue: (v: number) => string }, value: string | number) {
                  const idx = Math.round(Number(value));
                  const lbl = secondDates[idx];
                  return lbl && lbl.length >= 10 ? lbl.slice(5) : (lbl ?? "");
                },
              },
              grid: { display: false },
            },
          },
        }}
      />
    </div>
  );
}

function CostTableCanvas({
  costTable,
  firstDates,
  secondDates,
  maxCost,
  warpingPath,
}: {
  costTable: (number | "Infinity")[][];
  firstDates: string[];
  secondDates: string[];
  maxCost: number;
  warpingPath?: WarpingPathPoint[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{
    row: number;
    col: number;
    value: number | "Infinity";
    x: number;
    y: number;
  } | null>(null);

  const numCols = firstDates.length;
  const numRows = secondDates.length;

  const ML = 80; const MB = 36; const MT = 12; const MR = 12;
  const X_STEP = Math.max(1, Math.floor(numCols / 8));
  const Y_STEP = Math.max(1, Math.floor(numRows / 8));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const totalW = numCols + ML + MR;
    const totalH = numRows + MT + MB;
    canvas.width = totalW;
    canvas.height = totalH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, totalW, totalH);

    const imageData = ctx.createImageData(numCols, numRows);
    const px = imageData.data;
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const val = costTable[col][row];
        const idx = (row * numCols + col) * 4;
        if (val === "Infinity") {
          px[idx] = 235; px[idx + 1] = 235; px[idx + 2] = 235; px[idx + 3] = 255;
        } else {
          const ratio = maxCost > 0 ? val / maxCost : 0;
          px[idx] = Math.round(ratio * 220 + 35);
          px[idx + 1] = Math.round((1 - ratio) * 180 + 50);
          px[idx + 2] = 80;
          px[idx + 3] = 217;
        }
      }
    }
    ctx.putImageData(imageData, ML, MT);

    if (warpingPath && warpingPath.length > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (const { dateX, dateY } of warpingPath) {
        const col = firstDates.indexOf(dateX);
        const row = secondDates.indexOf(dateY);
        if (col === -1 || row === -1) continue;
        const x = ML + col;
        const y = MT + row;
        if (!started) { ctx.moveTo(x, y); started = true; }
        else { ctx.lineTo(x, y); }
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = "#52525b";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let col = 0; col < numCols; col += X_STEP) {
      const lbl = firstDates[col];
      ctx.fillText(lbl.length >= 10 ? lbl.slice(5) : lbl, ML + col, MT + numRows + 4);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let row = 0; row < numRows; row += Y_STEP) {
      const lbl = secondDates[row];
      ctx.fillText(lbl.length >= 10 ? lbl.slice(5) : lbl, ML - 6, MT + row);
    }

    ctx.fillStyle = "#71717a";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Primer activo", ML + numCols / 2, MT + numRows + 20);

    ctx.save();
    ctx.translate(14, MT + numRows / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("Segundo activo", 0, 0);
    ctx.restore();
    ctx.restore();
  }, [costTable, firstDates, secondDates, maxCost, numCols, numRows, warpingPath]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const col = Math.floor((e.clientX - rect.left) * scaleX - ML);
    const row = Math.floor((e.clientY - rect.top) * scaleY - MT);
    if (row < 0 || row >= numRows || col < 0 || col >= numCols) { setTooltip(null); return; }
    setTooltip({
      row, col,
      value: costTable[col][row],
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        className="w-full rounded"
        style={{ imageRendering: "pixelated", display: "block", maxHeight: 500 }}
      />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 shadow-md dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
          style={{
            left: Math.min(tooltip.x + 12, window.innerWidth - 300),
            top: Math.max(tooltip.y - 32, 4),
          }}
        >
          <span className="font-medium">{firstDates[tooltip.col]}</span>
          {" → "}
          <span className="font-medium">{secondDates[tooltip.row]}</span>
          {"  ·  "}
          <span className="font-semibold">
            {tooltip.value === "Infinity" ? "Infinity" : tooltip.value.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}

export function TimeSeriesPanel() {
  const [actives, setActives] = useState<Active[]>([]);
  const [firstActiveId, setFirstActiveId] = useState<number | null>(null);
  const [secondActiveId, setSecondActiveId] = useState<number | null>(null);
  const [field, setField] = useState<TimeSeriesField>("low");
  const [result, setResult] = useState<TimeSeriesSimilarityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartTab, setChartTab] = useState<ChartTab>("price");

  useEffect(() => {
    import("chartjs-plugin-zoom").then((mod) => ChartJS.register(mod.default));
  }, []);

  const firstActive = actives.find((a) => a.id === firstActiveId) ?? null;
  const secondActive = actives.find((a) => a.id === secondActiveId) ?? null;

  useEffect(() => {
    getActives()
      .then((data) => {
        setActives(data.actives);
        if (data.actives.length > 0) {
          setFirstActiveId(data.actives[0].id);
          setSecondActiveId(data.actives[0].id);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const handleFetch = async () => {
    if (firstActiveId === null || secondActiveId === null) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getTimeSeriesSimilarity(firstActiveId, secondActiveId, field);
      setResult(data);
      setFetched(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const priceData = result ? buildPriceData(result, firstActive, secondActive) : null;
  const distanceData = result ? buildDistanceData(result) : null;
  const executionTime = result?.euclidean?.executionTime;

  const warpingPath = useMemo(
    () => result?.dtw?.warpingPath ?? [],
    [result?.dtw?.warpingPath],
  );

  const priceZoomOptions = {
    zoom: {
      wheel: { enabled: true },
      drag: {
        enabled: true,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderColor: "rgba(99, 102, 241, 0.6)",
        borderWidth: 1,
      },
      pinch: { enabled: true },
      mode: "xy" as const,
    },
    pan: {
      enabled: true,
      mode: "xy" as const,
    },
  };

  const TAB_BTN = "rounded-lg px-4 py-2 text-sm font-medium transition-colors";
  const TAB_ACTIVE = "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900";
  const TAB_INACTIVE = "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800";

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Similitud en series de tiempo
      </h2>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Primer activo
          </label>
          <select
            value={firstActiveId ?? ""}
            onChange={(e) => setFirstActiveId(Number(e.target.value))}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-black dark:text-zinc-100"
          >
            {actives.map((a) => (
              <option key={a.id} value={a.id}>
                {a.symbol} — {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Segundo activo
          </label>
          <select
            value={secondActiveId ?? ""}
            onChange={(e) => setSecondActiveId(Number(e.target.value))}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-black dark:text-zinc-100"
          >
            {actives.map((a) => (
              <option key={a.id} value={a.id}>
                {a.symbol} — {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Campo a evaluar
          </label>
          <select
            value={field}
            onChange={(e) => setField(e.target.value as TimeSeriesField)}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-black dark:text-zinc-100"
          >
            {FIELD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="primary"
          onClick={handleFetch}
          disabled={loading || firstActiveId === null || secondActiveId === null}
          type="button"
        >
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

      {fetched && result && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {([
              ["price", "Series de precio"],
              ["distance", "Distancia euclídeana"],
              ["dtw", "Dynamic Time Warping"],
              ["pearson", "Correlación de Pearson"],
              ["cosine", "Similitud de cosenos"],
            ] as [ChartTab, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${TAB_BTN} ${chartTab === key ? TAB_ACTIVE : TAB_INACTIVE}`}
                onClick={() => setChartTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {chartTab === "price" && priceData && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black" style={{ height: 500 }}>
              <Line
                data={priceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                      labels: {
                        font: { size: 12 },
                        color: "#71717a",
                        usePointStyle: true,
                        padding: 16,
                      },
                    },
                    title: {
                      display: true,
                      text: `Comparación — ${FIELD_LABELS[field]}`,
                      font: { size: 13, weight: "bold" },
                      color: "#71717a",
                      padding: { bottom: 16 },
                    },
                    tooltip: {
                      callbacks: {
                        label: (ctx: TooltipItem<"line">) =>
                          `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(4)}`,
                      },
                    },
                    zoom: priceZoomOptions,
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: "Fecha",
                        color: "#a1a1aa",
                        font: { size: 11 },
                      },
                      ticks: {
                        color: "#71717a",
                        font: { size: 10 },
                        maxRotation: 45,
                        maxTicksLimit: 20,
                      },
                      grid: { display: false },
                    },
                    y: {
                      title: {
                        display: true,
                        text: FIELD_LABELS[field],
                        color: "#a1a1aa",
                        font: { size: 11 },
                      },
                      ticks: {
                        color: "#71717a",
                        font: { size: 10 },
                      },
                      grid: { color: "rgba(113, 113, 122, 0.15)" },
                      beginAtZero: field === "volume",
                    },
                  },
                }}
              />
            </div>
          )}

          {chartTab === "distance" && distanceData && (
            <div className="flex flex-col gap-4">
              {executionTime !== undefined && (
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-zinc-500 dark:text-zinc-400">Tiempo de ejecución:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {executionTime.toFixed(2)} ms
                  </span>
                </div>
              )}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black" style={{ height: 500 }}>
                <Bar
                  data={distanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      title: {
                        display: true,
                        text: "Distancia euclídeana por fecha",
                        font: { size: 13, weight: "bold" },
                        color: "#71717a",
                        padding: { bottom: 16 },
                      },
                      tooltip: {
                        callbacks: {
                          label: (ctx: TooltipItem<"bar">) =>
                            `Distancia: ${(ctx.parsed.y ?? 0).toFixed(4)}`,
                        },
                      },
                      zoom: priceZoomOptions,
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: "Fecha",
                          color: "#a1a1aa",
                          font: { size: 11 },
                        },
                        ticks: {
                          color: "#71717a",
                          font: { size: 10 },
                          maxRotation: 45,
                          maxTicksLimit: 20,
                        },
                        grid: { display: false },
                      },
                      y: {
                        title: {
                          display: true,
                          text: "Distancia",
                          color: "#a1a1aa",
                          font: { size: 11 },
                        },
                        ticks: {
                          color: "#71717a",
                          font: { size: 10 },
                        },
                        grid: { color: "rgba(113, 113, 122, 0.15)" },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {chartTab === "pearson" && result.pearson && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-zinc-500 dark:text-zinc-400">Tiempo de ejecución:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {result.pearson.executionTime.toFixed(2)} ms
                </span>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
                <div className="flex flex-col items-center gap-4">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Coeficiente de correlación de Pearson
                  </span>

                  <span
                    className="text-7xl font-bold tabular-nums"
                    style={{
                      color:
                        result.pearson.coefficient >= 0.7
                          ? "#16a34a"
                          : result.pearson.coefficient >= 0.5
                            ? "#65a30d"
                            : result.pearson.coefficient >= 0.3
                              ? "#ca8a04"
                              : result.pearson.coefficient > 0
                                ? "#ea580c"
                                : result.pearson.coefficient === 0
                                  ? "#71717a"
                                  : result.pearson.coefficient >= -0.3
                                    ? "#ea580c"
                                    : result.pearson.coefficient >= -0.5
                                      ? "#ca8a04"
                                      : result.pearson.coefficient >= -0.7
                                        ? "#65a30d"
                                        : "#16a34a",
                    }}
                  >
                    {result.pearson.coefficient.toFixed(4)}
                  </span>

                  <span
                    className="rounded-full px-4 py-1 text-sm font-medium"
                    style={{
                      backgroundColor:
                        result.pearson.coefficient >= 0.7
                          ? "rgba(22, 163, 74, 0.12)"
                          : result.pearson.coefficient >= 0.5
                            ? "rgba(101, 163, 13, 0.12)"
                            : result.pearson.coefficient >= 0.3
                              ? "rgba(202, 138, 4, 0.12)"
                              : result.pearson.coefficient > 0
                                ? "rgba(234, 88, 12, 0.12)"
                                : result.pearson.coefficient === 0
                                  ? "rgba(113, 113, 122, 0.12)"
                                  : result.pearson.coefficient >= -0.3
                                    ? "rgba(234, 88, 12, 0.12)"
                                    : result.pearson.coefficient >= -0.5
                                      ? "rgba(202, 138, 4, 0.12)"
                                      : result.pearson.coefficient >= -0.7
                                        ? "rgba(101, 163, 13, 0.12)"
                                        : "rgba(22, 163, 74, 0.12)",
                      color:
                        result.pearson.coefficient >= 0.7
                          ? "#16a34a"
                          : result.pearson.coefficient >= 0.5
                            ? "#65a30d"
                            : result.pearson.coefficient >= 0.3
                              ? "#ca8a04"
                              : result.pearson.coefficient > 0
                                ? "#ea580c"
                                : result.pearson.coefficient === 0
                                  ? "#71717a"
                                  : result.pearson.coefficient >= -0.3
                                    ? "#ea580c"
                                    : result.pearson.coefficient >= -0.5
                                      ? "#ca8a04"
                                      : result.pearson.coefficient >= -0.7
                                        ? "#65a30d"
                                        : "#16a34a",
                    }}
                  >
                    {result.pearson.description}
                  </span>

                  {/* Visual bar: -1 to 1 */}
                  <div className="mt-2 w-full max-w-md">
                    <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-red-400 via-zinc-200 to-green-400">
                      <div
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
                        style={{
                          left: `${((result.pearson.coefficient + 1) / 2) * 100}%`,
                          backgroundColor:
                            result.pearson.coefficient >= 0.7
                              ? "#16a34a"
                              : result.pearson.coefficient >= 0.5
                                ? "#65a30d"
                                : result.pearson.coefficient >= 0.3
                                  ? "#ca8a04"
                                  : result.pearson.coefficient > 0
                                    ? "#ea580c"
                                    : result.pearson.coefficient === 0
                                      ? "#71717a"
                                      : result.pearson.coefficient >= -0.3
                                        ? "#ea580c"
                                        : result.pearson.coefficient >= -0.5
                                          ? "#ca8a04"
                                          : result.pearson.coefficient >= -0.7
                                            ? "#65a30d"
                                            : "#16a34a",
                        }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-zinc-400">
                      <span>-1</span>
                      <span>0</span>
                      <span>+1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {chartTab === "cosine" && result.cosine && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-zinc-500 dark:text-zinc-400">Tiempo de ejecución:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {result.cosine.executionTimeMs.toFixed(2)} ms
                </span>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
                <div className="flex flex-col items-center gap-4">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Similitud de cosenos
                  </span>

                  <span
                    className="text-7xl font-bold tabular-nums"
                    style={{
                      color:
                        result.cosine.similarity >= 0.7
                          ? "#16a34a"
                          : result.cosine.similarity >= 0.5
                            ? "#65a30d"
                            : result.cosine.similarity >= 0.3
                              ? "#ca8a04"
                              : result.cosine.similarity > 0
                                ? "#ea580c"
                                : result.cosine.similarity === 0
                                  ? "#71717a"
                                  : result.cosine.similarity >= -0.3
                                    ? "#ea580c"
                                    : result.cosine.similarity >= -0.5
                                      ? "#ca8a04"
                                      : result.cosine.similarity >= -0.7
                                        ? "#65a30d"
                                        : "#16a34a",
                    }}
                  >
                    {result.cosine.similarity.toFixed(4)}
                  </span>

                  <span
                    className="rounded-full px-4 py-1 text-sm font-medium"
                    style={{
                      backgroundColor:
                        result.cosine.similarity >= 0.7
                          ? "rgba(22, 163, 74, 0.12)"
                          : result.cosine.similarity >= 0.5
                            ? "rgba(101, 163, 13, 0.12)"
                            : result.cosine.similarity >= 0.3
                              ? "rgba(202, 138, 4, 0.12)"
                              : result.cosine.similarity > 0
                                ? "rgba(234, 88, 12, 0.12)"
                                : result.cosine.similarity === 0
                                  ? "rgba(113, 113, 122, 0.12)"
                                  : result.cosine.similarity >= -0.3
                                    ? "rgba(234, 88, 12, 0.12)"
                                    : result.cosine.similarity >= -0.5
                                      ? "rgba(202, 138, 4, 0.12)"
                                      : result.cosine.similarity >= -0.7
                                        ? "rgba(101, 163, 13, 0.12)"
                                        : "rgba(22, 163, 74, 0.12)",
                      color:
                        result.cosine.similarity >= 0.7
                          ? "#16a34a"
                          : result.cosine.similarity >= 0.5
                            ? "#65a30d"
                            : result.cosine.similarity >= 0.3
                              ? "#ca8a04"
                              : result.cosine.similarity > 0
                                ? "#ea580c"
                                : result.cosine.similarity === 0
                                  ? "#71717a"
                                  : result.cosine.similarity >= -0.3
                                    ? "#ea580c"
                                    : result.cosine.similarity >= -0.5
                                      ? "#ca8a04"
                                      : result.cosine.similarity >= -0.7
                                        ? "#65a30d"
                                        : "#16a34a",
                    }}
                  >
                    {result.cosine.description}
                  </span>

                  <div className="mt-2 w-full max-w-md">
                    <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-red-400 via-zinc-200 to-green-400">
                      <div
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
                        style={{
                          left: `${((result.cosine.similarity + 1) / 2) * 100}%`,
                          backgroundColor:
                            result.cosine.similarity >= 0.7
                              ? "#16a34a"
                              : result.cosine.similarity >= 0.5
                                ? "#65a30d"
                                : result.cosine.similarity >= 0.3
                                  ? "#ca8a04"
                                  : result.cosine.similarity > 0
                                    ? "#ea580c"
                                    : result.cosine.similarity === 0
                                      ? "#71717a"
                                      : result.cosine.similarity >= -0.3
                                        ? "#ea580c"
                                        : result.cosine.similarity >= -0.5
                                          ? "#ca8a04"
                                          : result.cosine.similarity >= -0.7
                                            ? "#65a30d"
                                            : "#16a34a",
                        }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-zinc-400">
                      <span>-1</span>
                      <span>0</span>
                      <span>+1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {chartTab === "dtw" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-zinc-500 dark:text-zinc-400">Costo total:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {result.dtw?.totalCost.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-zinc-500 dark:text-zinc-400">Tiempo de ejecución:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {result.dtw?.executionTime.toFixed(2)} ms
                  </span>
                </div>
              </div>

              {result.dtw?.costTable && (
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
                  <h3 className="mb-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Matriz de costos (DTW) — {result.dtw.costTable.length} × {result.dtw.costTable[0].length}
                  </h3>
                  <CostTableCanvas
                    costTable={result.dtw.costTable}
                    firstDates={result.firstActivePriceData.map((d) => d.date)}
                    secondDates={result.secondActivePriceData.map((d) => d.date)}
                    maxCost={result.dtw.totalCost}
                    warpingPath={warpingPath}
                  />
                </div>
              )}

              {warpingPath.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black" style={{ height: 540 }}>
                  <WarpingPathChart
                    firstDates={result.firstActivePriceData.map((d) => d.date)}
                    secondDates={result.secondActivePriceData.map((d) => d.date)}
                    warpingPath={warpingPath}
                    firstActive={firstActive}
                    secondActive={secondActive}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
