// 履歴ページのローディングスケルトン

export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      {/* ヘッダー + 日付選択 スケルトン */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-10 w-48 rounded-md" />
      </div>

      {/* タイムラインチャート スケルトン */}
      <div className="skeleton h-72 rounded-lg" />

      {/* 履歴リスト スケルトン */}
      <div className="rounded-lg border border-border bg-bg-card p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-full rounded" />
        ))}
      </div>
    </div>
  );
}
