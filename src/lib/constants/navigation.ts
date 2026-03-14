// サイドバーナビゲーション定義
export const NAV_ITEMS = [
  { key: "dashboard", href: "/", icon: "BarChart3" },
  { key: "map", href: "/map", icon: "Globe" },
  { key: "sectors", href: "/sectors", icon: "RefreshCw" },
  { key: "assetClasses", href: "/asset-classes", icon: "TrendingUp" },
  { key: "etfTracker", href: "/etf-tracker", icon: "ClipboardList" },
  { key: "history", href: "/history", icon: "Calendar" },
  { key: "alerts", href: "/alerts", icon: "Bell" },
] as const;

export const BOTTOM_NAV_ITEMS = [
  { key: "dashboard", href: "/", icon: "BarChart3" },
  { key: "map", href: "/map", icon: "Globe" },
  { key: "sectors", href: "/sectors", icon: "RefreshCw" },
  { key: "etfTracker", href: "/etf-tracker", icon: "TrendingUp" },
  { key: "alerts", href: "/alerts", icon: "Bell" },
] as const;
