import { test, expect } from "@playwright/test";

// シナリオ 2: グローバルフローマップ
test.describe("フローマップ", () => {
  test("地図と表示モード切替が動作する", async ({ page }) => {
    await page.goto("/map");

    // ページが表示される
    await expect(page.locator("h1")).toContainText("フローマップ");

    // SVG地図が表示される
    await expect(page.locator("svg")).toBeVisible();

    // 表示モードボタンが3つ表示される
    await expect(page.locator("text=矢印モード")).toBeVisible();
    await expect(page.locator("text=バブルモード")).toBeVisible();
    await expect(page.locator("text=ヒートマップ")).toBeVisible();

    // バブルモードに切替
    await page.click("text=バブルモード");

    // 期間セレクターが動作する
    await expect(page.locator("text=1ヶ月")).toBeVisible();
    await page.click("text=1週間");
  });
});
