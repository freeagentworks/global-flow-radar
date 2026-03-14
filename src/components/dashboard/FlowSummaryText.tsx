"use client";

import { useGlobalFlows, useSectorFlows } from "@/lib/hooks/use-market-data";

// 本日の資金フロー概況テキスト（タスク 1-2）
// テンプレートベースで日次のフロー概要を自動生成

export function FlowSummaryText() {
  const { data: globalData, isLoading: globalLoading } = useGlobalFlows("1d");
  const { data: sectorData, isLoading: sectorLoading } = useSectorFlows("1d");

  if (globalLoading || sectorLoading) {
    return <div className="skeleton h-20 w-full" />;
  }

  // フローデータからテンプレートベースの概況文を生成
  const summary = generateSummary(globalData, sectorData);

  return (
    <div className="rounded-lg border border-neutral/20 bg-bg-secondary p-4 text-sm text-text-primary leading-relaxed">
      {summary}
    </div>
  );
}

function generateSummary(
  globalData: { regions?: Array<{ id: string; name_ja: string; net_flow_score: number; net_flow_usd_mm: number }>; flows?: Array<{ source: string; target: string; amount_usd_mm: number }> } | undefined,
  sectorData: { sectors?: Array<{ id: string; name_ja: string; flow_score: number }> } | undefined,
): string {
  if (!globalData?.regions || !globalData?.flows) {
    return "データを取得中です...";
  }

  const regions = globalData.regions;
  const flows = globalData.flows;

  // 最大流入地域を特定
  const topInflow = [...regions].sort(
    (a, b) => b.net_flow_score - a.net_flow_score
  )[0];
  // 最大流出地域を特定
  const topOutflow = [...regions].sort(
    (a, b) => a.net_flow_score - b.net_flow_score
  )[0];

  // 最大フローペアを特定
  const topFlow = [...flows].sort(
    (a, b) => b.amount_usd_mm - a.amount_usd_mm
  )[0];

  // セクター情報
  let sectorText = "";
  if (sectorData?.sectors?.length) {
    const topSector = [...sectorData.sectors].sort(
      (a, b) => b.flow_score - a.flow_score
    )[0];
    if (topSector) {
      sectorText = `${topSector.name_ja}セクターへの資金流入が活発。`;
    }
  }

  // 概況文を組み立て
  const parts: string[] = [];

  if (topFlow) {
    const sourceRegion = regions.find((r) => r.id === topFlow.source);
    const targetRegion = regions.find((r) => r.id === topFlow.target);
    if (sourceRegion && targetRegion) {
      parts.push(
        `${sourceRegion.name_ja}から${targetRegion.name_ja}への資金シフトが継続。`
      );
    }
  }

  if (sectorText) {
    parts.push(sectorText);
  }

  if (topInflow && topInflow.net_flow_score > 30) {
    parts.push(
      `${topInflow.name_ja}は強い資金流入（スコア: ${topInflow.net_flow_score.toFixed(1)}）。`
    );
  }

  if (topOutflow && topOutflow.net_flow_score < -30) {
    parts.push(
      `${topOutflow.name_ja}からの資金流出が目立つ。`
    );
  }

  return parts.length > 0
    ? parts.join("")
    : "本日は目立った資金フローの変動はありません。";
}
