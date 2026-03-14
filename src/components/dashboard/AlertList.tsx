"use client";

import { useLatestAlerts } from "@/lib/hooks/use-market-data";
import { useTranslations } from "next-intl";
import type { TriggeredAlert } from "@/types";

// 最新アラート一覧（ダッシュボード用）

export function AlertList() {
  const t = useTranslations("dashboard");
  const { data, isLoading } = useLatestAlerts(5);

  return (
    <section className="rounded-lg border border-border bg-bg-card p-5">
      <h2 className="text-base font-semibold text-text-primary mb-3">
        🔔 {t("latestAlerts")}
      </h2>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="text-sm text-text-muted py-4 text-center">
          アラートはありません
        </p>
      ) : (
        <div className="space-y-1">
          {data.map((alert: TriggeredAlert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-md px-3 py-2 text-sm ${
                alert.is_read
                  ? "opacity-60"
                  : "bg-bg-secondary"
              }`}
            >
              <span className="shrink-0 mt-0.5">
                {alert.flow_value > 0 ? "⚠️" : "ℹ️"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-text-primary truncate">{alert.message}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatAlertTime(alert.triggered_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatAlertTime(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
