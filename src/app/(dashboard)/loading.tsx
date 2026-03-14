// ダッシュボードトップページのローディングスケルトン

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* 本日の資金フロー概況 スケルトン */}
      <section className="rounded-lg border border-border bg-bg-card p-5">
        <div className="skeleton h-7 w-48 mb-3" />
        <div className="skeleton h-4 w-full mb-2" />
        <div className="skeleton h-4 w-3/4" />
      </section>

      {/* マーケットサマリーカード スケルトン */}
      <section>
        <div className="skeleton h-6 w-40 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="skeleton h-24 rounded-lg"
            />
          ))}
        </div>
      </section>

      {/* ミニ世界地図 + セクターヒートマップ スケルトン */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="skeleton h-64 rounded-lg" />
        <div className="skeleton h-64 rounded-lg" />
      </div>
    </div>
  );
}
