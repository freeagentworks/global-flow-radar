"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Period } from "@/types";
import { useSectorFlows } from "@/lib/hooks/use-market-data";
import { PeriodSelector } from "@/components/ui/PeriodSelector";
import { SectorHeatmap } from "@/components/charts/SectorHeatmap";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { SankeyDiagram } from "@/components/charts/SankeyDiagram";

// セクターローテーションページ（S-003）
// ヒートマップ + 時系列チャート + Sankeyダイアグラム

// セクター時系列の線定義
const SECTOR_LINES = [
  { key: "technology", color: "#7C4DFF", label: "情報技術" },
  { key: "healthcare", color: "#00BCD4", label: "ヘルスケア" },
  { key: "financials", color: "#FF9800", label: "金融" },
  { key: "energy", color: "#F44336", label: "エネルギー" },
  { key: "industrials", color: "#795548", label: "資本財" },
];

export default function SectorsPage() {
  const t = useTranslations("nav");
  const [period, setPeriod] = useState<Period>("1m");
  const { data, isLoading } = useSectorFlows(period);

  // セクター時系列データ
  const timeSeriesData = data?.history ?? [];

  // Sankeyデータの構築
  const sankeyNodes =
    data?.sectors?.map(
      (s: { id: string; name_ja: string }) => ({
        id: s.id,
        name: s.name_ja,
      })
    ) ?? [];

  const sankeyLinks =
    data?.flows?.map(
      (f: { source: string; target: string; amount: number }) => ({
        source: f.source,
        target: f.target,
        value: Math.abs(f.amount),
      })
    ) ?? [];

  return (
    <div className="space-y-4">
      {/* ヘッダー + 期間セレクター */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-text-primary">
          {t("sectors")}
        </h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* セクターヒートマップ */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          セクターヒートマップ
        </h2>
        <SectorHeatmap period={period} />
      </section>

      {/* セクターフロー時系列 */}
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          セクターフロー推移
        </h2>
        {isLoading ? (
          <div className="skeleton h-[300px] w-full" />
        ) : (
          <TimeSeriesChart
            data={timeSeriesData}
            lines={SECTOR_LINES}
            height={300}
          />
        )}
      </section>

      {/* セクター間資金フロー Sankeyダイアグラム */}
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          セクター間資金フロー
        </h2>
        {isLoading ? (
          <div className="skeleton h-[400px] w-full" />
        ) : (
          <SankeyDiagram
            nodes={sankeyNodes}
            links={sankeyLinks}
            height={400}
          />
        )}
      </section>
    </div>
  );
}
