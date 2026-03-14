import { getRequestConfig } from "next-intl/server";

// next-intl リクエスト設定
// デフォルトは日本語、ブラウザ設定またはユーザー選択で英語に切替可能
export default getRequestConfig(async () => {
  // TODO: Cookie/ヘッダーからロケール取得（Phase 1で実装）
  const locale = "ja";

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
