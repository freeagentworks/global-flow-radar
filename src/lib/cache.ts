/**
 * Redis/Upstash キャッシュユーティリティ
 * fetch ベースの Upstash REST API を使用（Edge Runtime 対応）
 */

const DEFAULT_TTL = 3600; // デフォルト TTL: 1時間

/**
 * Upstash REST API のベース URL とトークンを取得
 */
function getConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

/**
 * Upstash REST API にコマンドを送信
 */
async function redisCommand<T = unknown>(
  command: string[]
): Promise<T | null> {
  const config = getConfig();
  if (!config) {
    return null;
  }

  try {
    const response = await fetch(`${config.url}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      console.error(`[Cache] Redis エラー: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as { result: T };
    return data.result;
  } catch (error) {
    console.error("[Cache] Redis 接続エラー:", error);
    return null;
  }
}

/**
 * キャッシュからデータを取得
 */
export async function getCache<T = unknown>(key: string): Promise<T | null> {
  const result = await redisCommand<string>(["GET", key]);

  if (result === null) {
    return null;
  }

  try {
    return JSON.parse(result) as T;
  } catch {
    // JSON でない場合はそのまま返す
    return result as unknown as T;
  }
}

/**
 * キャッシュにデータを保存（TTL 付き）
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number = DEFAULT_TTL
): Promise<void> {
  const serialized = JSON.stringify(value);
  await redisCommand(["SET", key, serialized, "EX", String(ttlSeconds)]);
}

/**
 * キャッシュを無効化（削除）
 */
export async function invalidateCache(key: string): Promise<void> {
  await redisCommand(["DEL", key]);
}
