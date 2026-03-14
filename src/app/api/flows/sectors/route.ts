import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  periodToDateRange,
} from "@/lib/api/response";
import type { Period } from "@/types";

// ============================================
// セクター別資金フロー API
// GICS 11セクターのフローデータを返却
// ============================================

/** セクターフロー型 */
interface SectorFlow {
  id: string;
  name_en: string;
  name_ja: string;
  representative_etf: string;
  flow_score: number;
  flow_usd_mm: number;
  performance_pct: number;
  performance_1d: number;
  performance_1w: number;
  performance_1m: number;
  aum_usd_mm: number;
}

// モックデータ: GICS 11セクター
const MOCK_SECTORS: SectorFlow[] = [
  {
    id: "tech",
    name_en: "Information Technology",
    name_ja: "情報技術",
    representative_etf: "XLK",
    flow_score: 85,
    flow_usd_mm: 12400,
    performance_pct: 8.2,
    performance_1d: 1.3,
    performance_1w: 3.5,
    performance_1m: 8.2,
    aum_usd_mm: 62000,
  },
  {
    id: "healthcare",
    name_en: "Health Care",
    name_ja: "ヘルスケア",
    representative_etf: "XLV",
    flow_score: 62,
    flow_usd_mm: 5800,
    performance_pct: 4.1,
    performance_1d: 0.5,
    performance_1w: 1.8,
    performance_1m: 4.1,
    aum_usd_mm: 38000,
  },
  {
    id: "financials",
    name_en: "Financials",
    name_ja: "金融",
    representative_etf: "XLF",
    flow_score: 48,
    flow_usd_mm: 3200,
    performance_pct: 2.9,
    performance_1d: -0.2,
    performance_1w: 1.2,
    performance_1m: 2.9,
    aum_usd_mm: 41000,
  },
  {
    id: "consumer_disc",
    name_en: "Consumer Discretionary",
    name_ja: "一般消費財",
    representative_etf: "XLY",
    flow_score: 35,
    flow_usd_mm: 1800,
    performance_pct: 1.5,
    performance_1d: 0.8,
    performance_1w: 0.4,
    performance_1m: 1.5,
    aum_usd_mm: 22000,
  },
  {
    id: "industrials",
    name_en: "Industrials",
    name_ja: "資本財",
    representative_etf: "XLI",
    flow_score: 22,
    flow_usd_mm: 950,
    performance_pct: 0.8,
    performance_1d: 0.1,
    performance_1w: -0.3,
    performance_1m: 0.8,
    aum_usd_mm: 18500,
  },
  {
    id: "comm_services",
    name_en: "Communication Services",
    name_ja: "通信",
    representative_etf: "XLC",
    flow_score: 18,
    flow_usd_mm: 620,
    performance_pct: 3.4,
    performance_1d: 1.1,
    performance_1w: 2.0,
    performance_1m: 3.4,
    aum_usd_mm: 16000,
  },
  {
    id: "consumer_staples",
    name_en: "Consumer Staples",
    name_ja: "生活必需品",
    representative_etf: "XLP",
    flow_score: -12,
    flow_usd_mm: -480,
    performance_pct: -0.5,
    performance_1d: -0.3,
    performance_1w: -0.8,
    performance_1m: -0.5,
    aum_usd_mm: 17000,
  },
  {
    id: "energy",
    name_en: "Energy",
    name_ja: "エネルギー",
    representative_etf: "XLE",
    flow_score: -25,
    flow_usd_mm: -1800,
    performance_pct: -3.2,
    performance_1d: -1.5,
    performance_1w: -2.1,
    performance_1m: -3.2,
    aum_usd_mm: 32000,
  },
  {
    id: "utilities",
    name_en: "Utilities",
    name_ja: "公益",
    representative_etf: "XLU",
    flow_score: -18,
    flow_usd_mm: -720,
    performance_pct: -1.1,
    performance_1d: -0.4,
    performance_1w: -0.6,
    performance_1m: -1.1,
    aum_usd_mm: 14500,
  },
  {
    id: "real_estate",
    name_en: "Real Estate",
    name_ja: "不動産",
    representative_etf: "XLRE",
    flow_score: -32,
    flow_usd_mm: -2100,
    performance_pct: -4.5,
    performance_1d: -0.9,
    performance_1w: -2.8,
    performance_1m: -4.5,
    aum_usd_mm: 8500,
  },
  {
    id: "materials",
    name_en: "Materials",
    name_ja: "素材",
    representative_etf: "XLB",
    flow_score: 5,
    flow_usd_mm: 180,
    performance_pct: 0.3,
    performance_1d: 0.2,
    performance_1w: -0.1,
    performance_1m: 0.3,
    aum_usd_mm: 7200,
  },
];

// モックデータ: セクター間フロー（Sankey用）
const MOCK_SECTOR_FLOWS = [
  { source: "energy", target: "tech", amount: 3200 },
  { source: "energy", target: "financials", amount: 1400 },
  { source: "real_estate", target: "tech", amount: 1800 },
  { source: "real_estate", target: "healthcare", amount: 900 },
  { source: "utilities", target: "tech", amount: 600 },
  { source: "consumer_staples", target: "consumer_disc", amount: 500 },
  { source: "consumer_staples", target: "comm_services", amount: 350 },
  { source: "materials", target: "industrials", amount: 280 },
  { source: "industrials", target: "tech", amount: 450 },
];

// モックデータ: セクター時系列（過去30日）
function generateSectorHistory(): Array<Record<string, number | string>> {
  const rows: Array<Record<string, number | string>> = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    rows.push({
      date: d.toISOString().slice(0, 10),
      technology: Math.round(70 + Math.sin(i / 4) * 20 + Math.random() * 8),
      healthcare: Math.round(45 + Math.cos(i / 5) * 15 + Math.random() * 6),
      financials: Math.round(30 + Math.sin(i / 6) * 18 + Math.random() * 7),
      energy: Math.round(-20 + Math.cos(i / 4) * 12 + Math.random() * 5),
      industrials: Math.round(10 + Math.sin(i / 7) * 10 + Math.random() * 4),
    });
  }
  return rows;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const period = (searchParams.get("period") ?? "1m") as Period;

    // 期間の妥当性チェック
    const validPeriods: Period[] = ["1d", "1w", "1m", "3m", "6m", "1y", "5y"];
    if (!validPeriods.includes(period)) {
      return errorResponse("INVALID_PERIOD", `無効な期間指定: ${period}`, 400);
    }

    const { from, to } = periodToDateRange(period);

    // flow_scoreの降順でソート
    const sorted = [...MOCK_SECTORS].sort((a, b) => b.flow_score - a.flow_score);

    return successResponse(
      {
        sectors: sorted,
        flows: MOCK_SECTOR_FLOWS,
        history: generateSectorHistory(),
      },
      {
        period: { from: from.toISOString(), to: to.toISOString() },
        data_quality: "full",
      }
    );
  } catch (error) {
    console.error("セクターフローAPI エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "セクターフローデータの取得に失敗しました",
      500
    );
  }
}
