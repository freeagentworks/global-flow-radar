"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BOTTOM_NAV_ITEMS } from "@/lib/constants/navigation";

// モバイル用ボトムナビゲーション（07_ui-wireframe.md 2.1節）
export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  // ナビアイコン（シンプルなSVG）
  const iconMap: Record<string, string> = {
    BarChart3: "M3 3v18h18M18 17V9M13 17V5M8 17v-3",
    Globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20",
    RefreshCw: "M3 12a9 9 0 0 1 15.74-5.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.74 5.74L3 16M3 21v-5h5",
    TrendingUp: "M22 7 13.5 15.5 8.5 10.5 2 17M16 7h6v6",
    Bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-bg-secondary lg:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
              isActive
                ? "text-neutral"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={iconMap[item.icon]} />
            </svg>
            <span>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
