import { expect, test } from "@playwright/test";

test("效果查看在移动端可阅读且没有页面横向溢出", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "打开导航" }).click();
  await page.getByRole("button", { name: "效果查看" }).click();

  await expect(page.getByRole("heading", { name: "效果查看" })).toBeVisible();
  await expect(page.getByText("还没有运行记录")).toBeVisible();
  await expect(
    page.evaluate(
      () => document.documentElement.scrollWidth === document.documentElement.clientWidth,
    ),
  ).resolves.toBe(true);
});
