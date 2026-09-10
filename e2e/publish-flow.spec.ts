import { expect, test } from "@playwright/test";

test("未添加资料时不展示预置审核内容", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");

  await page.getByRole("button", { name: /待确认/ }).click();
  await expect(page.getByText("还没有待确认内容")).toBeVisible();
  await expect(page.getByText("0 项待确认")).toBeVisible();
});
