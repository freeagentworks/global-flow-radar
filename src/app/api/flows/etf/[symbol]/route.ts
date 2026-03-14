import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  periodToDateRange,
} from "@/lib/api/response";
import type { Period } from "@/types";

// ============================================
// ETF個別詳細 API
// 指定シンボルのETF詳細情報とタイムシリーズを返却
// ============================================

/** ETF詳細型 */
interface EtfDetailResponse {
  symbol: string;
  name: string;
  category: string;
  issuer: string;
  expense_ratio: number;
  inception_date: string;
  fund_flow_usd_mm: number;
  fund_flow_pct_aum: number;
  aum_usd_mm: number;
  volume_avg: number;
  price: number;
  price_change_pct: number;
  nav: number;
  premium_discount: number;
  holdings_count: number;
  timeseries: EtfFlowTimeseries[];
}

/** フロータイムシリーズ型 */
interface EtfFlowTimeseries {
  date: string;
  flow_usd_mm: number;
  cumulative_flow_usd_mm: number;
  price: number;
  volume: number;
}

// モックETFデータベース
const MOCK_ETF_DB: Record<string, Omit<EtfDetailResponse, "timeseries">> = {
  SPY: {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    category: "regional",
    issuer: "State Street",
    expense_ratio: 0.0945,
    inception_date: "1993-01-22",
    fund_flow_usd_mm: 9800,
    fund_flow_pct_aum: 1.88,
    aum_usd_mm: 520000,
    volume_avg: 78000000,
    price: 582.45,
    price_change_pct: 1.24,
    nav: 582.18,
    premium_discount: 0.046,
    holdings_count: 503,
  },
  QQQ: {
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    category: "regional",
    issuer: "Invesco",
    expense_ratio: 0.2,
    inception_date: "1999-03-10",
    fund_flow_usd_mm: 6200,
    fund_flow_pct_aum: 2.58,
    aum_usd_mm: 240000,
    volume_avg: 52000000,
    price: 498.72,
    price_change_pct: 1.85,
    nav: 498.55,
    premium_discount: 0.034,
    holdings_count: 101,
  },
  EEM: {
    symbol: "EEM",
    name: "iShares MSCI Emerging Markets ETF",
    category: "regional",
    issuer: "BlackRock",
    expense_ratio: 0.68,
    inception_date: "2003-04-07",
    fund_flow_usd_mm: 2400,
    fund_flow_pct_aum: 9.23,
    aum_usd_mm: 26000,
    volume_avg: 38000000,
    price: 42.85,
    price_change_pct: 0.62,
    nav: 42.78,
    premium_discount: 0.164,
    holdings_count: 1275,
  },
  GLD: {
    symbol: "GLD",
    name: "SPDR Gold Shares",
    category: "asset_class",
    issuer: "State Street",
    expense_ratio: 0.4,
    inception_date: "2004-11-18",
    fund_flow_usd_mm: 4200,
    fund_flow_pct_aum: 6.77,
    aum_usd_mm: 62000,
    volume_avg: 9100000,
    price: 238.5,
    price_change_pct: 2.15,
    nav: 238.42,
    premium_discount: 0.034,
    holdings_count: 1,
  },
  XLK: {
    symbol: "XLK",
    name: "Technology Select Sector SPDR Fund",
    category: "sector",
    issuer: "State Street",
    expense_ratio: 0.09,
    inception_date: "1998-12-16",
    fund_flow_usd_mm: 4800,
    fund_flow_pct_aum: 7.74,
    aum_usd_mm: 62000,
    volume_avg: 8900000,
    price: 221.35,
    price_change_pct: 2.42,
    nav: 221.28,
    premium_discount: 0.032,
    holdings_count: 64,
  },
};

// タイムシリーズ生成（30日分）
function generateTimeseries(basePrice: number, baseFlowMm: number): EtfFlowTimeseries[] {
  const series: EtfFlowTimeseries[] = [];
  let cumulative = 0;

  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // 日次フロー（ベースの日割り +/- ランダム変動）
    const dailyFlow = Math.round((baseFlowMm / 30) + Math.sin(i * 0.5) * (baseFlowMm / 60));
    cumulative += dailyFlow;

    // 価格変動シミュレーション
    const priceVariation = basePrice * (1 + Math.sin(i * 0.3) * 0.02);

    series.push({
      date: dateStr,
      flow_usd_mm: dailyFlow,
      cumulative_flow_usd_mm: cumulative,
      price: Math.round(priceVariation * 100) / 100,
      volume: Math.round(50000000 + Math.random() * 30000000),
    });
  }

  return series;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();

    // シンボル存在チェック
    const etfData = MOCK_ETF_DB[upperSymbol];
    if (!etfData) {
      return errorResponse(
        "ETF_NOT_FOUND",
        `指定されたETFが見つかりません: ${upperSymbol}`,
        404
      );
    }

    const { searchParams } = request.nextUrl;
    const period = (searchParams.get("period") ?? "1m") as Period;
    const { from, to } = periodToDateRange(period);

    // タイムシリーズを生成
    const timeseries = generateTimeseries(etfData.price, etfData.fund_flow_usd_mm);

    const response: EtfDetailResponse = {
      ...etfData,
      timeseries,
    };

    return successResponse(response, {
      period: { from: from.toISOString(), to: to.toISOString() },
      data_quality: "full",
    });
  } catch (error) {
    console.error("ETF詳細API エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "ETF詳細データの取得に失敗しました",
      500
    );
  }
}
