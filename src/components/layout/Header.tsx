"use client";

import { useTranslations } from "next-intl";
import { useAppSettings } from "@/lib/stores/theme-store";

// ヘッダーコンポーネント（日付・テーマ切替・言語切替）
export function Header() {
  const t = useTranslations("common");
  const { sidebarCollapsed } = useAppSettings();

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg-primary/80 backdrop-blur-sm px-4 lg:px-6 transition-all ${
        sidebarCollapsed
          ? "lg:ml-[var(--sidebar-collapsed-width)]"
          : "lg:ml-[var(--sidebar-width)]"
      }`}
    >
      {/* 左: アプリ名（モバイルのみ） + 日付 */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-text-primary lg:hidden">
          {t("appName")}
        </span>
        <span className="text-sm text-text-secondary hidden sm:block">
          {today}
        </span>
      </div>

      {/* 右: 最終更新時刻 */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-muted">
          {t("lastUpdated")}: --:--
        </span>
      </div>
    </header>
  );
}
