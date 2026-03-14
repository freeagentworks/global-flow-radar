import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/response";

// ============================================
// 地域マスターデータ API
// 地域の基本情報と地図描画用の座標を返却
// ============================================

/** 地域マスター型 */
interface RegionMaster {
  id: string;
  name_en: string;
  name_ja: string;
  latitude: number;
  longitude: number;
  color: string;
  market_cap_usd_tn: number;
  representative_etfs: string[];
}

// モックデータ: 地域マスター
const MOCK_REGIONS: RegionMaster[] = [
  {
    id: "US",
    name_en: "United States",
    name_ja: "米国",
    latitude: 39.8283,
    longitude: -98.5795,
    color: "#3B82F6",
    market_cap_usd_tn: 50.8,
    representative_etfs: ["SPY", "VOO", "IVV", "QQQ", "VTI"],
  },
  {
    id: "JP",
    name_en: "Japan",
    name_ja: "日本",
    latitude: 36.2048,
    longitude: 138.2529,
    color: "#EF4444",
    market_cap_usd_tn: 6.2,
    representative_etfs: ["EWJ", "DXJ", "HEWJ"],
  },
  {
    id: "EU",
    name_en: "Europe",
    name_ja: "欧州",
    latitude: 50.1109,
    longitude: 8.6821,
    color: "#10B981",
    market_cap_usd_tn: 14.5,
    representative_etfs: ["EFA", "VGK", "EZU", "HEDJ"],
  },
  {
    id: "CN",
    name_en: "China",
    name_ja: "中国",
    latitude: 35.8617,
    longitude: 104.1954,
    color: "#F59E0B",
    market_cap_usd_tn: 11.3,
    representative_etfs: ["FXI", "MCHI", "KWEB", "GXC"],
  },
  {
    id: "EM",
    name_en: "Emerging Markets",
    name_ja: "新興国",
    latitude: -14.235,
    longitude: 25.0,
    color: "#8B5CF6",
    market_cap_usd_tn: 8.9,
    representative_etfs: ["EEM", "VWO", "IEMG"],
  },
];

export async function GET(_request: NextRequest) {
  try {
    return successResponse({ regions: MOCK_REGIONS });
  } catch (error) {
    console.error("地域マスターAPI エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "地域マスターデータの取得に失敗しました",
      500
    );
  }
}
