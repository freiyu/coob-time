import { test, expect } from "@playwright/test";

test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

test("touch timer: hold starts, tap stops, swipe and mouse click do not", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => {
    const p = document.querySelector('section[aria-label="Scramble"] p.font-mono');
    return !!p && p.textContent.trim().length > 2;
  });

  const card = page.locator('section[aria-label="Timer"] > div');
  const digits = page.locator('section[aria-label="Timer"] .tabular-nums').first();
  const rows = () => page.locator("tbody tr").count();
  const n0 = await rows();
  const timerBox = async () => {
    const b = await card.boundingBox();
    if (b === null) throw new Error("timer card has no bounding box");
    return b;
  };

  // Press-and-hold ≥300ms, lift → solve starts (digits keep advancing).
  await card.dispatchEvent("pointerdown", {
    pointerType: "touch",
    pointerId: 1,
    isPrimary: true,
  });
  await page.waitForTimeout(400);
  await card.dispatchEvent("pointerup", {
    pointerType: "touch",
    pointerId: 1,
    isPrimary: true,
  });
  await page.waitForTimeout(200);
  const d1 = await digits.innerText();
  await page.waitForTimeout(250);
  const d2 = await digits.innerText();
  expect(d1).not.toBe(d2);

  // Tap while running stops and saves the solve.
  let box = await timerBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect.poll(rows, { timeout: 5000 }).toBe(n0 + 1);
  const s1 = await digits.innerText();
  await page.waitForTimeout(300);
  expect(await digits.innerText()).toBe(s1);

  // A swipe starting on the timer must not start a solve (scroll-safe).
  box = await timerBox();
  await card.dispatchEvent("pointerdown", {
    pointerType: "touch",
    pointerId: 2,
    isPrimary: true,
    clientX: box.x + 100,
    clientY: box.y + 50,
  });
  await card.dispatchEvent("pointermove", {
    pointerType: "touch",
    pointerId: 2,
    isPrimary: true,
    clientX: box.x + 100,
    clientY: box.y + 150,
  });
  await card.dispatchEvent("pointerup", {
    pointerType: "touch",
    pointerId: 2,
    isPrimary: true,
  });
  await page.waitForTimeout(200);
  expect(await rows()).toBe(n0 + 1);
  const sw = await digits.innerText();
  await page.waitForTimeout(250);
  expect(await digits.innerText()).toBe(sw);

  // Mouse clicks stay inert (desktop keyboard-only decision preserved).
  box = await timerBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(150);
  expect(await rows()).toBe(n0 + 1);
});
