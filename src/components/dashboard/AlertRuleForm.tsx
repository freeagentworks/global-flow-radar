"use client";

import { useState } from "react";
import { useCreateAlertRule } from "@/lib/hooks/use-alert-data";
import { useToastStore } from "@/components/ui/Toast";

// ============================================
// アラートルール作成フォーム
// 新規アラートルールの入力と作成
// ============================================

interface AlertRuleFormProps {
  onClose: () => void;
}

export function AlertRuleForm({ onClose }: AlertRuleFormProps) {
  const [ruleName, setRuleName] = useState("");
  const [flowType, setFlowType] = useState("region");
  const [targetId, setTargetId] = useState("");
  const [condition, setCondition] = useState("gt");
  const [threshold, setThreshold] = useState<number>(0);

  const createMutation = useCreateAlertRule();
  const addToast = useToastStore((s) => s.addToast);

  // フォーム送信ハンドラー
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        rule_name: ruleName,
        flow_type: flowType,
        target_id: targetId,
        condition,
        threshold,
      });
      addToast("アラートルールを作成しました", "success");
      onClose();
    } catch {
      addToast("アラートルールの作成に失敗しました", "error");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-bg-card p-5">
      <h3 className="text-base font-semibold text-text-primary mb-4">
        新規ルール作成
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ルール名 */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">
            ルール名
          </label>
          <input
            type="text"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-inflow/50"
            placeholder="例: 米国株への大規模資金流入"
          />
        </div>

        {/* フロータイプ */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">
            フロータイプ
          </label>
          <select
            value={flowType}
            onChange={(e) => setFlowType(e.target.value)}
            className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-inflow/50"
          >
            <option value="region">地域 (Region)</option>
            <option value="sector">セクター (Sector)</option>
            <option value="asset_class">資産クラス (Asset Class)</option>
          </select>
        </div>

        {/* 対象 */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">
            対象
          </label>
          <input
            type="text"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-inflow/50"
            placeholder="例: US, tech, equity"
          />
        </div>

        {/* 条件 */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">
            条件
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-inflow/50"
          >
            <option value="gt">より大きい (gt)</option>
            <option value="lt">より小さい (lt)</option>
            <option value="abs_gt">絶対値が超過 (abs_gt)</option>
            <option value="pct_change_gt">変動率超過 (pct_change_gt)</option>
          </select>
        </div>

        {/* 閾値 */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">
            閾値
          </label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            required
            className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-primary font-mono-number placeholder:text-text-secondary focus:outline-none focus:border-inflow/50"
            placeholder="例: 5000"
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-md bg-inflow/20 border border-inflow/30 px-4 py-2 text-sm text-inflow hover:bg-inflow/30 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? "作成中..." : "作成"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
