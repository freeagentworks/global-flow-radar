/**
 * API ルート用キャッシュラッパー
 * キャッシュヒット時はキャッシュデータを返し、ミス時は fetchFn を実行して結果をキャッシュに保存
 */

import { getCache, setCache } from "@/lib/cache";

const DEFAULT_TTL = 3600; // デフォルト TTL: 1時間

/**
 * キャッシュ付きデータ取得
 * @param key - キャッシュキー
 * @param fetchFn - キャッシュミス時に実行するデータ取得関数
 * @param ttl - TTL（秒）。デフォルト: 3600
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // キャッシュから取得を試みる
  const cached = await getCache<T>(key);

  if (cached !== null) {
    return cached;
  }

  // キャッシュミス: データを取得して保存
  const data = await fetchFn();
  await setCache(key, data, ttl);

  return data;
}
