// アセットクラスページのローディングスケルトン

export default function AssetClassesLoading() {
  return (
    <div className="space-y-6">
      {/* ヘッダー スケルトン */}
      <div className="skeleton h-8 w-56" />

      {/* サマリーカード スケルトン */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-lg" />
        ))}
      </div>

      {/* チャートエリア スケルトン */}
      <div className="skeleton h-72 rounded-lg" />
    </div>
  );
}
