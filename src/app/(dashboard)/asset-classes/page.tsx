"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Period } from "@/types";
import { useAssetClassFlows, useRiskIndicators } from "@/lib/hooks/use-asset-data";
import { PeriodSelector } from "@/components/ui/PeriodSelector";
import { SankeyDiagram } from "@/components/charts/SankeyDiagram";
import { RiskMeter } from "@/components/charts/RiskMeter";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";

// 資産クラスフロー分析ページ（S-004）
// Sankeyダイアグラム + リスクメーター + 時系列チャート

// 資産クラス時系列の線定義
const ASSET_CLASS_LINES = [
  { key: "equity", color: "#448AFF", label: "株式" },
  { key: "fixed_income", color: "#00C853", label: "債券" },
  { key: "commodity", color: "#FF9800", label: "コモディティ" },
  { key: "crypto", color: "#E91E63", label: "暗号資産" },
  { key: "real_estate", color: "#7C4DFF", label: "不動産" },
];

export default function AssetClassesPage() {
  const t = useTranslations("nav");
  const [period, setPeriod] = useState<Period>("1m");
  const { data, isLoading } = useAssetClassFlows(period);
  const { data: riskData, isLoading: riskLoading } = useRiskIndicators();

  // Sankeyデータの構築（APIデータから変換）
  const sankeyNodes = data?.asset_classes?.map(
    (ac: { id: string; name_ja: string }) => ({
      id: ac.id,
      name: ac.name_ja,
    })
  ) ?? [];

  const sankeyLinks = data?.flows?.map(
    (f: { source: string; target: string; amount: number }) => ({
      source: f.source,
      target: f.target,
      value: Math.abs(f.amount),
    })
  ) ?? [];

  // 時系列データ
  const timeSeriesData = data?.history ?? [];

  return (
    <div className="space-y-4">
      {/* ヘッダー + 期間セレクター */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-text-primary">
          {t("assetClasses")}
        </h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* リスクメーター + Sankeyダイアグラム */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* リスクメーター */}
        <section className="rounded-lg border border-border bg-bg-card p-5 flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold text-text-primary mb-3 self-start">
            リスク指標
          </h2>
          {riskLoading ? (
            <div className="skeleton h-[160px] w-[240px]" />
          ) : riskData ? (
            <div className="space-y-3 flex flex-col items-center">
              <RiskMeter
                score={riskData.risk_score}
                label={riskData.risk_label}
              />
              <div className="grid grid-cols-2 gap-3 w-full mt-2 text-sm">
                <div>
                  <p className="text-text-secondary text-xs">VIX</p>
                  <p className="font-mono-number text-text-primary">
                    {riskData.vix.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary text-xs">VIX変化</p>
                  <p
                    className={`font-mono-number ${
                      riskData.vix_change > 0 ? "text-outflow" : "text-inflow"
                    }`}
                  >
                    {riskData.vix_change > 0 ? "+" : ""}
                    {riskData.vix_change.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary text-xs">信用スプレッド</p>
                  <p className="font-mono-number text-text-primary">
                    {riskData.credit_spread.toFixed(2)}bp
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary text-xs">リスクスコア</p>
                  <p className="font-mono-number text-text-primary">
                    {riskData.risk_score > 0 ? "+" : ""}
                    {riskData.risk_score}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm">データなし</p>
          )}
        </section>

        {/* Sankeyダイアグラム */}
        <section className="lg:col-span-2 rounded-lg border border-border bg-bg-card p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            資産クラス間フロー
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

      {/* 資産クラスフロー時系列 */}
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          資産クラスフロー推移
        </h2>
        {isLoading ? (
          <div className="skeleton h-[300px] w-full" />
        ) : (
          <TimeSeriesChart
            data={timeSeriesData}
            lines={ASSET_CLASS_LINES}
            height={300}
          />
        )}
      </section>
    </div>
  );
}
