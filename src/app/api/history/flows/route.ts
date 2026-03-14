import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import type { FlowType } from "@/types";

// ============================================
// ヒストリカルフロー API
// 過去の資金フロータイムシリーズを返却
// ============================================

/** ヒストリカルフローポイント型 */
interface FlowDataPoint {
  date: string;
  flow_score: number;
  flow_usd_mm: number;
  cumulative_usd_mm: number;
  volume_usd_mm: number;
}

/** ヒストリカルフローレスポンス型 */
interface HistoricalFlowResponse {
  flow_type: FlowType;
  target_id: string;
  interval: string;
  timeseries: FlowDataPoint[];
}

// タイムシリーズデータ生成関数
function generateHistoricalTimeseries(
  from: Date,
  to: Date,
  interval: string,
  baseFlow: number
): FlowDataPoint[] {
  const series: FlowDataPoint[] = [];
  const current = new Date(from);
  let cumulative = 0;

  // インターバルに応じたステップ（ミリ秒）
  const stepMs =
    interval === "1d" ? 86400000 :
    interval === "1w" ? 604800000 :
    interval === "1m" ? 2592000000 :
    86400000; // デフォルトは日次

  while (current <= to) {
    const dayIndex = series.length;
    // トレンド + 周期性 + ノイズを組み合わせてリアルなデータを生成
    const trend = baseFlow * (1 + dayIndex * 0.002);
    const seasonal = Math.sin(dayIndex * 0.15) * baseFlow * 0.3;
    const noise = (Math.random() - 0.5) * baseFlow * 0.2;
    const dailyFlow = Math.round(trend + seasonal + noise);

    cumulative += dailyFlow;

    series.push({
      date: current.toISOString().split("T")[0],
      flow_score: Math.round(50 + Math.sin(dayIndex * 0.1) * 30 + (Math.random() - 0.5) * 10),
      flow_usd_mm: dailyFlow,
      cumulative_usd_mm: cumulative,
      volume_usd_mm: Math.round(Math.abs(dailyFlow) * (2 + Math.random())),
    });

    current.setTime(current.getTime() + stepMs);
  }

  return series;
}

// フロータイプ・ターゲットIDに応じたベースフロー値
const BASE_FLOWS: Record<string, Record<string, number>> = {
  region: { US: 600, JP: -100, EU: -250, CN: -300, EM: 65 },
  sector: { tech: 400, healthcare: 190, financials: 100, energy: -60, real_estate: -70 },
  asset_class: { us_equity: 750, us_bond: 300, gold: 200, crypto: 70, cash: -400 },
  etf: { SPY: 320, QQQ: 200, EEM: 80, GLD: 140, XLK: 160 },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const flowType = searchParams.get("flow_type") as FlowType | null;
    const targetId = searchParams.get("target_id");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const interval = searchParams.get("interval") ?? "1d";

    // 必須パラメータチェック
    if (!flowType) {
      return errorResponse("MISSING_FLOW_TYPE", "flow_typeパラメータは必須です", 400);
    }
    if (!targetId) {
      return errorResponse("MISSING_TARGET_ID", "target_idパラメータは必須です", 400);
    }

    // flow_typeの妥当性チェック
    const validFlowTypes: FlowType[] = ["region", "sector", "asset_class", "etf"];
    if (!validFlowTypes.includes(flowType)) {
      return errorResponse("INVALID_FLOW_TYPE", `無効なフロータイプ: ${flowType}`, 400);
    }

    // インターバルの妥当性チェック
    const validIntervals = ["1d", "1w", "1m"];
    if (!validIntervals.includes(interval)) {
      return errorResponse("INVALID_INTERVAL", `無効なインターバル: ${interval}。有効値: 1d, 1w, 1m`, 400);
    }

    // 日付パースまたはデフォルト（過去1年）
    const to = toParam ? new Date(toParam) : new Date();
    const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 365 * 86400000);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return errorResponse("INVALID_DATE", "日付のフォーマットが不正です（ISO 8601形式を使用してください）", 400);
    }

    if (from >= to) {
      return errorResponse("INVALID_DATE_RANGE", "fromはtoより前の日付を指定してください", 400);
    }

    // ベースフロー値を取得（不明なターゲットの場合はデフォルト値）
    const baseFlow = BASE_FLOWS[flowType]?.[targetId] ?? 100;
    const timeseries = generateHistoricalTimeseries(from, to, interval, baseFlow);

    const response: HistoricalFlowResponse = {
      flow_type: flowType,
      target_id: targetId,
      interval,
      timeseries,
    };

    return successResponse(response, {
      period: { from: from.toISOString(), to: to.toISOString() },
      data_quality: "full",
    });
  } catch (error) {
    console.error("ヒストリカルフローAPI エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "ヒストリカルフローデータの取得に失敗しました",
      500
    );
  }
}
