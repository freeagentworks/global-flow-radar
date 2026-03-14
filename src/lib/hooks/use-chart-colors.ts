import { useAppSettings } from "@/lib/stores/theme-store";

/** チャートコンポーネント用のテーマ対応カラーセット */
export function useChartColors() {
  const theme = useAppSettings((s) => s.theme);
  const isDark = theme === "dark";

  return {
    grid: isDark ? "#30363D" : "#D0D7DE",
    tick: isDark ? "#8B949E" : "#656D76",
    axis: isDark ? "#30363D" : "#D0D7DE",
    cursor: isDark ? "#484F58" : "#8C959F",
    bg: isDark ? "#0D1117" : "#FFFFFF",
    text: isDark ? "#E6EDF3" : "#1F2328",
    textSecondary: isDark ? "#8B949E" : "#656D76",
    legendColor: isDark ? "#8B949E" : "#656D76",
  };
}
