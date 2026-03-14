"use client";

import { useState } from "react";
import { useSectorFlows } from "@/lib/hooks/use-market-data";
import type { Period, SectorData } from "@/types";

// セクターヒートマップ（フルページ版）
// 11のGICSセクターをグリッド表示し、フロースコアに基づくカラーリング

interface SectorHeatmapProps {
  period: Period;
}

// GICS 11セクター定義
const GICS_SECTORS: Record<string, { name_ja: string; name_en: string }> = {
  technology: { name_ja: "情報技術", name_en: "Information Technology" },
  healthcare: { name_ja: "ヘルスケア", name_en: "Health Care" },
  financials: { name_ja: "金融", name_en: "Financials" },
  energy: { name_ja: "エネルギー", name_en: "Energy" },
  consumer_disc: { name_ja: "一般消費財", name_en: "Consumer Discretionary" },
  consumer_staples: { name_ja: "生活必需品", name_en: "Consumer Staples" },
  industrials: { name_ja: "資本財", name_en: "Industrials" },
  materials: { name_ja: "素材", name_en: "Materials" },
  utilities: { name_ja: "公益事業", name_en: "Utilities" },
  real_estate: { name_ja: "不動産", name_en: "Real Estate" },
  communication: { name_ja: "通信", name_en: "Communication Services" },
};

// フロースコアに基づく連続的なヒートマップカラーを計算
function getHeatmapColor(score: number): string {
  // score: -100 ~ 100 の範囲
  // -100: #FF1744 (強い流出) -> 0: #30363D (ニュートラル) -> 100: #00C853 (強い流入)
  const clamped = Math.max(-100, Math.min(100, score));
  const t = (clamped + 100) / 200; // 0 ~ 1 に正規化

  if (t < 0.5) {
    // 流出側: #FF1744 -> #30363D
    const ratio = t / 0.5;
    const r = Math.round(255 + (48 - 255) * ratio);
    const g = Math.round(23 + (54 - 23) * ratio);
    const b = Math.round(68 + (61 - 68) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // 流入側: #30363D -> #00C853
    const ratio = (t - 0.5) / 0.5;
    const r = Math.round(48 + (0 - 48) * ratio);
    const g = Math.round(54 + (200 - 54) * ratio);
    const b = Math.round(61 + (83 - 61) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// パフォーマンス値のキーを期間に応じて取得
function getPerformanceKey(period: Period): string {
  switch (period) {
    case "1d":
      return "performance_1d";
    case "1w":
      return "performance_1w";
    case "1m":
    default:
      return "performance_1m";
  }
}

export function SectorHeatmap({ period }: SectorHeatmapProps) {
  const { data, isLoading } = useSectorFlows(period);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // ローディング状態
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-bg-card p-5">
        <div className="skeleton h-[320px] w-full" />
      </div>
    );
  }

  const sectors: SectorData[] = data?.sectors ?? [];
  const perfKey = getPerformanceKey(period);

  // ホバー中のセクターデータ
  const hoveredData = hoveredSector
    ? sectors.find((s) => s.id === hoveredSector)
    : null;

  return (
    <div className="relative rounded-lg border border-border bg-bg-card p-5">
      {/* セクターグリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sectors.map((sector) => {
          const bgColor = getHeatmapColor(sector.flow_score);
          const sectorMeta = GICS_SECTORS[sector.id];

          return (
            <div
              key={sector.id}
              className="relative rounded-lg p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: bgColor }}
              onMouseEnter={(e) => {
                setHoveredSector(sector.id);
                const rect = e.currentTarget.getBoundingClientRect();
                const parentRect =
                  e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                if (parentRect) {
                  setTooltipPos({
                    x: rect.left - parentRect.left + rect.width / 2,
                    y: rect.top - parentRect.top - 8,
                  });
                }
              }}
              onMouseLeave={() => setHoveredSector(null)}
            >
              {/* セクター名 */}
              <p className="text-sm font-semibold text-white/90 truncate">
                {sectorMeta?.name_ja ?? sector.name_ja}
              </p>
              <p className="text-xs text-white/60 truncate mt-0.5">
                {sectorMeta?.name_en ?? sector.name_en}
              </p>

              {/* フロースコア */}
              <p className="font-mono-number text-lg font-bold text-white mt-2">
                {sector.flow_score > 0 ? "+" : ""}
                {sector.flow_score.toFixed(1)}
              </p>

              {/* パフォーマンス */}
              <p className="font-mono-number text-xs text-white/70 mt-1">
                {(() => {
                  const perf =
                    (sector as unknown as Record<string, unknown>)[perfKey] as
                      | number
                      | undefined;
                  if (perf == null) return "—";
                  return `${perf > 0 ? "+" : ""}${perf.toFixed(2)}%`;
                })()}
              </p>
            </div>
          );
        })}
      </div>

      {/* ツールチップ */}
      {hoveredData && (
        <div
          className="absolute z-20 pointer-events-none rounded-md bg-bg-card border border-border px-4 py-3 shadow-xl -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <p className="text-sm font-semibold text-text-primary">
            {GICS_SECTORS[hoveredData.id]?.name_ja ?? hoveredData.name_ja}
          </p>
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-text-secondary">
              フロースコア:{" "}
              <span
                className={`font-mono-number font-semibold ${
                  hoveredData.flow_score > 0
                    ? "text-inflow"
                    : hoveredData.flow_score < 0
                      ? "text-outflow"
                      : "text-text-muted"
                }`}
              >
                {hoveredData.flow_score > 0 ? "+" : ""}
                {hoveredData.flow_score.toFixed(1)}
              </span>
            </p>
            <p className="text-xs text-text-secondary">
              パフォーマンス:{" "}
              <span className="font-mono-number">
                {(() => {
                  const perf =
                    (hoveredData as unknown as Record<string, unknown>)[perfKey] as
                      | number
                      | undefined;
                  if (perf == null) return "—";
                  return `${perf > 0 ? "+" : ""}${perf.toFixed(2)}%`;
                })()}
              </span>
            </p>
            <p className="text-xs text-text-secondary">
              代表ETF:{" "}
              <span className="font-mono-number">
                {hoveredData.representative_etf}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* カラースケール凡例 */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-text-secondary">
        <span>流出</span>
        <div
          className="h-3 w-32 rounded-full"
          style={{
            background:
              "linear-gradient(to right, #FF1744, #30363D 50%, #00C853)",
          }}
        />
        <span>流入</span>
      </div>
    </div>
  );
}
