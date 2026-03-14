import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  periodToDateRange,
} from "@/lib/api/response";
import type { Period } from "@/types";

// ============================================
// グローバル資金フロー API
// 地域間の資金移動データを返却
// ============================================

/** 地域サマリー型 */
interface RegionFlowSummary {
  id: string;
  name_en: string;
  name_ja: string;
  net_flow_score: number;
  net_flow_usd_mm: number;
  market_weight: number;
}

/** 地域間フロー型 */
interface RegionalFlow {
  source: string;
  target: string;
  flow_score: number;
  amount_usd_mm: number;
  pct_change: number;
  confidence: number;
}

/** タイムシリーズ型 */
interface FlowTimeseries {
  date: string;
  source: string;
  target: string;
  flow_score: number;
  amount_usd_mm: number;
}

// モックデータ: 地域サマリー
const MOCK_REGIONS: RegionFlowSummary[] = [
  { id: "US", name_en: "United States", name_ja: "米国", net_flow_score: 72, net_flow_usd_mm: 18450, market_weight: 0.42 },
  { id: "JP", name_en: "Japan", name_ja: "日本", net_flow_score: -15, net_flow_usd_mm: -3200, market_weight: 0.06 },
  { id: "EU", name_en: "Europe", name_ja: "欧州", net_flow_score: -28, net_flow_usd_mm: -7800, market_weight: 0.18 },
  { id: "CN", name_en: "China", name_ja: "中国", net_flow_score: -42, net_flow_usd_mm: -9500, market_weight: 0.12 },
  { id: "EM", name_en: "Emerging Markets", name_ja: "新興国", net_flow_score: 18, net_flow_usd_mm: 2050, market_weight: 0.22 },
];

// モックデータ: 地域間フロー
const MOCK_FLOWS: RegionalFlow[] = [
  { source: "EU", target: "US", flow_score: 65, amount_usd_mm: 8200, pct_change: 12.3, confidence: 0.92 },
  { source: "CN", target: "US", flow_score: 58, amount_usd_mm: 6100, pct_change: 8.7, confidence: 0.88 },
  { source: "JP", target: "US", flow_score: 42, amount_usd_mm: 4150, pct_change: 5.1, confidence: 0.91 },
  { source: "EM", target: "US", flow_score: 22, amount_usd_mm: 1800, pct_change: -2.4, confidence: 0.85 },
  { source: "CN", target: "JP", flow_score: 15, amount_usd_mm: 1200, pct_change: 3.8, confidence: 0.79 },
  { source: "EU", target: "EM", flow_score: 18, amount_usd_mm: 2050, pct_change: 14.5, confidence: 0.82 },
  { source: "US", target: "EM", flow_score: 12, amount_usd_mm: 950, pct_change: 6.2, confidence: 0.86 },
  { source: "JP", target: "EU", flow_score: 8, amount_usd_mm: 620, pct_change: -1.5, confidence: 0.77 },
];

// モックデータ: タイムシリーズ生成
function generateTimeseries(days: number): FlowTimeseries[] {
  const series: FlowTimeseries[] = [];
  const pairs = [
    { source: "EU", target: "US" },
    { source: "CN", target: "US" },
    { source: "JP", target: "US" },
  ];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    for (const pair of pairs) {
      series.push({
        date: dateStr,
        source: pair.source,
        target: pair.target,
        // ランダム風にスコアを生成（ベース値 +/- 変動幅）
        flow_score: Math.round(50 + Math.sin(i * 0.3) * 20 + Math.random() * 10),
        amount_usd_mm: Math.round(4000 + Math.sin(i * 0.2) * 2000 + Math.random() * 500),
      });
    }
  }

  return series;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const period = (searchParams.get("period") ?? "1m") as Period;
    const format = searchParams.get("format") ?? "summary";

    // 期間の妥当性チェック
    const validPeriods: Period[] = ["1d", "1w", "1m", "3m", "6m", "1y", "5y"];
    if (!validPeriods.includes(period)) {
      return errorResponse("INVALID_PERIOD", `無効な期間指定: ${period}`, 400);
    }

    // フォーマットの妥当性チェック
    if (!["summary", "timeseries"].includes(format)) {
      return errorResponse("INVALID_FORMAT", `無効なフォーマット: ${format}`, 400);
    }

    const { from, to } = periodToDateRange(period);

    if (format === "timeseries") {
      // タイムシリーズ形式
      const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      const timeseries = generateTimeseries(diffDays);

      return successResponse(
        { timeseries },
        {
          period: { from: from.toISOString(), to: to.toISOString() },
          data_quality: "full",
        }
      );
    }

    // サマリー形式（デフォルト）
    return successResponse(
      {
        regions: MOCK_REGIONS,
        flows: MOCK_FLOWS,
      },
      {
        period: { from: from.toISOString(), to: to.toISOString() },
        data_quality: "full",
      }
    );
  } catch (error) {
    console.error("グローバルフローAPI エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "グローバルフローデータの取得に失敗しました",
      500
    );
  }
}
