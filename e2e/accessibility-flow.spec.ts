import { expect, test } from "@playwright/test";

test("首次打开显示真实资料库空态", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");

  await expect(page.getByRole("heading", { name: "资料库", exact: true })).toBeVisible();
  await expect(page.getByText("还没有资料")).toBeVisible();
  await expect(page.getByText("先完成连接设置")).toBeVisible();
});

for (const viewport of [
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
]) {
  test("no horizontal overflow at " + String(viewport.width) + "px", async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    await expect(
      page.evaluate(
        () =>
          document.documentElement.scrollWidth ===
          document.documentElement.clientWidth,
      ),
    ).resolves.toBe(true);
  });
}
