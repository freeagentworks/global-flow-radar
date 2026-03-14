import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  periodToDateRange,
} from "@/lib/api/response";
import type { Period } from "@/types";

// ============================================
// ETFランキング API
// ファンドフロー上位/下位のETFランキングを返却
// ============================================

/** ETFランキング項目型 */
interface EtfRankingItem {
  rank: number;
  symbol: string;
  name: string;
  category: string;
  flow_usd_mm: number;
  flow_pct_aum: number;
  aum_usd_mm: number;
  performance_pct: number;
  volume_avg_mm: number;
}

// モックデータ: インフローランキング
const MOCK_INFLOW_RANKINGS: EtfRankingItem[] = [
  { rank: 1, symbol: "SPY", name: "SPDR S&P 500 ETF Trust", category: "regional", flow_usd_mm: 9800, flow_pct_aum: 1.88, aum_usd_mm: 520000, performance_pct: 5.8, volume_avg_mm: 28000 },
  { rank: 2, symbol: "VOO", name: "Vanguard S&P 500 ETF", category: "regional", flow_usd_mm: 8500, flow_pct_aum: 2.12, aum_usd_mm: 401000, performance_pct: 5.9, volume_avg_mm: 5200 },
  { rank: 3, symbol: "QQQ", name: "Invesco QQQ Trust", category: "regional", flow_usd_mm: 6200, flow_pct_aum: 2.58, aum_usd_mm: 240000, performance_pct: 8.1, volume_avg_mm: 42000 },
  { rank: 4, symbol: "XLK", name: "Technology Select Sector SPDR", category: "sector", flow_usd_mm: 4800, flow_pct_aum: 7.74, aum_usd_mm: 62000, performance_pct: 8.2, volume_avg_mm: 8900 },
  { rank: 5, symbol: "GLD", name: "SPDR Gold Shares", category: "asset_class", flow_usd_mm: 4200, flow_pct_aum: 6.77, aum_usd_mm: 62000, performance_pct: 7.4, volume_avg_mm: 9100 },
  { rank: 6, symbol: "AGG", name: "iShares Core US Aggregate Bond", category: "asset_class", flow_usd_mm: 3800, flow_pct_aum: 3.45, aum_usd_mm: 110000, performance_pct: 1.2, volume_avg_mm: 6800 },
  { rank: 7, symbol: "IVV", name: "iShares Core S&P 500 ETF", category: "regional", flow_usd_mm: 3500, flow_pct_aum: 0.89, aum_usd_mm: 393000, performance_pct: 5.8, volume_avg_mm: 4500 },
  { rank: 8, symbol: "VTI", name: "Vanguard Total Stock Market ETF", category: "regional", flow_usd_mm: 3200, flow_pct_aum: 0.92, aum_usd_mm: 348000, performance_pct: 5.5, volume_avg_mm: 3800 },
  { rank: 9, symbol: "BITO", name: "ProShares Bitcoin Strategy ETF", category: "asset_class", flow_usd_mm: 2800, flow_pct_aum: 73.7, aum_usd_mm: 3800, performance_pct: 15.2, volume_avg_mm: 12000 },
  { rank: 10, symbol: "EEM", name: "iShares MSCI Emerging Markets", category: "regional", flow_usd_mm: 2400, flow_pct_aum: 9.23, aum_usd_mm: 26000, performance_pct: 2.3, volume_avg_mm: 38000 },
  { rank: 11, symbol: "XLV", name: "Health Care Select Sector SPDR", category: "sector", flow_usd_mm: 2200, flow_pct_aum: 5.79, aum_usd_mm: 38000, performance_pct: 4.1, volume_avg_mm: 9800 },
  { rank: 12, symbol: "HYG", name: "iShares iBoxx High Yield Corp Bond", category: "asset_class", flow_usd_mm: 1900, flow_pct_aum: 10.56, aum_usd_mm: 18000, performance_pct: 1.8, volume_avg_mm: 22000 },
  { rank: 13, symbol: "XLF", name: "Financial Select Sector SPDR", category: "sector", flow_usd_mm: 1700, flow_pct_aum: 4.15, aum_usd_mm: 41000, performance_pct: 2.9, volume_avg_mm: 52000 },
  { rank: 14, symbol: "VWO", name: "Vanguard FTSE Emerging Markets", category: "regional", flow_usd_mm: 1500, flow_pct_aum: 1.92, aum_usd_mm: 78000, performance_pct: 2.1, volume_avg_mm: 11000 },
  { rank: 15, symbol: "XLC", name: "Communication Services Select Sector SPDR", category: "sector", flow_usd_mm: 1200, flow_pct_aum: 7.5, aum_usd_mm: 16000, performance_pct: 3.4, volume_avg_mm: 5200 },
  { rank: 16, symbol: "TLT", name: "iShares 20+ Year Treasury Bond", category: "asset_class", flow_usd_mm: 1100, flow_pct_aum: 2.89, aum_usd_mm: 38000, performance_pct: -1.2, volume_avg_mm: 18000 },
  { rank: 17, symbol: "XLI", name: "Industrial Select Sector SPDR", category: "sector", flow_usd_mm: 950, flow_pct_aum: 5.14, aum_usd_mm: 18500, performance_pct: 0.8, volume_avg_mm: 12000 },
  { rank: 18, symbol: "SMH", name: "VanEck Semiconductor ETF", category: "sector", flow_usd_mm: 880, flow_pct_aum: 5.18, aum_usd_mm: 17000, performance_pct: 12.5, volume_avg_mm: 7800 },
  { rank: 19, symbol: "LQD", name: "iShares iBoxx Investment Grade Corp Bond", category: "asset_class", flow_usd_mm: 750, flow_pct_aum: 2.08, aum_usd_mm: 36000, performance_pct: 0.9, volume_avg_mm: 15000 },
  { rank: 20, symbol: "XLB", name: "Materials Select Sector SPDR", category: "sector", flow_usd_mm: 620, flow_pct_aum: 8.61, aum_usd_mm: 7200, performance_pct: 0.3, volume_avg_mm: 5800 },
];

