"use client";

import { useEtfRankings } from "@/lib/hooks/use-market-data";

// ETFランキングテーブル（タスク 1-3）
// 流入Top5 / 流出Top5 を表示

interface EtfRankingTableProps {
  direction: "inflow" | "outflow";
  title: string;
}

export function EtfRankingTable({ direction, title }: EtfRankingTableProps) {
  const { data, isLoading, error } = useEtfRankings(direction, 5);

  const isInflow = direction === "inflow";
  const titleColor = isInflow ? "text-inflow" : "text-outflow";

  return (
    <section className="rounded-lg border border-border bg-bg-card p-5">
      <h2 className={`text-base font-semibold ${titleColor} mb-3`}>
        {isInflow ? "💰" : "💸"} {title}
      </h2>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-text-muted">データの取得に失敗しました</p>
      ) : (
        <div className="space-y-1">
          {data?.map((etf, index) => (
            <div
              key={etf.symbol}
              className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-4">
                  {index + 1}.
                </span>
                <span className="font-mono-number text-sm font-medium text-text-primary">
                  {etf.symbol}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono-number text-sm ${isInflow ? "text-inflow" : "text-outflow"}`}
                >
                  {isInflow ? "+" : ""}
                  ${formatFlow(etf.flow_usd_mm)}
                </span>
                <span
                  className={`inline-block h-2 w-2 rounded-full ${isInflow ? "bg-inflow" : "bg-outflow"}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatFlow(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `${(abs / 1000).toFixed(1)}B`;
  }
  return `${abs.toFixed(0)}M`;
}
