import { test, expect } from "@playwright/test";

// シナリオ 3: セクターローテーション + 資産クラス
test.describe("セクター・資産クラス", () => {
  test("セクターページが表示される", async ({ page }) => {
    await page.goto("/sectors");

    await expect(page.locator("h1")).toContainText("セクター");

    // 期間セレクターが存在する
    await expect(page.locator("text=1ヶ月")).toBeVisible();
  });

  test("資産クラスページが表示される", async ({ page }) => {
    await page.goto("/asset-classes");

    await expect(page.locator("h1")).toContainText("資産クラス");

    // リスクメーターが表示される
    await expect(page.locator("text=リスク")).toBeVisible();
  });
});
