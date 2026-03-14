"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppSettings } from "@/lib/stores/theme-store";
import { NAV_ITEMS } from "@/lib/constants/navigation";

// アイコンコンポーネント（SVGベース、軽量実装）
function NavIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    BarChart3: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
      </svg>
    ),
    Globe: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
      </svg>
    ),
    RefreshCw: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
      </svg>
    ),
    TrendingUp: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    ClipboardList: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
      </svg>
    ),
    Calendar: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
    Bell: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
    Sun: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
      </svg>
    ),
    Moon: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
    Languages: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" />
      </svg>
    ),
    PanelLeftClose: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="m16 15-3-3 3-3" />
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
}

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar } = useAppSettings();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen border-r border-border bg-bg-secondary transition-all duration-300 hidden lg:flex flex-col ${
        sidebarCollapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]"
      }`}
    >
      {/* ロゴ */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral text-white font-bold text-sm">
          GF
        </div>
        {!sidebarCollapsed && (
          <span className="text-sm font-semibold text-text-primary truncate">
            Global Flow Radar
          </span>
        )}
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-neutral/10 text-neutral font-medium"
                      : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
                  }`}
                  title={t(item.key)}
                >
                  <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span>{t(item.key)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 下部アクション */}
      <div className="border-t border-border px-3 py-4 space-y-1">
        {/* テーマ切替 */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-card hover:text-text-primary transition-colors"
          aria-label={theme === "dark" ? "ライトモードに切替" : "ダークモードに切替"}
        >
          <NavIcon
            name={theme === "dark" ? "Sun" : "Moon"}
            className="h-5 w-5 shrink-0"
          />
          {!sidebarCollapsed && (
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          )}
        </button>

        {/* サイドバー折りたたみ */}
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-card hover:text-text-primary transition-colors"
          aria-label={sidebarCollapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
        >
          <NavIcon
            name="PanelLeftClose"
            className={`h-5 w-5 shrink-0 transition-transform ${
              sidebarCollapsed ? "rotate-180" : ""
            }`}
          />
          {!sidebarCollapsed && <span>折りたたむ</span>}
        </button>
      </div>
    </aside>
  );
}
