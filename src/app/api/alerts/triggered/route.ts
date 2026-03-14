import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  periodToDateRange,
} from "@/lib/api/response";
import type { Period } from "@/types";

// ============================================
// トリガー済みアラート API
// 発火したアラートの履歴を返却
// ============================================

/** トリガー済みアラート型 */
interface TriggeredAlertResponse {
  id: string;
  rule_id: string;
  rule_name: string;
  flow_type: string;
  target_id: string;
  target_name: string;
  condition: string;
  threshold: number;
  actual_value: number;
  triggered_at: string;
  message: string;
  is_read: boolean;
  severity: "info" | "warning" | "critical";
}

// モックデータ: トリガー済みアラート
const MOCK_TRIGGERED: TriggeredAlertResponse[] = [
  {
    id: "trig_001",
    rule_id: "rule_002",
    rule_name: "テクノロジーセクター急変動",
    flow_type: "sector",
    target_id: "tech",
    target_name: "Information Technology",
    condition: "abs_gt",
    threshold: 5000,
    actual_value: 7200,
    triggered_at: "2026-03-12T16:45:00Z",
    message: "情報技術セクターへの資金流入が$7,200Mを超えました（閾値: $5,000M）",
    is_read: false,
    severity: "warning",
  },
  {
    id: "trig_002",
    rule_id: "rule_001",
    rule_name: "米国株への大規模資金流入",
    flow_type: "region",
    target_id: "US",
    target_name: "United States",
    condition: "gt",
    threshold: 10000,
    actual_value: 12800,
    triggered_at: "2026-03-10T14:30:00Z",
    message: "米国への資金流入が$12,800Mに達しました（閾値: $10,000M）",
    is_read: true,
    severity: "info",
  },
  {
    id: "trig_003",
    rule_id: "rule_003",
    rule_name: "中国からの資金流出警告",
    flow_type: "region",
    target_id: "CN",
    target_name: "China",
    condition: "lt",
    threshold: -5000,
    actual_value: -6800,
    triggered_at: "2026-03-08T09:15:00Z",
    message: "中国からの資金流出が-$6,800Mに達しました（閾値: -$5,000M）",
    is_read: true,
    severity: "critical",
  },
  {
    id: "trig_004",
    rule_id: "rule_005",
    rule_name: "新興国フロー急増",
    flow_type: "region",
    target_id: "EM",
    target_name: "Emerging Markets",
    condition: "gt",
    threshold: 3000,
    actual_value: 3450,
    triggered_at: "2026-03-05T11:20:00Z",
    message: "新興国への資金流入が$3,450Mに達しました（閾値: $3,000M）",
    is_read: true,
    severity: "info",
  },
  {
    id: "trig_005",
    rule_id: "rule_002",
    rule_name: "テクノロジーセクター急変動",
    flow_type: "sector",
    target_id: "tech",
    target_name: "Information Technology",
    condition: "abs_gt",
    threshold: 5000,
    actual_value: -5800,
    triggered_at: "2026-03-01T10:00:00Z",
    message: "情報技術セクターからの資金流出が-$5,800Mを記録しました（閾値: $5,000M）",
    is_read: true,
    severity: "warning",
  },
  {
    id: "trig_006",
    rule_id: "rule_001",
    rule_name: "米国株への大規模資金流入",
    flow_type: "region",
    target_id: "US",
    target_name: "United States",
    condition: "gt",
    threshold: 10000,
    actual_value: 11200,
    triggered_at: "2026-02-25T15:00:00Z",
    message: "米国への資金流入が$11,200Mに達しました（閾値: $10,000M）",
    is_read: true,
    severity: "info",
  },
  {
    id: "trig_007",
    rule_id: "rule_003",
    rule_name: "中国からの資金流出警告",
    flow_type: "region",
    target_id: "CN",
    target_name: "China",
    condition: "lt",
    threshold: -5000,
    actual_value: -7500,
    triggered_at: "2026-02-18T08:45:00Z",
    message: "中国からの資金流出が-$7,500Mに達しました（閾値: -$5,000M）",
    is_read: true,
    severity: "critical",
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const period = (searchParams.get("period") ?? "1m") as Period;
    const isReadParam = searchParams.get("is_read");
    const severity = searchParams.get("severity");

    // 期間の妥当性チェック
    const validPeriods: Period[] = ["1d", "1w", "1m", "3m", "6m", "1y", "5y"];
    if (!validPeriods.includes(period)) {
      return errorResponse("INVALID_PERIOD", `無効な期間指定: ${period}`, 400);
    }

    const { from, to } = periodToDateRange(period);

    let alerts = MOCK_TRIGGERED;

    // 期間フィルタ
    alerts = alerts.filter((a) => {
      const triggeredAt = new Date(a.triggered_at);
      return triggeredAt >= from && triggeredAt <= to;
    });

    // 既読フィルタ
    if (isReadParam !== null) {
      const isRead = isReadParam === "true";
      alerts = alerts.filter((a) => a.is_read === isRead);
    }

    // 重要度フィルタ
    if (severity) {
      const validSeverities = ["info", "warning", "critical"];
      if (!validSeverities.includes(severity)) {
        return errorResponse("INVALID_SEVERITY", `無効な重要度: ${severity}`, 400);
      }
      alerts = alerts.filter((a) => a.severity === severity);
    }

    // 新しい順にソート
    alerts.sort((a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime());

    return successResponse(
      {
        alerts,
        total_count: alerts.length,
        unread_count: alerts.filter((a) => !a.is_read).length,
      },
      {
        period: { from: from.toISOString(), to: to.toISOString() },
        data_quality: "full",
      }
    );
  } catch (error) {
    console.error("トリガー済みアラートAPI エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "トリガー済みアラートの取得に失敗しました",
      500
    );
  }
}
