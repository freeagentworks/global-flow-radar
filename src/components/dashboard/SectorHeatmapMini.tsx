"use client";

import { useSectorFlows } from "@/lib/hooks/use-market-data";
import { useTranslations } from "next-intl";

// セクターヒートマップ（ダッシュボード用ミニ版）
// 07_ui-wireframe.md 2.3節 準拠

// セクターの表示名（短縮形）
const SECTOR_SHORT: Record<string, string> = {
  technology: "TECH",
  healthcare: "HLTH",
  financials: "FINL",
  energy: "ENRG",
  consumer_disc: "COND",
  consumer_staples: "CONS",
  industrials: "INDU",
  materials: "MATL",
  utilities: "UTIL",
  real_estate: "REAL",
  communication: "COMM",
};

// セクターカラー（07_ui-wireframe.md 1.1節）
const SECTOR_COLORS: Record<string, string> = {
  technology: "#7C4DFF",
  healthcare: "#00BCD4",
  financials: "#FF9800",
  energy: "#F44336",
  consumer_disc: "#E91E63",
  consumer_staples: "#8BC34A",
  industrials: "#795548",
  materials: "#607D8B",
  utilities: "#FFEB3B",
  real_estate: "#009688",
  communication: "#3F51B5",
};

export function SectorHeatmapMini() {
  const t = useTranslations("dashboard");
  const { data, isLoading } = useSectorFlows("1m");

  if (isLoading) {
    return (
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          {t("sectorHeatmap")}
        </h2>
        <div className="skeleton h-48 w-full" />
      </section>
    );
  }

  const sectors = data?.sectors ?? [];

  return (
    <section className="rounded-lg border border-border bg-bg-card p-5">
      <h2 className="text-lg font-semibold text-text-primary mb-3">
        {t("sectorHeatmap")}
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {sectors.map((sector: { id: string; name_ja: string; flow_score: number; performance_1d: number }) => {
          const bgColor = getHeatmapColor(sector.flow_score);
          const shortName = SECTOR_SHORT[sector.id] ?? sector.id.toUpperCase();

          return (
            <div
              key={sector.id}
              className="relative rounded-md p-3 text-center cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: bgColor }}
              title={`${sector.name_ja}: ${sector.flow_score > 0 ? "+" : ""}${sector.flow_score.toFixed(1)}`}
            >
              <p className="text-xs font-semibold text-white/90">
                {shortName}
              </p>
              <p className="font-mono-number text-xs text-white/70 mt-0.5">
                {sector.flow_score > 0 ? "+" : ""}
                {sector.flow_score.toFixed(1)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// フロースコアに応じたヒートマップカラーを返す
function getHeatmapColor(score: number): string {
  if (score >= 50) return "#00C853";      // 強い流入
  if (score >= 20) return "#1B5E20";      // 中程度の流入
  if (score >= -20) return "#30363D";     // ニュートラル
  if (score >= -50) return "#B71C1C";     // 中程度の流出
  return "#FF1744";                        // 強い流出
}
