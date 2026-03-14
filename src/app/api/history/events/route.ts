import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/response";

// ============================================
// マーケットイベント履歴 API
// 過去の重要な市場イベント一覧を返却
// ============================================

/** マーケットイベント型 */
interface MarketEvent {
  id: string;
  name_en: string;
  name_ja: string;
  date_start: string;
  date_end: string | null;
  category: "crisis" | "policy" | "geopolitical" | "pandemic" | "structural";
  severity: "high" | "medium" | "low";
  description_ja: string;
  sp500_impact_pct: number;
  flow_impact_summary: string;
}

// モックデータ: 主要マーケットイベント
const MOCK_EVENTS: MarketEvent[] = [
  {
    id: "evt_001",
    name_en: "Lehman Brothers Collapse",
    name_ja: "リーマンショック",
    date_start: "2008-09-15",
    date_end: "2009-03-09",
    category: "crisis",
    severity: "high",
    description_ja: "米大手投資銀行リーマン・ブラザーズの破綻を契機とした世界的金融危機",
    sp500_impact_pct: -56.8,
    flow_impact_summary: "米国株から大規模な資金流出、安全資産（米国債・金）へ避難",
  },
  {
    id: "evt_002",
    name_en: "European Sovereign Debt Crisis",
    name_ja: "欧州債務危機",
    date_start: "2010-04-23",
    date_end: "2012-07-26",
    category: "crisis",
    severity: "high",
    description_ja: "ギリシャを発端とする欧州各国の財政危機",
    sp500_impact_pct: -16.0,
    flow_impact_summary: "欧州からの資金流出、米国・新興国への分散",
  },
  {
    id: "evt_003",
    name_en: "China Stock Market Crash",
    name_ja: "中国株式市場暴落",
    date_start: "2015-06-12",
    date_end: "2016-02-12",
    category: "crisis",
    severity: "medium",
    description_ja: "中国株式バブルの崩壊と人民元切り下げ",
    sp500_impact_pct: -14.2,
    flow_impact_summary: "新興国・中国から大規模資金流出、米国債への避難",
  },
  {
    id: "evt_004",
    name_en: "Brexit Referendum",
    name_ja: "ブレグジット国民投票",
    date_start: "2016-06-23",
    date_end: null,
    category: "geopolitical",
    severity: "medium",
    description_ja: "英国のEU離脱を決定した国民投票",
    sp500_impact_pct: -5.3,
    flow_impact_summary: "欧州株・英ポンド建て資産から短期的な資金流出",
  },
  {
    id: "evt_005",
    name_en: "US-China Trade War Escalation",
    name_ja: "米中貿易戦争激化",
    date_start: "2018-03-22",
    date_end: "2020-01-15",
    category: "geopolitical",
    severity: "medium",
    description_ja: "米中間の追加関税発動を中心とする貿易摩擦",
    sp500_impact_pct: -19.8,
    flow_impact_summary: "中国・新興国から資金流出、米国内への回帰",
  },
  {
    id: "evt_006",
    name_en: "COVID-19 Pandemic",
    name_ja: "コロナショック",
    date_start: "2020-02-20",
    date_end: "2020-03-23",
    category: "pandemic",
    severity: "high",
    description_ja: "新型コロナウイルスのパンデミックによる世界的市場暴落",
    sp500_impact_pct: -33.9,
    flow_impact_summary: "全資産クラスから現金へ避難後、テック株・金に大規模流入",
  },
  {
    id: "evt_007",
    name_en: "Fed Rate Hike Cycle 2022",
    name_ja: "FRB利上げサイクル2022",
    date_start: "2022-03-16",
    date_end: "2023-07-26",
    category: "policy",
    severity: "high",
    description_ja: "インフレ対策としてのFRBによる急速な利上げ",
    sp500_impact_pct: -25.4,
    flow_impact_summary: "株式・債券から現金・短期債へシフト、テック株から大規模流出",
  },
  {
    id: "evt_008",
    name_en: "Silicon Valley Bank Collapse",
    name_ja: "シリコンバレー銀行破綻",
    date_start: "2023-03-10",
    date_end: "2023-03-20",
    category: "crisis",
    severity: "medium",
    description_ja: "米地方銀行の連鎖破綻と金融不安",
    sp500_impact_pct: -7.8,
    flow_impact_summary: "金融セクターから大規模流出、テック・金へ避難",
  },
  {
    id: "evt_009",
    name_en: "AI Investment Boom",
    name_ja: "AI投資ブーム",
    date_start: "2023-01-01",
    date_end: null,
    category: "structural",
    severity: "medium",
    description_ja: "生成AIの台頭による半導体・テクノロジーセクターへの投資集中",
    sp500_impact_pct: 42.5,
    flow_impact_summary: "テクノロジー・半導体セクターへ継続的な大規模資金流入",
  },
  {
    id: "evt_010",
    name_en: "Japan Yen Carry Trade Unwind",
    name_ja: "円キャリートレード巻き戻し",
    date_start: "2024-07-11",
    date_end: "2024-08-05",
    category: "structural",
    severity: "medium",
    description_ja: "日銀利上げと急激な円高による円キャリートレードの巻き戻し",
    sp500_impact_pct: -8.5,
    flow_impact_summary: "日本株・新興国から急激な資金流出、円建て資産へ回帰",
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const severity = searchParams.get("severity");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let events = MOCK_EVENTS;

    // カテゴリフィルタ
    if (category) {
      const validCategories = ["crisis", "policy", "geopolitical", "pandemic", "structural"];
      if (!validCategories.includes(category)) {
        return errorResponse(
          "INVALID_CATEGORY",
          `無効なカテゴリ: ${category}。有効値: crisis, policy, geopolitical, pandemic, structural`,
          400
        );
      }
      events = events.filter((e) => e.category === category);
    }

    // 重要度フィルタ
    if (severity) {
      const validSeverities = ["high", "medium", "low"];
      if (!validSeverities.includes(severity)) {
        return errorResponse("INVALID_SEVERITY", `無効な重要度: ${severity}`, 400);
      }
      events = events.filter((e) => e.severity === severity);
    }

    // 日付範囲フィルタ
    if (fromParam) {
      const fromDate = new Date(fromParam);
      if (isNaN(fromDate.getTime())) {
        return errorResponse("INVALID_DATE", "fromの日付フォーマットが不正です", 400);
      }
      events = events.filter((e) => new Date(e.date_start) >= fromDate);
    }

    if (toParam) {
      const toDate = new Date(toParam);
      if (isNaN(toDate.getTime())) {
        return errorResponse("INVALID_DATE", "toの日付フォーマットが不正です", 400);
      }
      events = events.filter((e) => new Date(e.date_start) <= toDate);
    }

    // 新しい順にソート
    events.sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());

    return successResponse({
      events,
      total_count: events.length,
    });
  } catch (error) {
    console.error("マーケットイベントAPI エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "マーケットイベントデータの取得に失敗しました",
      500
    );
  }
}
