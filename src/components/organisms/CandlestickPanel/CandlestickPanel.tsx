"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  TimeScale,
  CategoryScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
  BarController,
  BarElement,
  LineController,
  type ChartData,
  type Chart as ChartJSInstance,
} from "chart.js";
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import "chartjs-adapter-date-fns";
import { Chart } from "react-chartjs-2";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { getActives, getCandlestickData } from "@/lib/api";
import type { Active, CandlestickResponse } from "@/lib/types";

ChartJS.register(
  LinearScale,
  TimeScale,
  CategoryScale,
  LineElement,
  PointElement,
  BarElement,
  BarController,
  LineController,
  CandlestickController,
  CandlestickElement,
  Tooltip,
  Legend,
  Title,
);

const UP_BORDER = "rgba(22, 163, 74, 1)";
const UP_BG = "rgba(22, 163, 74, 0.55)";
const DOWN_BORDER = "rgba(220, 38, 38, 1)";
const DOWN_BG = "rgba(220, 38, 38, 0.55)";
const FLAT_BORDER = "rgba(113, 113, 122, 1)";
const FLAT_BG = "rgba(113, 113, 122, 0.55)";

const SMA_PERIODS = [20, 50, 200] as const;
type SmaPeriod = (typeof SMA_PERIODS)[number];

const SMA_COLORS: Record<SmaPeriod, string> = {
  20: "rgba(59, 130, 246, 0.95)",
  50: "rgba(234, 88, 12, 0.95)",
  200: "rgba(139, 92, 246, 0.95)",
};

