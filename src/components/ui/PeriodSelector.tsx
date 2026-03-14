"use client";

import { useTranslations } from "next-intl";
import type { Period } from "@/types";

// 期間セレクター（共通コンポーネント）
// 07_ui-wireframe.md 3.4節 ボタングループ形式

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
  options?: Period[];
}

const DEFAULT_OPTIONS: Period[] = ["1d", "1w", "1m", "3m", "6m", "1y"];

export function PeriodSelector({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}: PeriodSelectorProps) {
  const t = useTranslations("periods");

  return (
    <div className="flex items-center gap-1 rounded-lg bg-bg-secondary p-1">
      {options.map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === period
              ? "bg-neutral text-white"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
          }`}
        >
          {t(period)}
        </button>
      ))}
    </div>
  );
}
