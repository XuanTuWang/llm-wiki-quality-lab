import { expect, test } from "@playwright/test";

test("private mode discloses masking and unsupported questions refuse safely", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");

  await page.getByRole("button", { name: "切换到私密模式" }).click();
  await expect(page.getByText("私密资料 · 不保存原文")).toBeVisible();

  await page.getByRole("button", { name: "问一问" }).click();
  await page.getByLabel("向资料库提问").fill(
    "How should a vector database be tuned?",
  );
  await page.getByRole("button", { name: "发送问题" }).click();

  await expect(page.getByText("暂时找不到相关资料")).toBeVisible();
  await expect(
    page.getByText("还没有已确认的资料可以回答这个问题。请先添加资料，并确认系统整理出的内容。"),
  ).toBeVisible();
  await expect(page.getByText("完成模型和资料库连接后，可在这里测试真实问答。")).toBeVisible();
  await expect(
    page.getByText("私密资料不会保存原文到运行记录。"),
  ).toBeVisible();
});
