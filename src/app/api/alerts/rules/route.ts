import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import type { FlowType } from "@/types";

// ============================================
// アラートルール API
// アラートルールの取得・作成を処理
// ============================================

/** アラートルール型 */
interface AlertRuleResponse {
  id: string;
  rule_name: string;
  flow_type: FlowType;
  target_id: string;
  target_name: string;
  condition: "gt" | "lt" | "abs_gt" | "pct_change_gt";
  threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_triggered_at: string | null;
  trigger_count: number;
}

/** アラートルール作成リクエスト型 */
interface CreateAlertRuleRequest {
  rule_name: string;
  flow_type: FlowType;
  target_id: string;
  condition: "gt" | "lt" | "abs_gt" | "pct_change_gt";
  threshold: number;
}

// モックデータ: アラートルール
const MOCK_RULES: AlertRuleResponse[] = [
  {
    id: "rule_001",
    rule_name: "米国株への大規模資金流入",
    flow_type: "region",
    target_id: "US",
    target_name: "United States",
    condition: "gt",
    threshold: 10000,
    is_active: true,
    created_at: "2025-12-01T09:00:00Z",
    updated_at: "2025-12-01T09:00:00Z",
    last_triggered_at: "2026-03-10T14:30:00Z",
    trigger_count: 5,
  },
  {
    id: "rule_002",
    rule_name: "テクノロジーセクター急変動",
    flow_type: "sector",
    target_id: "tech",
    target_name: "Information Technology",
    condition: "abs_gt",
    threshold: 5000,
    is_active: true,
    created_at: "2025-12-15T10:30:00Z",
    updated_at: "2026-01-05T08:00:00Z",
    last_triggered_at: "2026-03-12T16:45:00Z",
    trigger_count: 8,
  },
  {
    id: "rule_003",
    rule_name: "中国からの資金流出警告",
    flow_type: "region",
    target_id: "CN",
    target_name: "China",
    condition: "lt",
    threshold: -5000,
    is_active: true,
    created_at: "2026-01-10T11:00:00Z",
    updated_at: "2026-01-10T11:00:00Z",
    last_triggered_at: "2026-03-08T09:15:00Z",
    trigger_count: 3,
  },
  {
    id: "rule_004",
    rule_name: "金ETF フロー変動率アラート",
    flow_type: "etf",
    target_id: "GLD",
    target_name: "SPDR Gold Shares",
    condition: "pct_change_gt",
    threshold: 15,
    is_active: false,
    created_at: "2026-02-01T13:00:00Z",
    updated_at: "2026-02-20T09:00:00Z",
    last_triggered_at: null,
    trigger_count: 0,
  },
  {
    id: "rule_005",
    rule_name: "新興国フロー急増",
    flow_type: "region",
    target_id: "EM",
    target_name: "Emerging Markets",
    condition: "gt",
    threshold: 3000,
    is_active: true,
    created_at: "2026-02-15T14:00:00Z",
    updated_at: "2026-02-15T14:00:00Z",
    last_triggered_at: "2026-03-05T11:20:00Z",
    trigger_count: 2,
  },
];

export async function GET(_request: NextRequest) {
  try {
    return successResponse({
      rules: MOCK_RULES,
      total_count: MOCK_RULES.length,
    });
  } catch (error) {
    console.error("アラートルール取得API エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "アラートルールの取得に失敗しました",
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // リクエストボディの解析
    let body: CreateAlertRuleRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_JSON", "リクエストボディのJSON解析に失敗しました", 400);
    }

    // 必須フィールドのバリデーション
    const { rule_name, flow_type, target_id, condition, threshold } = body;

    if (!rule_name || !flow_type || !target_id || !condition || threshold === undefined) {
      return errorResponse(
        "MISSING_FIELDS",
        "必須フィールドが不足しています: rule_name, flow_type, target_id, condition, threshold",
        400
      );
    }

    // flow_typeの妥当性チェック
    const validFlowTypes: FlowType[] = ["region", "sector", "asset_class", "etf"];
    if (!validFlowTypes.includes(flow_type)) {
      return errorResponse("INVALID_FLOW_TYPE", `無効なフロータイプ: ${flow_type}`, 400);
    }

    // conditionの妥当性チェック
    const validConditions = ["gt", "lt", "abs_gt", "pct_change_gt"];
    if (!validConditions.includes(condition)) {
      return errorResponse("INVALID_CONDITION", `無効な条件: ${condition}`, 400);
    }

    // モックレスポンス: 新規ルールを作成した想定
    const now = new Date().toISOString();
    const newRule: AlertRuleResponse = {
      id: `rule_${String(MOCK_RULES.length + 1).padStart(3, "0")}`,
      rule_name,
      flow_type,
      target_id,
      target_name: target_id,
      condition,
      threshold,
      is_active: true,
      created_at: now,
      updated_at: now,
      last_triggered_at: null,
      trigger_count: 0,
    };

    return successResponse(newRule);
  } catch (error) {
    console.error("アラートルール作成API エラー:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "アラートルールの作成に失敗しました",
      500
    );
  }
}
