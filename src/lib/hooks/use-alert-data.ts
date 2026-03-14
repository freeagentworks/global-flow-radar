import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AlertRule, TriggeredAlert } from "@/types";

// ============================================
// アラート関連のTanStack Queryフック
// ルールCRUDとトリガー済みアラート取得
// ============================================

/** アラートルール一覧取得 */
export function useAlertRules() {
  return useQuery<AlertRule[]>({
    queryKey: ["alert-rules"],
    queryFn: async () => {
      const res = await fetch("/api/alerts/rules");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "データの取得に失敗しました");
      return json.data.rules;
    },
  });
}

/** アラートルール作成ミューテーション */
export function useCreateAlertRule() {
  const queryClient = useQueryClient();

  return useMutation<
    AlertRule,
    Error,
    {
      rule_name: string;
      flow_type: string;
      target_id: string;
      condition: string;
      threshold: number;
    }
  >({
    mutationFn: async (newRule) => {
      const res = await fetch("/api/alerts/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRule),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "ルールの作成に失敗しました");
      return json.data;
    },
    onSuccess: () => {
      // ルール一覧キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
    },
  });
}

/** アラートルール削除ミューテーション */
export function useDeleteAlertRule() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/alerts/rules?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "ルールの削除に失敗しました");
    },
    onSuccess: () => {
      // ルール一覧キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
    },
  });
}

/** トリガー済みアラート一覧取得 */
export function useTriggeredAlerts(limit: number = 20) {
  return useQuery<TriggeredAlert[]>({
    queryKey: ["triggered-alerts", limit],
    queryFn: async () => {
      const res = await fetch(`/api/alerts/triggered?limit=${limit}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "データの取得に失敗しました");
      return json.data.alerts;
    },
  });
}
