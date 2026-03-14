// セクターページのローディングスケルトン

export default function SectorsLoading() {
  return (
    <div className="space-y-6">
      {/* ヘッダー スケルトン */}
      <div className="skeleton h-8 w-64" />

      {/* セクターヒートマップ スケルトン */}
      <div className="skeleton h-80 rounded-lg" />

      {/* セクター詳細テーブル スケルトン */}
      <div className="rounded-lg border border-border bg-bg-card p-4 space-y-3">
        <div className="skeleton h-6 w-40 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-full rounded" />
        ))}
      </div>
    </div>
  );
}