// モックデータ: アウトフローランキング
const MOCK_OUTFLOW_RANKINGS: EtfRankingItem[] = [
  { rank: 1, symbol: "SHV", name: "iShares Short Treasury Bond", category: "asset_class", flow_usd_mm: -8500, flow_pct_aum: -4.72, aum_usd_mm: 180000, performance_pct: 0.4, volume_avg_mm: 2800 },
  { rank: 2, symbol: "EFA", name: "iShares MSCI EAFE ETF", category: "regional", flow_usd_mm: -4200, flow_pct_aum: -7.24, aum_usd_mm: 58000, performance_pct: -1.8, volume_avg_mm: 18000 },
  { rank: 3, symbol: "VNQ", name: "Vanguard Real Estate ETF", category: "asset_class", flow_usd_mm: -3100, flow_pct_aum: -9.69, aum_usd_mm: 32000, performance_pct: -3.8, volume_avg_mm: 4200 },
  { rank: 4, symbol: "FXI", name: "iShares China Large-Cap ETF", category: "regional", flow_usd_mm: -2800, flow_pct_aum: -35.0, aum_usd_mm: 8000, performance_pct: -8.5, volume_avg_mm: 32000 },
  { rank: 5, symbol: "XLRE", name: "Real Estate Select Sector SPDR", category: "sector", flow_usd_mm: -2100, flow_pct_aum: -24.71, aum_usd_mm: 8500, performance_pct: -4.5, volume_avg_mm: 5100 },
  { rank: 6, symbol: "XLE", name: "Energy Select Sector SPDR", category: "sector", flow_usd_mm: -1800, flow_pct_aum: -5.63, aum_usd_mm: 32000, performance_pct: -3.2, volume_avg_mm: 18000 },
  { rank: 7, symbol: "EWJ", name: "iShares MSCI Japan ETF", category: "regional", flow_usd_mm: -1500, flow_pct_aum: -11.54, aum_usd_mm: 13000, performance_pct: -2.1, volume_avg_mm: 6200 },
  { rank: 8, symbol: "XLU", name: "Utilities Select Sector SPDR", category: "sector", flow_usd_mm: -720, flow_pct_aum: -4.97, aum_usd_mm: 14500, performance_pct: -1.1, volume_avg_mm: 11000 },
  { rank: 9, symbol: "DBC", name: "Invesco DB Commodity Tracking", category: "asset_class", flow_usd_mm: -450, flow_pct_aum: -10.71, aum_usd_mm: 4200, performance_pct: -2.1, volume_avg_mm: 3200 },
  { rank: 10, symbol: "XLP", name: "Consumer Staples Select Sector SPDR", category: "sector", flow_usd_mm: -480, flow_pct_aum: -2.82, aum_usd_mm: 17000, performance_pct: -0.5, volume_avg_mm: 11000 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const direction = searchParams.get("direction") ?? "inflow";
    const limitParam = searchParams.get("limit") ?? "20";
    const category = searchParams.get("category");
    const period = (searchParams.get("period") ?? "1m") as Period;

    // パラメータの妥当性チェック
    if (!["inflow", "outflow"].includes(direction)) {
      return errorResponse("INVALID_DIRECTION", `無効な方向指定: ${direction}`, 400);
    }

    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return errorResponse("INVALID_LIMIT", "limitは1〜100の範囲で指定してください", 400);
    }

    const validPeriods: Period[] = ["1d", "1w", "1m", "3m", "6m", "1y", "5y"];
    if (!validPeriods.includes(period)) {
      return errorResponse("INVALID_PERIOD", `無効な期間指定: ${period}`, 400);
    }

    const { from, to } = periodToDateRange(period);

    // 方向に応じたランキングデータを選択
    let rankings = direction === "inflow" ? MOCK_INFLOW_RANKINGS : MOCK_OUTFLOW_RANKINGS;

    // カテゴリフィルタ
    if (category) {
      const validCategories = ["regional", "sector", "asset_class"];
      if (!validCategories.includes(category)) {
        return errorResponse("INVALID_CATEGORY", `無効なカテゴリ: ${category}`, 400);
      }
      rankings = rankings.filter((r) => r.category === category);
      // ランク番号を振り直す
      rankings = rankings.map((r, i) => ({ ...r, rank: i + 1 }));
    }

    // limit適用
    rankings = rankings.slice(0, limit);

    return successResponse(
      {
        direction,
        rankings,
        total_count: rankings.length,
      },
      {
        period: { from: from.toISOString(), to: to.toISOString() },
        data_quality: "full",
      }
    );
  } catch (error) {
    console.error("ETFランキングAPI エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "ETFランキングデータの取得に失敗しました",
      500
    );
  }
}
