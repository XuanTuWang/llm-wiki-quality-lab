import { expect, test } from "@playwright/test";

test("未连接数据库时清楚说明资料无法保存", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "资料库" }).click();
  await page.getByRole("button", { name: "粘贴文字" }).click();

  await page.getByRole("button", { name: "添加资料" }).click();
  await expect(
    page.getByText("请先粘贴想添加的文字或 Markdown。"),
  ).toBeVisible();

  await page.getByLabel("粘贴文字或 Markdown").fill("一条资料笔记");
  await page.getByRole("button", { name: "添加资料" }).click();
  await expect(page.getByText("请先完成数据库连接，再添加资料。")).toBeVisible();
});

test("未连接数据库时导入文件不会伪造保存成功", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "资料库" }).click();

  await page.getByLabel("选择本地文件").setInputFiles({
    name: "项目记录.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("# 项目记录\n这是一条可追溯的资料。"),
  });
  await expect(page.getByText("1 份文件无法读取或保存，请检查后重试。")).toBeVisible();
  await expect(page.getByText("还没有资料")).toBeVisible();
});
