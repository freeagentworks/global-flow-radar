import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/response";

// ============================================
// セクターマスターデータ API
// GICS 11セクターの基本情報を返却
// ============================================

/** セクターマスター型 */
interface SectorMaster {
  id: string;
  name_en: string;
  name_ja: string;
  gics_code: string;
  color: string;
  representative_etf: string;
  description_ja: string;
}

// モックデータ: GICS 11セクター マスター
const MOCK_SECTORS: SectorMaster[] = [
  {
    id: "tech",
    name_en: "Information Technology",
    name_ja: "情報技術",
    gics_code: "45",
    color: "#3B82F6",
    representative_etf: "XLK",
    description_ja: "ソフトウェア、ハードウェア、半導体、IT サービス",
  },
  {
    id: "healthcare",
    name_en: "Health Care",
    name_ja: "ヘルスケア",
    gics_code: "35",
    color: "#10B981",
    representative_etf: "XLV",
    description_ja: "製薬、バイオテクノロジー、医療機器、ヘルスケアサービス",
  },
  {
    id: "financials",
    name_en: "Financials",
    name_ja: "金融",
    gics_code: "40",
    color: "#F59E0B",
    representative_etf: "XLF",
    description_ja: "銀行、保険、資産運用、キャピタルマーケット",
  },
  {
    id: "consumer_disc",
    name_en: "Consumer Discretionary",
    name_ja: "一般消費財",
    gics_code: "25",
    color: "#EF4444",
    representative_etf: "XLY",
    description_ja: "自動車、小売、アパレル、ホテル・レストラン",
  },
  {
    id: "industrials",
    name_en: "Industrials",
    name_ja: "資本財",
    gics_code: "20",
    color: "#6366F1",
    representative_etf: "XLI",
    description_ja: "航空宇宙・防衛、建設、機械、輸送",
  },
  {
    id: "comm_services",
    name_en: "Communication Services",
    name_ja: "通信",
    gics_code: "50",
    color: "#EC4899",
    representative_etf: "XLC",
    description_ja: "メディア、エンターテインメント、通信サービス",
  },
  {
    id: "consumer_staples",
    name_en: "Consumer Staples",
    name_ja: "生活必需品",
    gics_code: "30",
    color: "#14B8A6",
    representative_etf: "XLP",
    description_ja: "食品・飲料、家庭用品、パーソナルケア",
  },
  {
    id: "energy",
    name_en: "Energy",
    name_ja: "エネルギー",
    gics_code: "10",
    color: "#F97316",
    representative_etf: "XLE",
    description_ja: "石油・ガス、エネルギー設備・サービス",
  },
  {
    id: "utilities",
    name_en: "Utilities",
    name_ja: "公益",
    gics_code: "55",
    color: "#84CC16",
    representative_etf: "XLU",
    description_ja: "電力、ガス、水道、再生可能エネルギー",
  },
  {
    id: "real_estate",
    name_en: "Real Estate",
    name_ja: "不動産",
    gics_code: "60",
    color: "#A855F7",
    representative_etf: "XLRE",
    description_ja: "REIT、不動産管理・開発",
  },
  {
    id: "materials",
    name_en: "Materials",
    name_ja: "素材",
    gics_code: "15",
    color: "#78716C",
    representative_etf: "XLB",
    description_ja: "化学、建設資材、包装、金属・鉱業",
  },
];

export async function GET(_request: NextRequest) {
  try {
    return successResponse({ sectors: MOCK_SECTORS });
  } catch (error) {
    console.error("セクターマスターAPI エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "セクターマスターデータの取得に失敗しました",
      500
    );
  }
}
