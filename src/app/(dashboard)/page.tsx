"use client";

import { useTranslations } from "next-intl";
import { MetricCard } from "@/components/ui/MetricCard";
import { FlowSummaryText } from "@/components/dashboard/FlowSummaryText";
import { EtfRankingTable } from "@/components/dashboard/EtfRankingTable";
import { MiniFlowMap } from "@/components/dashboard/MiniFlowMap";
import { SectorHeatmapMini } from "@/components/dashboard/SectorHeatmapMini";
import { AlertList } from "@/components/dashboard/AlertList";
import { useMarketSummary } from "@/lib/hooks/use-market-data";

// ダッシュボードトップページ（S-001）
// 07_ui-wireframe.md 2.3節 準拠

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { data: metrics, isLoading: metricsLoading } = useMarketSummary();

  return (
    <div className="space-y-6">
      {/* 本日の資金フロー概況 */}
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <h1 className="text-xl font-semibold text-text-primary mb-3">
          {t("title")}
        </h1>
        <FlowSummaryText />
      </section>

      {/* マーケットサマリーカード */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          {t("marketSummary")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {metricsLoading
            ? ["S&P 500", "Nikkei 225", "USD/JPY", "US 10Y", "VIX", "Gold", "BTC"].map(
                (label) => (
                  <MetricCard
                    key={label}
                    label={label}
                    value={0}
                    change={0}
                    loading
                  />
                )
              )
            : metrics?.map((metric) => (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  change={metric.change}
                  prefix={metric.prefix}
                  suffix={metric.suffix}
                />
              ))}
        </div>
      </section>

      {/* ミニ世界地図 + セクターヒートマップ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MiniFlowMap />
        <SectorHeatmapMini />
      </div>

      {/* 資金流入/流出 Top5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EtfRankingTable direction="inflow" title={t("topInflows")} />
        <EtfRankingTable direction="outflow" title={t("topOutflows")} />
      </div>

      {/* 最新アラート */}
      <AlertList />
    </div>
  );
}
