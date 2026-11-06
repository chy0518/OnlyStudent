import { test, expect } from "@playwright/test";
test.use({
  channel: "chrome",
  baseURL: "http://localhost:5173",
  viewport: { width: 1440, height: 1000 },
});
async function login(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "进入学习空间" }).click();
  await expect(page.locator("nav")).toBeVisible();
}
test("search has an empty state and reset restores courses", async ({
  page,
}) => {
  await login(page);
  await page.locator('nav a[href="/courses"]').click();
  await expect(page.locator(".course-card").first()).toBeVisible();
  await page.getByPlaceholder("搜索你感兴趣的课程").fill("不存在的课程xyz");
  await expect(
    page.getByRole("heading", { name: "没有找到相关课程" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "清除筛选" }).click();
  await expect(page.locator(".course-card").first()).toBeVisible();
  await page.screenshot({ path: "tests/courses-desktop.png", fullPage: true });
});
test("subject filter and price sorting compose correctly", async ({ page }) => {
  await login(page);
  await page.goto("/courses");
  await page.getByRole("button", { name: "数学", exact: true }).click();
  await expect(page.locator(".course-card").first()).toBeVisible();
  const subjects = await page.locator('.course-card .tag').allTextContents();
  expect(subjects.length).toBeGreaterThan(0);
  expect(subjects.every(subject=>subject==='数学')).toBeTruthy();
  await expect(page.locator('.course-card').filter({hasText:'函数的世界'})).toBeVisible();
  await page.getByRole("button", { name: "全部学科", exact: true }).click();
  await page.getByLabel("课程排序").selectOption("price-asc");
  await expect(page.locator(".course-card").first()).toContainText("免费学习");
});
test("phone navigation leaves room for content and supports logout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await expect(page.getByRole("button", { name: "退出登录" })).toBeVisible();
  await page.locator('nav a[href="/courses"]').click();
  await expect(page.locator(".course-card").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({ path: "tests/courses-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "退出登录" }).click();
  await page.getByRole("button", { name: "教师体验", exact: true }).click();
  await expect(page.locator("input[name=username]")).toHaveValue("teacher");
  await page.getByRole("button", { name: "进入学习空间" }).click();
  await expect(page.locator("nav")).toBeVisible();
});
test("failed course request shows retry and recovers", async ({ page }) => {
  await login(page);
  await page.route("**/api/courses", (route) => route.abort());
  await page.locator('nav a[href="/courses"]').click();
  await expect(page.getByRole("button", { name: "重新加载" })).toBeVisible();
  await page.unroute("**/api/courses");
  await page.getByRole("button", { name: "重新加载" }).click();
  await expect(page.locator(".course-card").first()).toBeVisible();
});
