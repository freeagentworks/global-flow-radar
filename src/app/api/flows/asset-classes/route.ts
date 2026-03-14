import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  periodToDateRange,
} from "@/lib/api/response";
import type { Period } from "@/types";

// ============================================
// アセットクラス別資金フロー API
// 資産クラス毎のフロー・リスク指標を返却
// ============================================

/** アセットクラスフロー型 */
interface AssetClassFlow {
  id: string;
  name_en: string;
  name_ja: string;
  representative_etf: string;
  flow_score: number;
  flow_usd_mm: number;
  performance_pct: number;
  aum_usd_mm: number;
}

/** リスク指標型 */
interface RiskIndicator {
  vix: number;
  vix_change: number;
  credit_spread: number;
  credit_spread_change: number;
  risk_score: number;
  risk_label: "risk_on" | "neutral" | "risk_off";
}

// モックデータ: アセットクラス
const MOCK_ASSET_CLASSES: AssetClassFlow[] = [
  {
    id: "us_equity",
    name_en: "US Equity",
    name_ja: "米国株式",
    representative_etf: "SPY",
    flow_score: 78,
    flow_usd_mm: 22500,
    performance_pct: 5.8,
    aum_usd_mm: 520000,
  },
  {
    id: "us_bond",
    name_en: "US Bonds",
    name_ja: "米国債券",
    representative_etf: "AGG",
    flow_score: 45,
    flow_usd_mm: 8900,
    performance_pct: 1.2,
    aum_usd_mm: 110000,
  },
  {
    id: "intl_equity",
    name_en: "International Equity",
    name_ja: "海外株式",
    representative_etf: "EFA",
    flow_score: -22,
    flow_usd_mm: -4200,
    performance_pct: -1.8,
    aum_usd_mm: 58000,
  },
  {
    id: "em_equity",
    name_en: "Emerging Market Equity",
    name_ja: "新興国株式",
    representative_etf: "EEM",
    flow_score: 15,
    flow_usd_mm: 1800,
    performance_pct: 2.3,
    aum_usd_mm: 26000,
  },
  {
    id: "gold",
    name_en: "Gold",
    name_ja: "金",
    representative_etf: "GLD",
    flow_score: 55,
    flow_usd_mm: 6200,
    performance_pct: 7.4,
    aum_usd_mm: 62000,
  },
  {
    id: "crypto",
    name_en: "Cryptocurrency",
    name_ja: "暗号資産",
    representative_etf: "BITO",
    flow_score: 38,
    flow_usd_mm: 2100,
    performance_pct: 15.2,
    aum_usd_mm: 3800,
  },
  {
    id: "cash",
    name_en: "Cash / Money Market",
    name_ja: "現金・MMF",
    representative_etf: "SHV",
    flow_score: -35,
    flow_usd_mm: -12000,
    performance_pct: 0.4,
    aum_usd_mm: 180000,
  },
  {
    id: "commodity",
    name_en: "Commodities",
    name_ja: "コモディティ",
    representative_etf: "DBC",
    flow_score: -8,
    flow_usd_mm: -450,
    performance_pct: -2.1,
    aum_usd_mm: 4200,
  },
  {
    id: "reit",
    name_en: "REITs",
    name_ja: "不動産投信",
    representative_etf: "VNQ",
    flow_score: -28,
    flow_usd_mm: -3100,
    performance_pct: -3.8,
    aum_usd_mm: 32000,
  },
  {
    id: "high_yield",
    name_en: "High Yield Bonds",
    name_ja: "ハイイールド債",
    representative_etf: "HYG",
    flow_score: 20,
    flow_usd_mm: 1500,
    performance_pct: 1.8,
    aum_usd_mm: 18000,
  },
];

// モックデータ: リスク指標
const MOCK_RISK_INDICATOR: RiskIndicator = {
  vix: 18.5,
  vix_change: -2.3,
  credit_spread: 1.42,
  credit_spread_change: -0.08,
  risk_score: 35,
  risk_label: "risk_on",
};

// モックデータ: 資産クラス間フロー（Sankey用）
const MOCK_FLOWS = [
  { source: "cash", target: "us_equity", amount: 12000 },
  { source: "cash", target: "gold", amount: 5500 },
  { source: "cash", target: "crypto", amount: 2100 },
  { source: "us_bond", target: "us_equity", amount: 4800 },
  { source: "intl_equity", target: "us_equity", amount: 3200 },
  { source: "reit", target: "us_equity", amount: 1800 },
  { source: "reit", target: "us_bond", amount: 1300 },
  { source: "commodity", target: "gold", amount: 700 },
  { source: "intl_equity", target: "em_equity", amount: 1000 },
  { source: "high_yield", target: "us_bond", amount: 800 },
];

// モックデータ: 時系列（過去30日）
function generateHistory(): Array<Record<string, number | string>> {
  const rows: Array<Record<string, number | string>> = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    rows.push({
      date: d.toISOString().slice(0, 10),
      equity: Math.round(50 + Math.sin(i / 5) * 30 + Math.random() * 10),
      fixed_income: Math.round(30 + Math.cos(i / 4) * 15 + Math.random() * 8),
      commodity: Math.round(-5 + Math.sin(i / 6) * 12 + Math.random() * 6),
      crypto: Math.round(20 + Math.sin(i / 3) * 25 + Math.random() * 12),
      real_estate: Math.round(-15 + Math.cos(i / 5) * 10 + Math.random() * 5),
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

    return successResponse(
      {
        asset_classes: MOCK_ASSET_CLASSES,
        risk_indicator: MOCK_RISK_INDICATOR,
        flows: MOCK_FLOWS,
        history: generateHistory(),
      },
      {
        period: { from: from.toISOString(), to: to.toISOString() },
        data_quality: "full",
      }
    );
  } catch (error) {
    console.error("アセットクラスフローAPI エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "アセットクラスフローデータの取得に失敗しました",
      500
    );
  }
}