export function CandlestickPanel() {
  const [actives, setActives] = useState<Active[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<SmaPeriod, CandlestickResponse | null>>({
    20: null,
    50: null,
    200: null,
  });
  const [loadingActives, setLoadingActives] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabledSmas, setEnabledSmas] = useState<Record<SmaPeriod, boolean>>({
    20: true,
    50: true,
    200: false,
  });
  const [zoomPluginReady, setZoomPluginReady] = useState(false);
  const chartRef = useRef<ChartJSInstance<"candlestick"> | null>(null);

  useEffect(() => {
    import("chartjs-plugin-zoom")
      .then((mod) => {
        ChartJS.register(mod.default);
        setZoomPluginReady(true);
      })
      .catch(() => setZoomPluginReady(false));
  }, []);

  useEffect(() => {
    getActives()
      .then((data) => {
        setActives(data.actives);
        if (data.actives.length > 0) setActiveId(data.actives[0].id);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingActives(false));
  }, []);

  useEffect(() => {
    if (activeId === null) return;
    const periodsToFetch = SMA_PERIODS.filter((p) => enabledSmas[p]);
    if (periodsToFetch.length === 0) {
      // si nada está habilitado, traemos al menos uno para tener OHLC
      periodsToFetch.push(20);
    }

    setLoadingPrices(true);
    setError(null);

    Promise.all(
      periodsToFetch.map((p) =>
        getCandlestickData(activeId, p).then((r) => [p, r] as const),
      ),
    )
      .then((pairs) => {
        const next: Record<SmaPeriod, CandlestickResponse | null> = {
          20: null,
          50: null,
          200: null,
        };
        for (const [p, r] of pairs) next[p] = r;
        setResponses(next);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingPrices(false));
  }, [activeId, enabledSmas]);

  const selected = useMemo(
    () => actives.find((a) => a.id === activeId) ?? null,
    [actives, activeId],
  );

  // Usamos la primera respuesta disponible como fuente de OHLC
  const ohlcSource = useMemo(() => {
    for (const p of SMA_PERIODS) {
      if (responses[p]) return responses[p];
    }
    return null;
  }, [responses]);

  const chartData = useMemo(() => {
    if (!ohlcSource || ohlcSource.data.length === 0) return null;

    // Clasificación close-to-close: vela verde si close[i] > close[i-1], roja si <, gris si =.
    // La primera vela no tiene referencia previa → se compara con su propio open.
    const upCandles: { x: number; o: number; h: number; l: number; c: number }[] = [];
    const downCandles: { x: number; o: number; h: number; l: number; c: number }[] = [];
    const flatCandles: { x: number; o: number; h: number; l: number; c: number }[] = [];

    for (let i = 0; i < ohlcSource.data.length; i++) {
      const p = ohlcSource.data[i];
      const prevClose = i === 0 ? p.open : ohlcSource.data[i - 1].close;
      const candle = {
        x: new Date(p.date).getTime(),
        o: p.open,
        h: p.high,
        l: p.low,
        c: p.close,
      };
      if (p.close > prevClose) upCandles.push(candle);
      else if (p.close < prevClose) downCandles.push(candle);
      else flatCandles.push(candle);
    }

    // Para forzar el color por dataset (saltando la lógica c>o de la librería),
    // hacemos que up/down/unchanged compartan el mismo color dentro de cada dataset.
    const datasetUp = {
      type: "candlestick" as const,
      label: "Vela alcista (close > close prev)",
      data: upCandles,
      borderColors: { up: UP_BORDER, down: UP_BORDER, unchanged: UP_BORDER },
      backgroundColors: { up: UP_BG, down: UP_BG, unchanged: UP_BG },
    };
    const datasetDown = {
      type: "candlestick" as const,
      label: "Vela bajista (close < close prev)",
      data: downCandles,
      borderColors: { up: DOWN_BORDER, down: DOWN_BORDER, unchanged: DOWN_BORDER },
      backgroundColors: { up: DOWN_BG, down: DOWN_BG, unchanged: DOWN_BG },
    };
    const datasetFlat = {
      type: "candlestick" as const,
      label: "Vela sin cambio",
      data: flatCandles,
      borderColors: { up: FLAT_BORDER, down: FLAT_BORDER, unchanged: FLAT_BORDER },
      backgroundColors: { up: FLAT_BG, down: FLAT_BG, unchanged: FLAT_BG },
    };

    const candleDatasets = [datasetUp, datasetDown];
    if (flatCandles.length > 0) candleDatasets.push(datasetFlat);

    const smaDatasets = SMA_PERIODS.filter(
      (p) => enabledSmas[p] && responses[p],
    ).map((p) => {
      const res = responses[p]!;
      return {
        type: "line" as const,
        label: `SMA(${p})`,
        data: res.data.map((pt) => ({
          x: new Date(pt.date).getTime(),
          y: pt.sma,
        })),
        borderColor: SMA_COLORS[p],
        backgroundColor: SMA_COLORS[p],
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 3,
        spanGaps: false,
        tension: 0,
      };
    });

    return {
      datasets: [...candleDatasets, ...smaDatasets],
    } as unknown as ChartData<"candlestick">;
  }, [ohlcSource, responses, enabledSmas]);

  const handleResetZoom = () => {
    const chart = chartRef.current;
    if (chart && typeof (chart as unknown as { resetZoom?: () => void }).resetZoom === "function") {
      (chart as unknown as { resetZoom: () => void }).resetZoom();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Gráfico de velas con medias móviles
      </h2>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Cada vela representa un día (OHLC). Las medias móviles simples las
        calcula el backend con una implementación propia O(n) por ventana
        deslizante en{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-[10px] dark:bg-zinc-800">
          VisualizationAlgorithms.calculateSMA
        </code>
        . Cada SMA activa equivale a una llamada paralela al endpoint{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-[10px] dark:bg-zinc-800">
          /api/visualization/candlestick/{`{id}`}?smaPeriod=N
        </code>
        .
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Activo
          </label>
          <select
            value={activeId ?? ""}
            onChange={(e) => setActiveId(Number(e.target.value))}
            disabled={loadingActives}
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
            Medias móviles
          </label>
          <div className="flex h-10 items-center gap-3 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-600 dark:bg-black">
            {SMA_PERIODS.map((p) => (
              <label
                key={p}
                className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={enabledSmas[p]}
                  onChange={(e) =>
                    setEnabledSmas((prev) => ({ ...prev, [p]: e.target.checked }))
                  }
                />
                <span style={{ color: SMA_COLORS[p] }}>SMA({p})</span>
              </label>
            ))}
          </div>
        </div>

        {ohlcSource && (
          <div className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-zinc-500 dark:text-zinc-400">Velas:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {ohlcSource.data.length}
            </span>
          </div>
        )}

        {zoomPluginReady && ohlcSource && (
          <Button variant="ghost" onClick={handleResetZoom}>
            Reset zoom
          </Button>
        )}
      </div>

      {zoomPluginReady && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Controles: <strong>arrastrar</strong> con el mouse para deslizar la
          gráfica · <strong>rueda</strong> para acercar/alejar ·{" "}
          <strong>Ctrl + arrastrar</strong> para seleccionar un rango exacto ·
          pinch en pantallas táctiles.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {loadingActives && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!loadingActives && (
        <div
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black [&_canvas]:cursor-grab"
          style={{ height: 520 }}
        >
          {loadingPrices ? (
            <div className="flex h-full items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : chartData ? (
            <Chart
              ref={(instance) => {
                chartRef.current = (instance as unknown as ChartJSInstance<"candlestick">) ?? null;
              }}
              type="candlestick"
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                devicePixelRatio:
                  typeof window !== "undefined"
                    ? Math.max(window.devicePixelRatio || 1, 2)
                    : 2,
                interaction: { intersect: false, mode: "index" },
                plugins: {
                  legend: {
                    position: "top",
                    labels: {
                      color: "#71717a",
                      font: { size: 12 },
                      usePointStyle: true,
                      padding: 14,
                      filter: (item) => item.text !== "Vela sin cambio",
                    },
                  },
                  title: {
                    display: true,
                    text: selected
                      ? `${selected.symbol} — ${selected.name}`
                      : "",
                    font: { size: 13, weight: "bold" },
                    color: "#71717a",
                    padding: { bottom: 12 },
                  },
                  zoom: zoomPluginReady
                    ? {
                        pan: {
                          enabled: true,
                          mode: "x" as const,
                          // sin modifierKey: arrastrar con click izquierdo desliza la gráfica
                          onPanStart: ({ chart }: { chart: ChartJSInstance }) => {
                            chart.canvas.style.cursor = "grabbing";
                            return undefined;
                          },
                          onPanComplete: ({ chart }: { chart: ChartJSInstance }) => {
                            chart.canvas.style.cursor = "grab";
                            return undefined;
                          },
                        },
                        zoom: {
                          wheel: { enabled: true },
                          // box-zoom solo con Ctrl para que no interfiera con el pan
                          drag: {
                            enabled: true,
                            modifierKey: "ctrl" as const,
                            backgroundColor: "rgba(99, 102, 241, 0.1)",
                            borderColor: "rgba(99, 102, 241, 0.6)",
                            borderWidth: 1,
                          },
                          pinch: { enabled: true },
                          mode: "x" as const,
                        },
                        limits: {
                          x: { minRange: 7 * 24 * 60 * 60 * 1000 }, // mínimo 1 semana
                        },
                      }
                    : undefined,
                },
                scales: {
                  x: {
                    type: "time",
                    time: {
                      minUnit: "day",
                      tooltipFormat: "yyyy-MM-dd",
                      displayFormats: {
                        day: "yyyy-MM-dd",
                        week: "yyyy-MM-dd",
                        month: "yyyy-MM",
                        quarter: "yyyy-MM",
                        year: "yyyy",
                      },
                    },
                    ticks: {
                      color: "#71717a",
                      font: { size: 10 },
                      minRotation: 90,
                      maxRotation: 90,
                      autoSkip: true,
                      autoSkipPadding: 8,
                      maxTicksLimit: 24,
                    },
                    grid: { display: false },
                  },
                  y: {
                    title: {
                      display: true,
                      text: "Precio (USD)",
                      color: "#a1a1aa",
                      font: { size: 11 },
                    },
                    ticks: { color: "#71717a", font: { size: 10 } },
                    grid: { color: "rgba(113, 113, 122, 0.15)" },
                  },
                },
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              Selecciona un activo para visualizar las velas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
