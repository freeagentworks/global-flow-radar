// ETF トラッカーページのローディングスケルトン

export default function EtfTrackerLoading() {
  return (
    <div className="space-y-6">
      {/* ヘッダー + フィルター スケルトン */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="skeleton h-8 w-48" />
        <div className="flex gap-2">
          <div className="skeleton h-10 w-28 rounded-md" />
          <div className="skeleton h-10 w-28 rounded-md" />
        </div>
      </div>

      {/* フローチャート スケルトン */}
      <div className="skeleton h-64 rounded-lg" />

      {/* ETF テーブル スケルトン */}
      <div className="rounded-lg border border-border bg-bg-card p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-full rounded" />
        ))}
      </div>
    </div>
  );
}
