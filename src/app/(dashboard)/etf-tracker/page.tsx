"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useEtfRankings } from "@/lib/hooks/use-market-data";
import { useEtfDetail } from "@/lib/hooks/use-etf-data";
import { EtfFlowChart } from "@/components/charts/EtfFlowChart";
import type { Period } from "@/types";

// ETFトラッカーページ（S-005）
// ETFランキング表示・検索・個別ETF詳細パネル

// 期間セレクターの選択肢
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "1d", label: "1日" },
  { value: "1w", label: "1週" },
  { value: "1m", label: "1ヶ月" },
];

export default function EtfTrackerPage() {
  const t = useTranslations("nav");

  // 検索クエリ（デバウンス付き）
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // 期間選択
  const [period, setPeriod] = useState<Period>("1d");

  // 選択中のETFシンボル（詳細パネル表示用）
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // インフロー/アウトフローランキング取得
  const {
    data: inflowRankings,
    isLoading: inflowLoading,
    isError: inflowError,
  } = useEtfRankings("inflow", 20);

  const {
    data: outflowRankings,
    isLoading: outflowLoading,
    isError: outflowError,
  } = useEtfRankings("outflow", 20);

  // 選択ETFの詳細データ
  const {
    data: etfDetail,
    isLoading: detailLoading,
  } = useEtfDetail(selectedSymbol ?? "");

  // デバウンス付き検索ハンドラ
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => {
        setDebouncedQuery(value);
      }, 300);
      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  // ランキングデータをフィルタ
  const filterRankings = (
    rankings: typeof inflowRankings
  ) => {
    if (!rankings) return [];
    if (!debouncedQuery.trim()) return rankings;
    const q = debouncedQuery.toLowerCase();
    return rankings.filter(
      (r) =>
        r.symbol.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
    );
  };

  const filteredInflow = filterRankings(inflowRankings);
  const filteredOutflow = filterRankings(outflowRankings);

  return (
    <div className="space-y-4">
      {/* ページタイトル */}
      <h1 className="text-xl font-semibold text-text-primary">
        {t("etfTracker")}
      </h1>

      {/* 検索バー + 期間セレクター */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 検索入力 */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ETFを検索（シンボル or 名前）..."
            className="w-full rounded-lg border border-border bg-bg-card px-4 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 期間セレクター */}
        <div className="flex gap-1 rounded-lg border border-border bg-bg-card p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`
                rounded-md px-3 py-1.5 text-xs font-medium transition-colors
                ${
                  period === opt.value
                    ? "bg-blue-600 text-white"
                    : "text-text-secondary hover:text-text-primary hover:bg-border/50"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ランキングテーブル: インフロー */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top 20 インフロー */}
        <div className="rounded-lg border border-border bg-bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">
            Top 20 インフロー
          </h2>
          {inflowError ? (
            <p className="text-sm text-text-muted">データの取得に失敗しました</p>
          ) : inflowLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="py-2 pr-2 text-left">#</th>
                    <th className="py-2 pr-2 text-left">シンボル</th>
                    <th className="py-2 pr-2 text-left">名前</th>
                    <th className="py-2 pr-2 text-right">フロー (M USD)</th>
                    <th className="py-2 text-right">パフォーマンス</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInflow.map((etf) => (
                    <tr
                      key={etf.symbol}
                      onClick={() =>
                        setSelectedSymbol(
                          selectedSymbol === etf.symbol ? null : etf.symbol
                        )
                      }
                      className={`
                        border-b border-border/50 cursor-pointer transition-colors
                        ${selectedSymbol === etf.symbol ? "bg-blue-500/10" : "hover:bg-border/30"}
                      `}
                    >
                      <td className="py-2 pr-2 font-mono-number text-text-muted">
                        {etf.rank}
                      </td>
                      <td className="py-2 pr-2 font-semibold text-text-primary">
                        {etf.symbol}
                      </td>
                      <td className="py-2 pr-2 text-text-secondary max-w-[180px] truncate">
                        {etf.name}
                      </td>
                      <td className="py-2 pr-2 text-right font-mono-number text-green-400">
                        +{etf.flow_usd_mm.toLocaleString()}
                      </td>
                      <td className="py-2 text-right font-mono-number">
                        <span
                          className={
                            etf.performance_pct >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {etf.performance_pct >= 0 ? "+" : ""}
                          {etf.performance_pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInflow.length === 0 && (
                <p className="py-4 text-center text-text-muted text-xs">
                  該当するETFがありません
                </p>
              )}
            </div>
          )}
        </div>

        {/* Top 20 アウトフロー */}
        <div className="rounded-lg border border-border bg-bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">
            Top 20 アウトフロー
          </h2>
          {outflowError ? (
            <p className="text-sm text-text-muted">データの取得に失敗しました</p>
          ) : outflowLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="py-2 pr-2 text-left">#</th>
                    <th className="py-2 pr-2 text-left">シンボル</th>
                    <th className="py-2 pr-2 text-left">名前</th>
                    <th className="py-2 pr-2 text-right">フロー (M USD)</th>
                    <th className="py-2 text-right">パフォーマンス</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutflow.map((etf) => (
                    <tr
                      key={etf.symbol}
                      onClick={() =>
                        setSelectedSymbol(
                          selectedSymbol === etf.symbol ? null : etf.symbol
                        )
                      }
                      className={`
                        border-b border-border/50 cursor-pointer transition-colors
                        ${selectedSymbol === etf.symbol ? "bg-blue-500/10" : "hover:bg-border/30"}
                      `}
                    >
                      <td className="py-2 pr-2 font-mono-number text-text-muted">
                        {etf.rank}
                      </td>
                      <td className="py-2 pr-2 font-semibold text-text-primary">
                        {etf.symbol}
                      </td>
                      <td className="py-2 pr-2 text-text-secondary max-w-[180px] truncate">
                        {etf.name}
                      </td>
                      <td className="py-2 pr-2 text-right font-mono-number text-red-400">
                        {etf.flow_usd_mm.toLocaleString()}
                      </td>
                      <td className="py-2 text-right font-mono-number">
                        <span
                          className={
                            etf.performance_pct >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {etf.performance_pct >= 0 ? "+" : ""}
                          {etf.performance_pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOutflow.length === 0 && (
                <p className="py-4 text-center text-text-muted text-xs">
                  該当するETFがありません
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 個別ETF詳細パネル */}
      {selectedSymbol && (
        <div className="rounded-lg border border-border bg-bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">
              {selectedSymbol} 詳細
            </h2>
            <button
              onClick={() => setSelectedSymbol(null)}
              className="text-text-muted hover:text-text-primary text-xs"
            >
              閉じる
            </button>
          </div>

          {/* キーメトリクス */}
          {detailLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          ) : etfDetail ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* AUM */}
                <div className="rounded-md border border-border bg-bg-card/50 p-3">
                  <p className="text-[10px] text-text-muted uppercase">AUM</p>
                  <p className="font-mono-number text-sm font-semibold text-text-primary">
                    ${(etfDetail.aum_usd_mm / 1000).toFixed(1)}B
                  </p>
                </div>
                {/* 出来高 */}
                <div className="rounded-md border border-border bg-bg-card/50 p-3">
                  <p className="text-[10px] text-text-muted uppercase">出来高</p>
                  <p className="font-mono-number text-sm font-semibold text-text-primary">
                    {(etfDetail.volume_avg / 1000000).toFixed(1)}M
                  </p>
                </div>
                {/* 価格 */}
                <div className="rounded-md border border-border bg-bg-card/50 p-3">
                  <p className="text-[10px] text-text-muted uppercase">価格</p>
                  <p className="font-mono-number text-sm font-semibold text-text-primary">
                    ${etfDetail.price.toFixed(2)}
                    <span
                      className={`ml-1 text-xs ${
                        etfDetail.price_change_pct >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {etfDetail.price_change_pct >= 0 ? "+" : ""}
                      {etfDetail.price_change_pct.toFixed(2)}%
                    </span>
                  </p>
                </div>
                {/* 経費率 */}
                <div className="rounded-md border border-border bg-bg-card/50 p-3">
                  <p className="text-[10px] text-text-muted uppercase">経費率</p>
                  <p className="font-mono-number text-sm font-semibold text-text-primary">
                    {etfDetail.expense_ratio.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* フローチャート */}
              <EtfFlowChart symbol={selectedSymbol} period={period} />
            </>
          ) : (
            <p className="text-sm text-text-muted">データの取得に失敗しました</p>
          )}
        </div>
      )}
    </div>
  );
}
