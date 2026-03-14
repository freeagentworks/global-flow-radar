import { test, expect } from "@playwright/test";

// シナリオ 5: アラート管理
test.describe("アラート", () => {
  test("アラートページのタブ切替が動作する", async ({ page }) => {
    await page.goto("/alerts");

    // ルール管理タブが表示される
    await expect(page.locator("text=ルール管理")).toBeVisible();
    await expect(page.locator("text=通知履歴")).toBeVisible();

    // 通知履歴タブに切替
    await page.click("text=通知履歴");

    // ルール管理タブに戻る
    await page.click("text=ルール管理");

    // 新規ルール作成ボタンが存在する
    await expect(page.locator("text=新規ルール作成")).toBeVisible();
  });

  test("Aboutページが免責事項を含む", async ({ page }) => {
    await page.goto("/about");

    await expect(page.locator("h1")).toContainText("Global Flow Radar");
    await expect(page.locator("text=免責事項")).toBeVisible();
    await expect(page.locator("text=投資助言")).toBeVisible();
  });
});
