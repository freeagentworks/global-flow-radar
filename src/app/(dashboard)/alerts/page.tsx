"use client";

import { useState } from "react";
import {
  useAlertRules,
  useDeleteAlertRule,
  useTriggeredAlerts,
} from "@/lib/hooks/use-alert-data";
import { useToastStore } from "@/components/ui/Toast";
import { AlertRuleForm } from "@/components/dashboard/AlertRuleForm";
import { ErrorFallback } from "@/components/ui/ErrorFallback";
import type { AlertRule, TriggeredAlert } from "@/types";

// ============================================
// アラート設定・履歴ページ（S-007）
// ルール管理タブと通知履歴タブを提供
// ============================================

type Tab = "rules" | "history";

// 条件ラベルマップ
const CONDITION_LABELS: Record<string, string> = {
  gt: "> (より大きい)",
  lt: "< (より小さい)",
  abs_gt: "|x| > (絶対値超過)",
  pct_change_gt: "変動率 > (%)",
};

// フロータイプラベルマップ
const FLOW_TYPE_LABELS: Record<string, string> = {
  region: "地域",
  sector: "セクター",
  asset_class: "資産クラス",
  etf: "ETF",
};

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("rules");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-text-primary">
        アラート設定
      </h1>

      {/* タブUI */}
      <div className="flex gap-1 rounded-lg border border-border bg-bg-card p-1">
        <button
          onClick={() => setActiveTab("rules")}
          className={`flex-1 rounded-md px-4 py-2 text-sm transition-colors ${
            activeTab === "rules"
              ? "bg-inflow/15 text-inflow border border-inflow/30"
              : "text-text-secondary hover:text-text-primary border border-transparent"
          }`}
        >
          ルール管理
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 rounded-md px-4 py-2 text-sm transition-colors ${
            activeTab === "history"
              ? "bg-inflow/15 text-inflow border border-inflow/30"
              : "text-text-secondary hover:text-text-primary border border-transparent"
          }`}
        >
          通知履歴
        </button>
      </div>

      {/* タブコンテンツ */}
      {activeTab === "rules" ? (
        <RulesTab showForm={showForm} setShowForm={setShowForm} />
      ) : (
        <HistoryTab />
      )}
    </div>
  );
}

// ============================================
// ルール管理タブ
// ============================================

function RulesTab({
  showForm,
  setShowForm,
}: {
  showForm: boolean;
  setShowForm: (v: boolean) => void;
}) {
  const { data: rules, isLoading, isError, refetch } = useAlertRules();
  const deleteMutation = useDeleteAlertRule();
  const addToast = useToastStore((s) => s.addToast);

  // ルール削除ハンドラー
  const handleDelete = async (rule: AlertRule) => {
    if (!confirm(`「${rule.rule_name}」を削除しますか？`)) return;

    try {
      await deleteMutation.mutateAsync(rule.id);
      addToast("アラートルールを削除しました", "success");
    } catch {
      addToast("アラートルールの削除に失敗しました", "error");
    }
  };

  // エラー表示
  if (isError) {
    return (
      <ErrorFallback
        message="データの取得に失敗しました"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 新規作成ボタン */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-inflow/20 border border-inflow/30 px-4 py-2 text-sm text-inflow hover:bg-inflow/30 transition-colors"
        >
          {showForm ? "閉じる" : "新規ルール作成"}
        </button>
      </div>

      {/* ルール作成フォーム */}
      {showForm && <AlertRuleForm onClose={() => setShowForm(false)} />}

      {/* ルール一覧 */}
      <div className="rounded-lg border border-border bg-bg-card">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-16 w-full rounded-md" />
            ))}
          </div>
        ) : rules && rules.length > 0 ? (
          <ul className="divide-y divide-border">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                {/* ルール情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {rule.rule_name}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                        rule.is_active
                          ? "bg-green-500/15 text-green-400"
                          : "bg-neutral-500/15 text-text-secondary"
                      }`}
                    >
                      {rule.is_active ? "有効" : "無効"}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {FLOW_TYPE_LABELS[rule.flow_type] ?? rule.flow_type}
                    {" / "}
                    {rule.target_id}
                    {" / "}
                    {CONDITION_LABELS[rule.condition] ?? rule.condition}
                    {" "}
                    <span className="font-mono-number">{rule.threshold}</span>
                  </p>
                </div>

                {/* 操作ボタン */}
                <button
                  onClick={() => handleDelete(rule)}
                  disabled={deleteMutation.isPending}
                  className="shrink-0 rounded-md border border-outflow/30 bg-outflow/10 px-3 py-1.5 text-xs text-outflow hover:bg-outflow/20 transition-colors disabled:opacity-50"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-sm text-text-secondary">
            アラートルールがありません
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 通知履歴タブ
// ============================================

function HistoryTab() {
  const {
    data: alerts,
    isLoading,
    isError,
    refetch,
  } = useTriggeredAlerts(50);

  // エラー表示
  if (isError) {
    return (
      <ErrorFallback
        message="データの取得に失敗しました"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-bg-card">
      {isLoading ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 w-full rounded-md" />
          ))}
        </div>
      ) : alerts && alerts.length > 0 ? (
        <ul className="divide-y divide-border">
          {alerts.map((alert: TriggeredAlert) => (
            <li key={alert.id} className="flex items-start gap-3 px-5 py-4">
              {/* 既読/未読インジケーター */}
              <span
                className={`mt-1.5 shrink-0 h-2 w-2 rounded-full ${
                  alert.is_read ? "bg-text-secondary/30" : "bg-inflow"
                }`}
              />

              {/* アラート情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-text-primary truncate">
                    {alert.rule_name}
                  </p>
                  {!alert.is_read && (
                    <span className="shrink-0 rounded-full bg-inflow/15 px-2 py-0.5 text-xs text-inflow">
                      未読
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {alert.message}
                </p>
              </div>

              {/* タイムスタンプ */}
              <time className="shrink-0 text-xs text-text-secondary font-mono-number">
                {new Date(alert.triggered_at).toLocaleString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-8 text-center text-sm text-text-secondary">
          通知履歴がありません
        </div>
      )}
    </div>
  );
}
