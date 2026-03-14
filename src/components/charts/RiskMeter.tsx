"use client";

// リスクオン/オフ ゲージメーター（半円型SVG）
// スコア: -100 (risk_off) ~ 0 (neutral) ~ 100 (risk_on)

interface RiskMeterProps {
  score: number;
  label: "risk_on" | "neutral" | "risk_off";
}

// ラベルの日本語表示
const LABEL_TEXT: Record<string, { text: string; color: string }> = {
  risk_on: { text: "リスクオン", color: "#00C853" },
  neutral: { text: "ニュートラル", color: "#448AFF" },
  risk_off: { text: "リスクオフ", color: "#FF1744" },
};

export function RiskMeter({ score, label }: RiskMeterProps) {
  const clampedScore = Math.max(-100, Math.min(100, score));

  // SVG設定
  const svgWidth = 240;
  const svgHeight = 150;
  const cx = svgWidth / 2;
  const cy = svgHeight - 20;
  const outerRadius = 90;
  const innerRadius = 65;

  // スコアを角度に変換（-100 -> 180度, 0 -> 90度, 100 -> 0度）
  // 半円: 左端（180度）がrisk_off、右端（0度）がrisk_on
  const needleAngleDeg = 180 - ((clampedScore + 100) / 200) * 180;
  const needleAngleRad = (needleAngleDeg * Math.PI) / 180;

  // 針の先端座標
  const needleLength = outerRadius - 5;
  const needleX = cx + needleLength * Math.cos(needleAngleRad);
  const needleY = cy - needleLength * Math.sin(needleAngleRad);

  // グラデーションアークのパスを生成
  function describeArc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ): string {
    const startRad = ((180 - startAngle) * Math.PI) / 180;
    const endRad = ((180 - endAngle) * Math.PI) / 180;
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY - radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY - radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  // グラデーション用のアークセグメント
  const segments = [
    { start: 0, end: 36, color: "#FF1744" },    // risk_off (強)
    { start: 36, end: 72, color: "#FF6D00" },    // risk_off (弱)
    { start: 72, end: 108, color: "#448AFF" },   // neutral
    { start: 108, end: 144, color: "#4CAF50" },  // risk_on (弱)
    { start: 144, end: 180, color: "#00C853" },  // risk_on (強)
  ];

  const { text: labelText, color: labelColor } = LABEL_TEXT[label] ?? {
    text: label,
    color: "#8B949E",
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        aria-label={`リスクメーター: ${labelText} (${clampedScore})`}
      >
        {/* 背景アーク */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={describeArc(cx, cy, outerRadius, seg.start, seg.end)}
            fill="none"
            stroke={seg.color}
            strokeWidth={outerRadius - innerRadius}
            strokeLinecap="butt"
            opacity={0.3}
          />
        ))}

        {/* アクティブ部分のアーク（現在のスコアまで） */}
        {segments.map((seg, i) => {
          const scoreAngle = ((clampedScore + 100) / 200) * 180;
          const segEnd = Math.min(seg.end, scoreAngle);
          if (segEnd <= seg.start) return null;
          return (
            <path
              key={`active-${i}`}
              d={describeArc(cx, cy, outerRadius, seg.start, segEnd)}
              fill="none"
              stroke={seg.color}
              strokeWidth={outerRadius - innerRadius}
              strokeLinecap="butt"
              opacity={0.8}
            />
          );
        })}

        {/* 目盛りマーク */}
        {[0, 45, 90, 135, 180].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = cx + (outerRadius + 4) * Math.cos(rad);
          const y1 = cy - (outerRadius + 4) * Math.sin(rad);
          const x2 = cx + (outerRadius + 10) * Math.cos(rad);
          const y2 = cy - (outerRadius + 10) * Math.sin(rad);
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-text-muted)"
              strokeWidth={1.5}
            />
          );
        })}

        {/* 針 */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="var(--color-text-primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* 針の中心点 */}
        <circle cx={cx} cy={cy} r={6} fill="var(--color-text-primary)" />
        <circle cx={cx} cy={cy} r={3} fill="var(--color-bg-primary)" />

        {/* スコア表示 */}
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          fill="var(--color-text-primary)"
          fontSize="22"
          fontWeight="700"
          fontFamily="var(--font-mono)"
        >
          {clampedScore > 0 ? "+" : ""}
          {clampedScore}
        </text>

        {/* 左右ラベル */}
        <text x={cx - outerRadius - 8} y={cy + 4} textAnchor="end" fill="#FF1744" fontSize="9">
          RISK OFF
        </text>
        <text x={cx + outerRadius + 8} y={cy + 4} textAnchor="start" fill="#00C853" fontSize="9">
          RISK ON
        </text>
      </svg>

      {/* ラベルテキスト */}
      <p
        className="text-sm font-semibold mt-1"
        style={{ color: labelColor }}
      >
        {labelText}
      </p>
    </div>
  );
}
