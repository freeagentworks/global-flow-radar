"use client";

import { useState } from "react";

// イベントタイムラインコンポーネント
// 水平タイムラインにイベントドットを表示し、クリックで詳細を表示

interface TimelineEvent {
  id: string;
  name: string;
  date: string;
  description: string;
  impact: string;
}

interface EventTimelineProps {
  events: TimelineEvent[];
}

// インパクト別のカラーマッピング
const IMPACT_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  high: { dot: "bg-red-500", bg: "bg-red-500/10", text: "text-red-400" },
  medium: { dot: "bg-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400" },
  low: { dot: "bg-green-500", bg: "bg-green-500/10", text: "text-green-400" },
};

// インパクトラベル
const IMPACT_LABELS: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function EventTimeline({ events }: EventTimelineProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 選択中のイベント
  const selectedEvent = events.find((e) => e.id === selectedId);

  // イベントが空の場合
  if (!events || events.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-bg-card text-text-muted text-sm h-32">
        イベントデータがありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* タイムラインバー */}
      <div className="relative overflow-x-auto pb-2">
        <div className="flex items-center min-w-max px-4 py-6">
          {/* ベースライン */}
          <div className="absolute left-4 right-4 h-0.5 bg-border top-1/2 -translate-y-1/2" />

          {events.map((event, index) => {
            const colors = IMPACT_COLORS[event.impact] ?? IMPACT_COLORS.low;
            const isSelected = selectedId === event.id;

            return (
              <div
                key={event.id}
                className="relative flex flex-col items-center cursor-pointer group"
                style={{ marginLeft: index === 0 ? 0 : 48 }}
                onClick={() =>
                  setSelectedId(isSelected ? null : event.id)
                }
              >
                {/* イベントドット */}
                <div
                  className={`
                    relative z-10 w-4 h-4 rounded-full border-2 border-bg-card transition-transform
                    ${colors.dot}
                    ${isSelected ? "scale-150 ring-2 ring-offset-1 ring-offset-transparent ring-blue-500" : "group-hover:scale-125"}
                  `}
                />

                {/* 日付ラベル（交互に上下表示） */}
                <span
                  className={`
                    absolute text-[10px] text-text-muted whitespace-nowrap
                    ${index % 2 === 0 ? "-top-6" : "top-6"}
                  `}
                >
                  {event.date}
                </span>

                {/* イベント名（ホバー時表示） */}
                <span
                  className={`
                    absolute text-xs text-text-secondary whitespace-nowrap max-w-[120px] truncate
                    ${index % 2 === 0 ? "top-6" : "-top-6"}
                    opacity-0 group-hover:opacity-100 transition-opacity
                  `}
                >
                  {event.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 選択イベントの詳細パネル */}
      {selectedEvent && (
        <div
          className={`
            rounded-lg border border-border bg-bg-card p-4 transition-all
            ${IMPACT_COLORS[selectedEvent.impact]?.bg ?? ""}
          `}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-text-primary">
                {selectedEvent.name}
              </h4>
              <p className="text-xs text-text-secondary">
                {selectedEvent.date}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>
            <span
              className={`
                shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium
                ${IMPACT_COLORS[selectedEvent.impact]?.text ?? "text-text-muted"}
                ${IMPACT_COLORS[selectedEvent.impact]?.bg ?? ""}
              `}
            >
              影響度: {IMPACT_LABELS[selectedEvent.impact] ?? selectedEvent.impact}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
