import { test, expect } from "@playwright/test";

// シナリオ 1: ダッシュボードの初期表示
test.describe("ダッシュボード", () => {
  test("トップページが正しく表示される", async ({ page }) => {
    await page.goto("/");

    // ページタイトルが表示される
    await expect(page.locator("h1")).toContainText("資金フロー概況");

    // マーケットサマリーカードが7つ表示される
    await expect(page.locator("text=マーケットサマリー")).toBeVisible();

    // ミニ世界地図セクションが表示される
    await expect(page.locator("text=ミニ世界地図")).toBeVisible();

    // セクターヒートマップが表示される
    await expect(page.locator("text=セクターヒートマップ")).toBeVisible();

    // ETFランキングが表示される
    await expect(page.locator("text=資金流入")).toBeVisible();
    await expect(page.locator("text=資金流出")).toBeVisible();
  });

  test("サイドバーナビゲーションが動作する", async ({ page }) => {
    await page.goto("/");

    // サイドバーが表示される（デスクトップ）
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    // フローマップへ遷移
    await page.click('a[href="/map"]');
    await expect(page).toHaveURL("/map");
    await expect(page.locator("h1")).toContainText("フローマップ");
  });
});
