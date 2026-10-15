import { expect, test, type Page } from "@playwright/test";

async function openDataPanel(page: Page) {
  await page.getByRole("button", { name: "Open data and settings" }).click();
  return page.getByLabel("Data and settings");
}

async function gotoWithFreshLocalData(page: Page) {
  await page.goto("/");
  const panel = await openDataPanel(page);
  await expect(panel.getByText("solves stored in this browser")).toBeVisible({
    timeout: 60_000,
  });
  const deleteAll = panel.getByRole("button", {
    name: "Delete all local data",
  });
  if (await deleteAll.isEnabled()) {
    await deleteAll.click();
    await panel
      .getByPlaceholder("Type DELETE to confirm")
      .fill("DELETE");
    await panel.getByRole("button", { name: "Delete everything" }).click();
    await expect(panel.getByText("0 solves stored in this browser")).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByLabel("Timer").getByText("Hold Space to start").first(),
  ).toBeVisible({ timeout: 60_000 });
}

async function completeOneSolve(page: Page) {
  await page.keyboard.down("Space");
  await page.waitForTimeout(400); // hold past the 300ms arm threshold
  await page.keyboard.up("Space"); // release starts the solve
  await page.keyboard.press("Space"); // stop
  await expect(page.locator("table tbody tr")).toHaveCount(1);
}

test("a completed solve survives a page reload", async ({ page }) => {
  await gotoWithFreshLocalData(page);
  await completeOneSolve(page);
  const timeText = await page.locator("table tbody tr td").nth(1).innerText();

  await page.reload();
  await expect(
    page.getByLabel("Timer").getByText("Hold Space to start").first(),
  ).toBeVisible({ timeout: 60_000 });
  await expect(page.locator("table tbody tr")).toHaveCount(1);
  await expect(page.locator("table tbody tr td").nth(1)).toHaveText(timeText);
});

test("start mode setting persists across reload", async ({ page }) => {
  await gotoWithFreshLocalData(page);
  const panel = await openDataPanel(page);
  await panel.getByText("Press Space to start").click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByLabel("Timer").getByText("Press Space to start").first(),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByLabel("Timer").getByText("Press Space to start").first(),
  ).toBeVisible({ timeout: 60_000 });
});

test("export, delete all, and merge-import restore the data", async ({
  page,
}) => {
  await gotoWithFreshLocalData(page);
  await completeOneSolve(page);
  const panel = await openDataPanel(page);

  const downloadPromise = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Export backup (JSON)" }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();

  await panel.getByRole("button", { name: "Delete all local data" }).click();
  await panel.getByPlaceholder("Type DELETE to confirm").fill("DELETE");
  await panel.getByRole("button", { name: "Delete everything" }).click();
  await expect(panel.getByText("0 solves stored in this browser")).toBeVisible();
  await expect(page.locator("table tbody tr")).toHaveCount(0);

  await panel.locator('input[type="file"]').setInputFiles(backupPath!);
  await expect(panel.getByText(/Backup contains/)).toBeVisible();
  await panel.getByRole("button", { name: "Merge into local data" }).click();
  await expect(panel.getByText(/Imported 1 solves and/)).toBeVisible();
  await expect(page.locator("table tbody tr")).toHaveCount(1);
});
