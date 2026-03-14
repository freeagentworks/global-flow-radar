"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Header } from "@/components/layout/Header";
import { useAppSettings } from "@/lib/stores/theme-store";

// ダッシュボードレイアウト（サイドバー + ヘッダー + メインコンテンツ）
// 07_ui-wireframe.md 2.1節 共通レイアウト準拠
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useAppSettings();

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* デスクトップ: サイドバー */}
      <Sidebar />

      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <main
        className={`min-h-[calc(100vh-3.5rem)] p-4 lg:p-6 pb-20 lg:pb-6 transition-all ${
          sidebarCollapsed
            ? "lg:ml-[var(--sidebar-collapsed-width)]"
            : "lg:ml-[var(--sidebar-width)]"
        }`}
      >
        {children}
      </main>

      {/* モバイル: ボトムナビゲーション */}
      <MobileNav />

      {/* フッター免責事項 */}
      <footer
        className={`border-t border-border px-4 py-3 text-center text-xs text-text-muted pb-20 lg:pb-3 transition-all ${
          sidebarCollapsed
            ? "lg:ml-[var(--sidebar-collapsed-width)]"
            : "lg:ml-[var(--sidebar-width)]"
        }`}
      >
        本サイトの情報は投資助言ではありません。投資判断はご自身の責任で行ってください。
      </footer>
    </div>
  );
}
