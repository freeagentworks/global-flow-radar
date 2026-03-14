"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { EventTimeline } from "@/components/charts/EventTimeline";
import {
  useHistoricalFlows,
  useHistoricalEvents,
} from "@/lib/hooks/use-history-data";
import type { Period } from "@/types";

// ヒストリカル分析ページ（S-006）
// 過去のフローデータとマーケットイベントを表示

// 期間セレクターの選択肢
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "1m", label: "1ヶ月" },
  { value: "3m", label: "3ヶ月" },
  { value: "6m", label: "6ヶ月" },
  { value: "1y", label: "1年" },
  { value: "5y", label: "5年" },
];

// フロータイプセレクターの選択肢
const FLOW_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "region", label: "地域別" },
  { value: "sector", label: "セクター別" },
  { value: "asset_class", label: "資産クラス別" },
];

export default function HistoryPage() {
  const t = useTranslations("nav");

  // 期間選択
  const [period, setPeriod] = useState<Period>("1y");

  // フロータイプ選択
  const [flowType, setFlowType] = useState("region");

  // ヒストリカルフローデータ取得
  const {
    data: flowData,
    isLoading: flowLoading,
    isError: flowError,
  } = useHistoricalFlows(period, flowType);

  // イベントデータ取得
  const {
    data: events,
    isLoading: eventsLoading,
    isError: eventsError,
  } = useHistoricalEvents();

  // タイムシリーズチャート用データに変換
  const chartData =
    flowData?.timeseries.map((point) => ({
      date: point.date,
      flow_score: point.flow_score,
      flow_usd_mm: point.flow_usd_mm,
      cumulative_usd_mm: point.cumulative_usd_mm,
    })) ?? [];

  // チャートのライン設定
  const chartLines = [
    { key: "flow_score", color: "#58A6FF", label: "フロースコア" },
    { key: "cumulative_usd_mm", color: "#F0883E", label: "累積フロー (M USD)" },
  ];

  // イベントタイムライン用データに変換
  const timelineEvents =
    events?.map((e) => ({
      id: e.id,
      name: e.name_ja,
      date: e.date_start,
      description: e.description_ja,
      impact: e.severity,
    })) ?? [];

  return (
    <div className="space-y-4">
      {/* ページタイトル */}
      <h1 className="text-xl font-semibold text-text-primary">
        {t("history")}
      </h1>

      {/* セレクターエリア */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        {/* フロータイプセレクター */}
        <div className="flex gap-1 rounded-lg border border-border bg-bg-card p-1">
          {FLOW_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFlowType(opt.value)}
              className={`
                rounded-md px-3 py-1.5 text-xs font-medium transition-colors
                ${
                  flowType === opt.value
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

      {/* ヒストリカルフローチャート */}
      <div className="rounded-lg border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">
          資金フロー推移
        </h2>
        {flowError ? (
          <p className="text-sm text-text-muted">データの取得に失敗しました</p>
        ) : flowLoading ? (
          <div className="skeleton h-[300px] w-full" />
        ) : (
          <TimeSeriesChart
            data={chartData}
            lines={chartLines}
            height={350}
            showGrid
            showLegend
          />
        )}
      </div>

      {/* マーケットイベントタイムライン */}
      <div className="rounded-lg border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">
          主要マーケットイベント
        </h2>
        {eventsError ? (
          <p className="text-sm text-text-muted">データの取得に失敗しました</p>
        ) : eventsLoading ? (
          <div className="skeleton h-32 w-full" />
        ) : (
          <EventTimeline events={timelineEvents} />
        )}
      </div>
    </div>
  );
}
