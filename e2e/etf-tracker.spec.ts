import { test, expect } from "@playwright/test";

// シナリオ 4: ETFトラッカー
test.describe("ETFトラッカー", () => {
  test("ETF検索とランキングが表示される", async ({ page }) => {
    await page.goto("/etf-tracker");

    await expect(page.locator("h1")).toContainText("ETF");

    // 検索バーが存在する
    const searchInput = page.locator('input[placeholder*="検索"]');
    await expect(searchInput).toBeVisible();

    // ランキングテーブルが表示される
    await expect(page.locator("text=流入")).toBeVisible();
    await expect(page.locator("text=流出")).toBeVisible();
  });
});
