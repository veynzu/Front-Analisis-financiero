"use client";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";

import { Bar } from "react-chartjs-2";
import type { SortResult } from "@/lib/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

type AlgorithmChartProps = {
  results: SortResult[];
};

const BAR_COLORS = [
  "rgba(99,  102, 241, 0.8)",
  "rgba(59,  130, 246, 0.8)",
  "rgba(16,  185, 129, 0.8)",
  "rgba(245, 158,  11, 0.8)",
  "rgba(239,  68,  68, 0.8)",
  "rgba(168,  85, 247, 0.8)",
  "rgba(236,  72, 153, 0.8)",
  "rgba(20,  184, 166, 0.8)",
  "rgba(251, 146,  60, 0.8)",
  "rgba(132, 204,  22, 0.8)",
  "rgba(100, 116, 139, 0.8)",
  "rgba(234, 179,   8, 0.8)",
];

export function AlgorithmChart({ results }: AlgorithmChartProps) {
  const filtered = results.filter((r) => r.timeInMilliseconds != null);

  const data = {
    labels: filtered.map((r) => r.algorithmName),
    datasets: [
      {
        label: "Tiempo (ms)",
        data: filtered.map((r) => r.timeInMilliseconds),
        backgroundColor: filtered.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
        borderRadius: 6,
        borderSkipped: false as const,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Tiempo de ejecución por algoritmo",
        font: { size: 13, weight: "bold" as const },
        color: "#71717a",
        padding: { bottom: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"bar">) =>
            ` ${(ctx.parsed.y ?? 0).toFixed(4)} ms`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Algoritmo",
          color: "#a1a1aa",
          font: { size: 11 },
        },
        ticks: {
          color: "#71717a",
          maxRotation: 35,
          font: { size: 10 },
        },
        grid: { display: false },
      },
      y: {
        title: {
          display: true,
          text: "Tiempo (ms)",
          color: "#a1a1aa",
          font: { size: 11 },
        },
        ticks: { color: "#71717a", font: { size: 10 } },
        grid: { color: "rgba(113, 113, 122, 0.15)" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="relative h-full min-h-[360px] w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
