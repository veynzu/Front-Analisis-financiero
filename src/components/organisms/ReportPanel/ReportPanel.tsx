"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { CorrelationPanel } from "@/components/organisms/CorrelationPanel";
import { RiskAnalysisPanel } from "@/components/organisms/RiskAnalysisPanel";
import { CandlestickPanel } from "@/components/organisms/CandlestickPanel";

type Section = {
  title: string;
  ref: React.RefObject<HTMLElement | null>;
};

export function ReportPanel() {
  const correlationRef = useRef<HTMLElement>(null);
  const riskRef = useRef<HTMLElement>(null);
  const candlestickRef = useRef<HTMLElement>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    const sections: Section[] = [
      { title: "Matriz de correlación", ref: correlationRef },
      { title: "Patrones y riesgo", ref: riskRef },
      { title: "Velas + SMA", ref: candlestickRef },
    ];

    if (sections.some((s) => !s.ref.current)) return;

    setExporting(true);
    setError(null);

    try {
      const [{ default: html2canvas }, jsPdfModule] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const JsPDF = jsPdfModule.jsPDF ?? jsPdfModule.default;

      const pdf = new JsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const headerHeight = 6;
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2 - headerHeight;

      const drawHeader = (sectionTitle: string, current: number, total: number) => {
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        pdf.text(
          `Reporte técnico — ${sectionTitle} · página ${current} de ${total}`,
          margin,
          margin - 2,
        );
      };

      let isFirstPage = true;
      let pageNumber = 0;
      let totalPages = 0;

      // Pre-pass para calcular total de páginas
      const sectionData: { canvas: HTMLCanvasElement; pages: number; sliceHeightPx: number }[] = [];
      for (const section of sections) {
        const node = section.ref.current!;
        const canvas = await html2canvas(node, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: node.scrollWidth,
          windowHeight: node.scrollHeight,
        });
        const pxPerMm = canvas.width / usableWidth;
        const sliceHeightPx = usableHeight * pxPerMm;
        const pages = Math.max(1, Math.ceil(canvas.height / sliceHeightPx));
        sectionData.push({ canvas, pages, sliceHeightPx });
        totalPages += pages;
      }

      const pageCanvas = document.createElement("canvas");
      const ctx = pageCanvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo crear contexto 2D");

      for (let s = 0; s < sections.length; s++) {
        const { canvas, pages, sliceHeightPx } = sectionData[s];
        const pxPerMm = canvas.width / usableWidth;

        for (let i = 0; i < pages; i++) {
          if (!isFirstPage) pdf.addPage();
          isFirstPage = false;
          pageNumber++;

          const sourceY = i * sliceHeightPx;
          const sliceHeight = Math.min(sliceHeightPx, canvas.height - sourceY);
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight,
          );

          const imgData = pageCanvas.toDataURL("image/jpeg", 0.92);
          const sliceHeightMm = sliceHeight / pxPerMm;

          drawHeader(sections[s].title, pageNumber, totalPages);

          pdf.addImage(
            imgData,
            "JPEG",
            margin,
            margin + headerHeight,
            usableWidth,
            sliceHeightMm,
            undefined,
            "FAST",
          );
        }
      }

      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      pdf.save(`reporte-bursatil-${stamp}.pdf`);
    } catch (err) {
      setError((err as Error).message ?? "Error generando el PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Reporte técnico consolidado
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Consolida la matriz de correlación, el análisis de riesgo y un
            gráfico de velas. Cada sección queda en su propia página del PDF.
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Generando PDF…
            </span>
          ) : (
            "Descargar PDF"
          )}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-8 rounded-xl bg-white p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <section ref={correlationRef}>
          <CorrelationPanel />
        </section>
        <div className="border-t border-zinc-200 dark:border-zinc-800" />
        <section ref={riskRef}>
          <RiskAnalysisPanel />
        </section>
        <div className="border-t border-zinc-200 dark:border-zinc-800" />
        <section ref={candlestickRef}>
          <CandlestickPanel />
        </section>
      </div>
    </div>
  );
}
