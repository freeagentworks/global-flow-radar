"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FlowMap } from "@/components/charts/FlowMap";
import { PeriodSelector } from "@/components/ui/PeriodSelector";
import type { Period } from "@/types";

type DisplayMode = "arrows" | "bubbles" | "heatmap";

// グローバルフローマップページ（S-002）
// 07_ui-wireframe.md 2.4節 準拠

export default function MapPage() {
  const t = useTranslations("nav");
  const [period, setPeriod] = useState<Period>("1m");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("arrows");

  const modeLabels: Record<DisplayMode, string> = {
    arrows: "矢印モード",
    bubbles: "バブルモード",
    heatmap: "ヒートマップ",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">{t("map")}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* 表示モード切替 */}
          <div className="flex items-center gap-1 rounded-lg bg-bg-secondary p-1">
            {(["arrows", "bubbles", "heatmap"] as DisplayMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setDisplayMode(mode)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  displayMode === mode
                    ? "bg-neutral text-white"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                }`}
              >
                {modeLabels[mode]}
              </button>
            ))}
          </div>

          {/* 期間セレクター */}
          <PeriodSelector
            value={period}
            onChange={setPeriod}
            options={["1d", "1w", "1m", "3m", "6m", "1y"]}
          />
        </div>
      </div>

      {/* フローマップ */}
      <div className="rounded-lg border border-border bg-bg-card p-4">
        <FlowMap period={period} displayMode={displayMode} />
      </div>
    </div>
  );
}
