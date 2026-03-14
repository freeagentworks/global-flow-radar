import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/response";

// ============================================
// トラッキング対象ETF一覧 API
// カテゴリ別にトラッキングしているETFリストを返却
// ============================================

/** ETFリスト項目型 */
interface EtfListItem {
  symbol: string;
  name: string;
  category: "regional" | "sector" | "asset_class";
  sub_category: string;
  issuer: string;
  aum_usd_mm: number;
  expense_ratio: number;
}

// モックデータ: トラッキング対象ETFリスト
const MOCK_ETF_LIST: EtfListItem[] = [
  // 地域ETF
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", category: "regional", sub_category: "US", issuer: "State Street", aum_usd_mm: 520000, expense_ratio: 0.0945 },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", category: "regional", sub_category: "US", issuer: "Vanguard", aum_usd_mm: 401000, expense_ratio: 0.03 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", category: "regional", sub_category: "US", issuer: "Invesco", aum_usd_mm: 240000, expense_ratio: 0.2 },
  { symbol: "IVV", name: "iShares Core S&P 500 ETF", category: "regional", sub_category: "US", issuer: "BlackRock", aum_usd_mm: 393000, expense_ratio: 0.03 },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", category: "regional", sub_category: "US", issuer: "Vanguard", aum_usd_mm: 348000, expense_ratio: 0.03 },
  { symbol: "EFA", name: "iShares MSCI EAFE ETF", category: "regional", sub_category: "EU", issuer: "BlackRock", aum_usd_mm: 58000, expense_ratio: 0.32 },
  { symbol: "VGK", name: "Vanguard FTSE Europe ETF", category: "regional", sub_category: "EU", issuer: "Vanguard", aum_usd_mm: 18000, expense_ratio: 0.08 },
  { symbol: "EWJ", name: "iShares MSCI Japan ETF", category: "regional", sub_category: "JP", issuer: "BlackRock", aum_usd_mm: 13000, expense_ratio: 0.5 },
  { symbol: "FXI", name: "iShares China Large-Cap ETF", category: "regional", sub_category: "CN", issuer: "BlackRock", aum_usd_mm: 8000, expense_ratio: 0.74 },
  { symbol: "EEM", name: "iShares MSCI Emerging Markets ETF", category: "regional", sub_category: "EM", issuer: "BlackRock", aum_usd_mm: 26000, expense_ratio: 0.68 },
  { symbol: "VWO", name: "Vanguard FTSE Emerging Markets ETF", category: "regional", sub_category: "EM", issuer: "Vanguard", aum_usd_mm: 78000, expense_ratio: 0.08 },

  // セクターETF
  { symbol: "XLK", name: "Technology Select Sector SPDR", category: "sector", sub_category: "tech", issuer: "State Street", aum_usd_mm: 62000, expense_ratio: 0.09 },
  { symbol: "XLV", name: "Health Care Select Sector SPDR", category: "sector", sub_category: "healthcare", issuer: "State Street", aum_usd_mm: 38000, expense_ratio: 0.09 },
  { symbol: "XLF", name: "Financial Select Sector SPDR", category: "sector", sub_category: "financials", issuer: "State Street", aum_usd_mm: 41000, expense_ratio: 0.09 },
  { symbol: "XLY", name: "Consumer Discretionary Select Sector SPDR", category: "sector", sub_category: "consumer_disc", issuer: "State Street", aum_usd_mm: 22000, expense_ratio: 0.09 },
  { symbol: "XLI", name: "Industrial Select Sector SPDR", category: "sector", sub_category: "industrials", issuer: "State Street", aum_usd_mm: 18500, expense_ratio: 0.09 },
  { symbol: "XLC", name: "Communication Services Select Sector SPDR", category: "sector", sub_category: "comm_services", issuer: "State Street", aum_usd_mm: 16000, expense_ratio: 0.09 },
  { symbol: "XLP", name: "Consumer Staples Select Sector SPDR", category: "sector", sub_category: "consumer_staples", issuer: "State Street", aum_usd_mm: 17000, expense_ratio: 0.09 },
  { symbol: "XLE", name: "Energy Select Sector SPDR", category: "sector", sub_category: "energy", issuer: "State Street", aum_usd_mm: 32000, expense_ratio: 0.09 },
  { symbol: "XLU", name: "Utilities Select Sector SPDR", category: "sector", sub_category: "utilities", issuer: "State Street", aum_usd_mm: 14500, expense_ratio: 0.09 },
  { symbol: "XLRE", name: "Real Estate Select Sector SPDR", category: "sector", sub_category: "real_estate", issuer: "State Street", aum_usd_mm: 8500, expense_ratio: 0.09 },
  { symbol: "XLB", name: "Materials Select Sector SPDR", category: "sector", sub_category: "materials", issuer: "State Street", aum_usd_mm: 7200, expense_ratio: 0.09 },
  { symbol: "SMH", name: "VanEck Semiconductor ETF", category: "sector", sub_category: "tech", issuer: "VanEck", aum_usd_mm: 17000, expense_ratio: 0.35 },

  // アセットクラスETF
  { symbol: "AGG", name: "iShares Core US Aggregate Bond ETF", category: "asset_class", sub_category: "us_bond", issuer: "BlackRock", aum_usd_mm: 110000, expense_ratio: 0.03 },
  { symbol: "GLD", name: "SPDR Gold Shares", category: "asset_class", sub_category: "gold", issuer: "State Street", aum_usd_mm: 62000, expense_ratio: 0.4 },
  { symbol: "SHV", name: "iShares Short Treasury Bond ETF", category: "asset_class", sub_category: "cash", issuer: "BlackRock", aum_usd_mm: 180000, expense_ratio: 0.15 },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", category: "asset_class", sub_category: "us_bond", issuer: "BlackRock", aum_usd_mm: 38000, expense_ratio: 0.15 },
  { symbol: "HYG", name: "iShares iBoxx High Yield Corp Bond ETF", category: "asset_class", sub_category: "high_yield", issuer: "BlackRock", aum_usd_mm: 18000, expense_ratio: 0.49 },
  { symbol: "LQD", name: "iShares iBoxx Investment Grade Corp Bond ETF", category: "asset_class", sub_category: "us_bond", issuer: "BlackRock", aum_usd_mm: 36000, expense_ratio: 0.14 },
  { symbol: "VNQ", name: "Vanguard Real Estate ETF", category: "asset_class", sub_category: "reit", issuer: "Vanguard", aum_usd_mm: 32000, expense_ratio: 0.12 },
  { symbol: "BITO", name: "ProShares Bitcoin Strategy ETF", category: "asset_class", sub_category: "crypto", issuer: "ProShares", aum_usd_mm: 3800, expense_ratio: 0.95 },
  { symbol: "DBC", name: "Invesco DB Commodity Tracking", category: "asset_class", sub_category: "commodity", issuer: "Invesco", aum_usd_mm: 4200, expense_ratio: 0.87 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");

    let etfs = MOCK_ETF_LIST;

    // カテゴリフィルタ
    if (category) {
      const validCategories = ["regional", "sector", "asset_class"];
      if (!validCategories.includes(category)) {
        return errorResponse(
          "INVALID_CATEGORY",
          `無効なカテゴリ: ${category}。有効値: regional, sector, asset_class`,
          400
        );
      }
      etfs = etfs.filter((e) => e.category === category);
    }

    return successResponse({
      etfs,
      total_count: etfs.length,
    });
  } catch (error) {
    console.error("ETFリストAPI エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "ETFリストデータの取得に失敗しました",
      500
    );
  }
}
