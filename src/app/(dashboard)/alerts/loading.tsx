// アラートページのローディングスケルトン

export default function AlertsLoading() {
  return (
    <div className="space-y-6">
      {/* ヘッダー + フィルター スケルトン */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="skeleton h-8 w-36" />
        <div className="flex gap-2">
          <div className="skeleton h-10 w-24 rounded-md" />
          <div className="skeleton h-10 w-24 rounded-md" />
        </div>
      </div>

      {/* アラートカード スケルトン */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-20 w-full rounded-lg"
          />
        ))}
      </div>

      {/* サマリー スケルトン */}
      <div className="skeleton h-32 rounded-lg" />
    </div>
  );
}
