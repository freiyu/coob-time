import { test, expect } from "@playwright/test";
import fs from "node:fs";

test.use({
  viewport: { width: 1280, height: 720 },
  colorScheme: "light",
  permissions: ["clipboard-read", "clipboard-write"],
});

test("phase 7 verification matrix", async ({ page }) => {
  test.setTimeout(600_000);
const check = (n: string, c: unknown, extra: unknown = "") => {
  expect.soft(!!c, `${n}${extra ? " — " + String(extra).slice(0, 200) : ""}`).toBe(true);
};
const timerText = () => page.locator('section[aria-label="Timer"]').innerText();
const rows = () => page.locator("tbody tr").count();
page.on("pageerror", (e) => check("no page error", false, e.message));
const waitReady = async () => {
  await page.waitForFunction(() => {
    const p = document.querySelector('section[aria-label="Scramble"] p.font-mono');
    if (p && p.textContent.trim().length > 2) return true;
    return [...document.querySelectorAll('section[aria-label="Scramble"] button')].some((x) => x.getAttribute("aria-label") === "Show scramble");
  }, { timeout: 25000 }).catch(() => {});
};
const getScramble = async () => {
  const t = await page.evaluate(() => {
    const p = document.querySelector('section[aria-label="Scramble"] p.font-mono');
    return p ? p.textContent.trim() : null;
  });
  if (t) return t;
  const btn = page.locator('section[aria-label="Scramble"] button[aria-label="Show scramble"]').first();
  if (!(await btn.isVisible().catch(() => false))) { await waitReady(); }
  await btn.click();
  await page.waitForSelector('[role="dialog"] p.font-mono', { timeout: 8000 });
  const t2 = await page.locator('[role="dialog"] p.font-mono').first().innerText();
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached", timeout: 3000 }).catch(() => {});
  return t2.trim();
};
page.setDefaultTimeout(10000);
let curPuzzle = "3×3×3";
const switchPuzzle = async (label: string) => {
  await page.keyboard.press("Escape").catch(() => {});
  await page.getByRole("button", { name: curPuzzle, exact: true }).click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
  curPuzzle = label;
  await waitReady();
};
await page.goto("/");
await page.locator('section[aria-label="Scramble"]').waitFor();
await waitReady();

console.log("=== A. 10 puzzle scrambles (browser) ===");
const labels = ["2×2×2","3×3×3","4×4×4","5×5×5","6×6×6","7×7×7","Megaminx","Square-1","Pyraminx","Skewb"];
for (const label of labels) {
  try {
    await switchPuzzle(label);
    const s = await getScramble();
    check(`scramble ${label}`, !!s && s.replace(/\s/g, "").length >= 3, JSON.stringify((s || "").slice(0, 60)));
  } catch (e) { check(`scramble ${label}`, false, e instanceof Error ? e.message : String(e)); }
}
await switchPuzzle("3×3×3");

console.log("=== B. copy + new scramble + N ===");
{
  const t1 = await getScramble();
  await page.getByRole("button", { name: "Copy Scramble", exact: true }).click();
  await page.getByRole("button", { name: "Copied", exact: true }).waitFor({ timeout: 5000 }).catch(() => {});
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check("clipboard equals scramble", clip.trim() === t1.trim(), JSON.stringify({ clip: clip.slice(0, 40), t1: t1.slice(0, 40) }));
  check("copy feedback label", (await page.getByRole("button", { name: /Copied|Copy Scramble/ }).innerText()).includes("Copied"));
  await page.getByRole("button", { name: "New Scramble", exact: true }).click();
  await page.waitForFunction((old) => {
    const p = document.querySelector('section[aria-label="Scramble"] p.font-mono');
    return !!p && p.textContent.trim().length > 2 && p.textContent.trim() !== old;
  }, t1.trim(), { timeout: 20000 }).catch(() => {});
  const t2 = await getScramble();
  check("New Scramble changes text", t2 !== t1, JSON.stringify({ t1: t1.slice(0, 30), t2: t2.slice(0, 30) }));
  await page.keyboard.press("n");
  await page.waitForTimeout(800);
  const t3 = await getScramble();
  check("N shortcut changes scramble", t3 !== t2, JSON.stringify({ t2: t2.slice(0, 30), t3: t3.slice(0, 30) }));
}

console.log("=== C. solve stores exact scramble + running locks ===");
{
  const T = await getScramble();
  const before = await rows();
  await page.keyboard.down("Space"); await page.waitForTimeout(400);
  check("hold shows hold/ready not running", !(await timerText()).includes("Running"), (await timerText()).replace(/\n/g, " | ").slice(0, 60));
  await page.keyboard.up("Space");
  await page.waitForTimeout(500);
  check("running label after release", (await timerText()).includes("Running"), (await timerText()).replace(/\n/g, " | ").slice(0, 60));
  const chromeInert = await page.evaluate(() => {
    const h = document.querySelector("header");
    const wrap = h && h.closest('[aria-hidden="true"]');
    return { hidden: !!wrap, inert: !!(wrap && (wrap.hasAttribute("inert") || "inert" in wrap)), pe: wrap ? getComputedStyle(wrap).pointerEvents : null };
  });
  check("chrome inert+aria-hidden while running", chromeInert.hidden && chromeInert.inert && chromeInert.pe === "none", JSON.stringify(chromeInert));
  const mid = await page.evaluate(() => {
    const p = document.querySelector('section[aria-label="Scramble"] p.font-mono');
    return p ? p.textContent.trim() : null;
  });
  check("scramble unchanged mid-run", mid === T, JSON.stringify({ mid: (mid || "").slice(0, 40), T: T.slice(0, 40) }));
  await page.keyboard.press("Space"); await page.waitForTimeout(500);
  if ((await timerText()).includes("Running")) { await page.keyboard.press("Space"); await page.waitForTimeout(500); }
  check("one solve added", (await rows()) === before + 1, await rows());
  await page.locator("tbody tr").first().click();
  await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
  const dlg = await page.locator('[role="dialog"]').innerText();
  check("solve detail stores exact scramble", dlg.includes(T.trim().slice(0, 30)), JSON.stringify({ T: T.slice(0, 50) }));
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached" }).catch(() => {});
}

console.log("=== D. DNF / +2 ===");
{
  const n = await rows();
  const group = page.getByRole("group", { name: "Penalty for the last solve" });
  check("pending penalty group visible", await group.isVisible());
  await group.getByRole("button", { name: "+2", exact: true }).click();
  await page.waitForTimeout(250);
  check("+2 aria-pressed", (await group.getByRole("button", { name: "+2", exact: true }).getAttribute("aria-pressed")) === "true");
  const rowText = await page.locator("tbody tr").first().innerText();
  check("+2 shown in history", rowText.includes("+"), rowText.replace(/\n/g, " | ").slice(0, 80));
  await group.getByRole("button", { name: "+2", exact: true }).click();
  await page.waitForTimeout(200);
  await group.getByRole("button", { name: "DNF", exact: true }).click();
  await page.waitForTimeout(250);
  check("DNF aria-pressed", (await group.getByRole("button", { name: "DNF", exact: true }).getAttribute("aria-pressed")) === "true");
  const rowText2 = await page.locator("tbody tr").first().innerText();
  check("DNF in history", rowText2.includes("DNF"), rowText2.replace(/\n/g, " | ").slice(0, 80));
  check("stats not-enough copy visible", await page.getByText("Not enough solves").first().isVisible().catch(() => false));
  await group.getByRole("button", { name: "DNF", exact: true }).click();
  await page.waitForTimeout(250);
  check("row count stable through penalties", (await rows()) === n, await rows());
}

console.log("=== E. statistics don't mix puzzles ===");
{
  const n3 = await rows();
  check("3x3 has solves", n3 >= 1, n3);
  await switchPuzzle("2×2×2");
  check("2x2 empty history", (await rows()) === 0, await rows());
  check("2x2 stats not-enough", await page.getByText("Not enough solves").first().isVisible().catch(() => false));
  await switchPuzzle("3×3×3");
  check("3x3 solves restored", (await rows()) === n3, await rows());
}

console.log("=== F. keyboard guards ===");
{
  const n = await rows();
  await page.getByRole("button", { name: "+ Add solve", exact: true }).click();
  await page.getByRole("textbox", { name: "Time" }).focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);
  check("Space in input keeps dialog open", await page.locator('[role="dialog"]').isVisible());
  check("Space in input does not start timer", !(await timerText()).includes("Running"));
  const readMono = () => page.evaluate(() => document.querySelector('section[aria-label="Scramble"] p.font-mono')?.textContent?.trim() ?? null);
  const scrA = await readMono();
  await page.keyboard.press("n");
  await page.waitForTimeout(700);
  const scrB = await readMono();
  check("n inside input does not regenerate scramble", scrA !== null && scrB === scrA, JSON.stringify({ scrA: (scrA || "").slice(0, 30), scrB: (scrB || "").slice(0, 30) }));
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached" });
  await page.keyboard.press("n");
  await page.waitForFunction((old) => {
    const el = document.querySelector('section[aria-label="Scramble"] p.font-mono');
    return !!el && el.textContent.trim().length > 2 && el.textContent.trim() !== old;
  }, (scrB || "").trim(), { timeout: 20000 }).catch(() => {});
  const scr2 = await readMono();
  check("n regenerates after dialog closed", scr2 !== scrB, JSON.stringify({ scrB: (scrB || "").slice(0, 30), scr2: (scr2 || "").slice(0, 30) }));
  check("no stray solve", (await rows()) === n, await rows());
}

console.log("=== G. key repeat ===");
{
  const n = await rows();
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", code: "Space", repeat: true, bubbles: true })));
  await page.waitForTimeout(400);
  check("repeat keydown at idle does not start", !(await timerText()).includes("Running"));
  check("repeat idle adds no solve", (await rows()) === n, await rows());
  await page.keyboard.down("Space"); await page.waitForTimeout(400); await page.keyboard.up("Space");
  await page.waitForTimeout(700);
  const running = (await timerText()).includes("Running");
  await page.evaluate(() => { for (let i = 0; i < 3; i++) window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", code: "Space", repeat: true, bubbles: true })); });
  await page.waitForTimeout(400);
  check("running survives synthetic repeat", (await timerText()).includes("Running"), running);
  await page.keyboard.press("Space"); await page.waitForTimeout(600);
  if ((await timerText()).includes("Running")) { await page.keyboard.press("Space"); await page.waitForTimeout(500); }
  check("exactly one solve from repeated attempts", (await rows()) === n + 1, await rows());
  const t = await page.locator("tbody tr").first().innerText();
  const num = parseFloat(t.split("\n")[1]);
  check("solve not instant-stopped (time >= 0.4s)", num >= 0.4, t.replace(/\n/g, " | "));
}

console.log("=== H. dialogs a11y + focus ===");
{
  const help = page.getByRole("button", { name: "Keyboard shortcuts" });
  await help.click();
  const d = page.locator('[role="dialog"]');
  check("help dialog role", await d.isVisible());
  check("help aria-modal", (await d.getAttribute("aria-modal")) === "true");
  check("help aria-label", !!(await d.getAttribute("aria-label")));
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached" });
  check("focus back on trigger", await help.evaluate((el) => document.activeElement === el));
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => ({ tag: document.activeElement?.tagName ?? "NONE", lbl: document.activeElement?.getAttribute("aria-label") ?? null }));
  check("Tab moves focus off body", focused.tag !== "BODY", JSON.stringify(focused));
  await page.getByRole("button", { name: curPuzzle, exact: true }).click();
  await page.keyboard.press("ArrowDown");
  const role = await page.evaluate(() => document.activeElement?.getAttribute("role") ?? null);
  check("menu arrow focuses menuitem", role === "menuitem", role);
  await page.keyboard.press("Escape");
  check("menu Escape closes", !(await page.getByRole("menu").isVisible().catch(() => false)));
  check("aria-live label present", (await page.locator('section[aria-label="Timer"] [aria-live]').count()) > 0);
  check("h1 brand", (await page.locator("h1").innerText()) === "CubeTime");
}

console.log("=== I. sessions ===");
{
  const n = await rows();
  await page.getByRole("button", { name: /Default session/ }).click();
  await page.getByRole("menuitem", { name: /New session/ }).click();
  await page.waitForTimeout(400);
  check("new session active (empty history)", (await rows()) === 0, await rows());
  const trigger = await page.getByRole("button", { name: /^(Session \d|Default session)/ }).innerText();
  check("session trigger renamed", /^Session \d/.test(trigger), trigger);
  await page.getByRole("button", { name: /^(Session \d|Default session)/ }).click();
  await page.getByRole("menuitem", { name: /Default session \(/ }).click();
  await page.waitForTimeout(400);
  check("switch back restores solves", (await rows()) === n, `${await rows()} vs ${n}`);
}

console.log("=== J. manual add invalid/valid + notes + delete ===");
{
  const n = await rows();
  await page.getByRole("button", { name: "+ Add solve", exact: true }).click();
  await page.getByRole("textbox", { name: "Time" }).fill("abc");
  await page.getByRole("button", { name: "Add solve", exact: true }).click();
  check("invalid manual input error", await page.locator("#manual-time-error").isVisible());
  check("invalid adds nothing", (await rows()) === n, await rows());
  await page.getByRole("textbox", { name: "Time" }).fill("5.67");
  await page.getByRole("button", { name: "Add solve", exact: true }).click();
  await page.waitForTimeout(300);
  check("valid manual added", (await rows()) === n + 1, await rows());
  check("manual time shown", (await page.locator("tbody tr").first().innerText()).includes("5.67"));
  await page.locator("tbody tr").first().click();
  await page.waitForSelector('[role="dialog"]');
  const detail = await page.locator('[role="dialog"]').innerText();
  check("detail marks manual entry", /manual/.test(detail), detail.slice(0, 120));
  const ta = page.locator('[role="dialog"] textarea');
  await ta.fill("phase7 note");
  await page.getByRole("button", { name: "Save note" }).click();
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached" });
  await page.locator("tbody tr").first().click();
  await page.waitForSelector('[role="dialog"]');
  check("note persisted", (await page.locator('[role="dialog"] textarea').inputValue()) === "phase7 note");
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached" });
  await page.locator("tbody tr").first().getByRole("button", { name: /Delete solve/ }).click();
  await page.waitForSelector('[role="dialog"]');
  await page.getByRole("button", { name: /^Delete/ }).last().click();
  await page.waitForTimeout(300);
  check("delete removes row", (await rows()) === n, await rows());
}

console.log("=== K. backup: local-only copy + JSON + CSV ===");
{
  await page.getByLabel("Open data and settings").click();
  await page.waitForSelector('[role="dialog"]');
  const d = page.locator('[role="dialog"]');
  check("local-only explainer", (await d.innerText()).includes("saved only in this browser profile"));
  const [dl1] = await Promise.all([page.waitForEvent("download"), d.getByRole("button", { name: "Export backup (JSON)" }).click()]);
  check("json filename", dl1.suggestedFilename().includes("cubetime-backup"), dl1.suggestedFilename());
  const p1 = await dl1.path();
  const json = JSON.parse(fs.readFileSync(p1, "utf8"));
  check("json envelope valid", json.app === "cubetime" && Array.isArray(json.solves), JSON.stringify({ app: json.app, v: json.schemaVersion, solves: json.solves?.length }));
  const [dl2] = await Promise.all([page.waitForEvent("download"), d.getByRole("button", { name: /Export CSV/ }).click()]);
  check("csv filename", dl2.suggestedFilename().endsWith(".csv"), dl2.suggestedFilename());
  const csvHead = fs.readFileSync(await dl2.path(), "utf8").split("\n")[0];
  check("csv header row", /time|session|puzzle/i.test(csvHead), csvHead.slice(0, 80));
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached" });
}

console.log("=== L. inspection WCA flow ===");
{
  const n = await rows();
  await page.getByLabel("Open data and settings").click();
  await page.waitForSelector('[role="dialog"]');
  const wca = page.locator('[role="dialog"] input[name="inspectionMode"][value="wca"]');
  await wca.click();
  await page.waitForFunction(() => (document.querySelector('input[name="inspectionMode"][value="wca"]') as HTMLInputElement | null)?.checked === true, undefined, { timeout: 5000 });
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached" });
  await page.keyboard.press("Space"); // tap -> inspection
  await page.waitForTimeout(600);
  const t = await timerText();
  check("first Space enters inspection", t.includes("Inspection"), t.replace(/\n/g, " | ").slice(0, 80));
  const inspDigits = (await page.locator('section[aria-label="Timer"] .tabular-nums').first().innerText()).trim();
  check("inspection digits are whole seconds (no ms)", /^\d+$/.test(inspDigits), inspDigits);
  check("no solve yet from inspection", (await rows()) === n, await rows());
  await page.keyboard.down("Space"); await page.waitForTimeout(400); await page.keyboard.up("Space");
  await page.waitForTimeout(600);
  await page.keyboard.press("Space"); await page.waitForTimeout(600);
  if ((await timerText()).includes("Running")) { await page.keyboard.press("Space"); await page.waitForTimeout(500); }
  check("inspection solve recorded", (await rows()) === n + 1, await rows());
  await page.getByLabel("Open data and settings").click();
  await page.waitForSelector('[role="dialog"]');
  const off = page.locator('[role="dialog"] input[name="inspectionMode"][value="off"]');
  await off.click();
  await page.waitForFunction(() => (document.querySelector('input[name="inspectionMode"][value="off"]') as HTMLInputElement | null)?.checked === true, undefined, { timeout: 5000 });
  await page.keyboard.press("Escape");
}

console.log("=== M. theme ===");
{
  await page.getByRole("button", { name: /^(Dark|Light|System)$/, exact: true }).click();
  await page.getByRole("menuitem", { name: "Dark", exact: true }).click();
  check("dark applied", await page.evaluate(() => document.documentElement.classList.contains("dark")));
  await page.reload();
  await page.locator("h1").waitFor();
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"), undefined, { timeout: 10000 }).catch(() => {});
  check("dark persists after reload", await page.evaluate(() => document.documentElement.classList.contains("dark")));
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.getByRole("menuitem", { name: "System", exact: true }).click();
  await page.waitForTimeout(200);
  check("system light clears dark", !(await page.evaluate(() => document.documentElement.classList.contains("dark"))));
}

console.log("=== N. responsive quick ===");
{
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight, sw: document.documentElement.scrollWidth }));
  check("mobile scrolls", m.sh > m.ch + 20, JSON.stringify(m));
  check("mobile no h-overflow", m.sw <= 391, m.sw);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(500);
  const m2 = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight }));
  check("desktop locked", m2.sh <= m2.ch + 1, JSON.stringify(m2));
}

await test.step("O. Space does not scroll (unlocked) + scroll-lock while running", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const y0 = await page.evaluate(() => window.scrollY);
  await page.keyboard.down("Space");
  await page.waitForTimeout(400);
  const y1 = await page.evaluate(() => window.scrollY);
  await page.keyboard.up("Space");
  await page.waitForTimeout(500);
  const y2 = await page.evaluate(() => window.scrollY);
  check("Space never scrolls the page (unlocked)", y0 === y1 && y1 === y2, JSON.stringify({ y0, y1, y2 }));
  check("running label (unlocked)", (await timerText()).includes("Running"));
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(250);
  const y3 = await page.evaluate(() => window.scrollY);
  check("wheel scroll blocked while running (unlocked)", y3 === y2, JSON.stringify({ y2, y3 }));
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);
  if ((await timerText()).includes("Running")) { await page.keyboard.press("Space"); await page.waitForTimeout(500); }
  check("body overflow restored after run", (await page.evaluate(() => document.body.style.overflow)) === "");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(400);
});

await test.step("P. tablet viewport scrolls and stacks", async () => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => ({
    sh: document.documentElement.scrollHeight,
    ch: document.documentElement.clientHeight,
    sw: document.documentElement.scrollWidth,
  }));
  check("tablet scrolls", m.sh > m.ch + 20, JSON.stringify(m));
  check("tablet no h-overflow", m.sw <= 821, m.sw);
  const sb = await page.locator('section[aria-label="Scramble"]').boundingBox();
  const tb = await page.locator('section[aria-label="Timer"]').boundingBox();
  check("tablet stacked (scramble above timer)", !!sb && !!tb && sb.y < tb.y, JSON.stringify({ sb, tb }));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(400);
});

await test.step("Q. generator failure visible and recoverable", async () => {
  await page.route("**/cubing/**", (route) => route.abort());
  await page.reload();
  const surfaced = await page.waitForFunction(() => {
    const alert = document.querySelector('section[aria-label="Scramble"] p[role="alert"]');
    const retry = [...document.querySelectorAll('section[aria-label="Scramble"] button')].some((b) => /^Try again$/i.test((b.textContent || "").trim()));
    return !!(alert && /scramble generation failed/i.test(alert.textContent || "")) || retry;
  }, undefined, { timeout: 20000 }).then(() => true).catch(() => false);
  check("generator failure surfaced (alert/status/retry)", surfaced);
  await page.unroute("**/cubing/**");
  await page.reload();
  await page.locator('section[aria-label="Scramble"]').waitFor();
  await waitReady();
  const recovered = await page.evaluate(() => {
    const p = document.querySelector('section[aria-label="Scramble"] p.font-mono');
    return !!p && p.textContent.trim().length > 2;
  });
  check("scramble recovers after network restored", recovered);
});

await test.step("R. hide timer while solving", async () => {
  const digits = () => page.locator('section[aria-label="Timer"] .tabular-nums').first().innerText();
  await page.getByRole("button", { name: "Open data and settings" }).click();
  await page.waitForSelector('[role="dialog"]');
  const cb = page.getByRole("checkbox", { name: "Hide timer while solving" });
  await cb.click();
  await page.waitForFunction(
    () => [...document.querySelectorAll('input[type="checkbox"]')].some((el) => (el as HTMLInputElement).checked && /hide timer/i.test(el.closest("label")?.textContent || "")),
    undefined,
    { timeout: 5000 },
  );
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached" });
  await page.keyboard.down("Space");
  await page.waitForTimeout(400);
  await page.keyboard.up("Space");
  await page.waitForTimeout(500);
  check("running label while hidden", (await timerText()).includes("Running"));
  const shown = (await digits()).trim();
  check("running digits show 'solve'", shown === "solve", shown);
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);
  if ((await timerText()).includes("Running")) { await page.keyboard.press("Space"); await page.waitForTimeout(500); }
  const after = (await digits()).trim();
  check("stopped shows the time again", /\d/.test(after), after);
  await page.getByRole("button", { name: "Open data and settings" }).click();
  await page.waitForSelector('[role="dialog"]');
  const cb2 = page.getByRole("checkbox", { name: "Hide timer while solving" });
  await cb2.click();
  await page.waitForFunction(
    () => ![...document.querySelectorAll('input[type="checkbox"]')].some((el) => (el as HTMLInputElement).checked && /hide timer/i.test(el.closest("label")?.textContent || "")),
    undefined,
    { timeout: 5000 },
  );
  await page.keyboard.press("Escape");
});

await test.step("S. best-stat popups", async () => {
  let n = await rows();
  while (n < 5) {
    await page.getByRole("button", { name: "+ Add solve", exact: true }).click();
    await page.getByRole("textbox", { name: "Time" }).fill(`${20 + n}.1${n % 10}`);
    await page.getByRole("button", { name: "Add solve", exact: true }).click();
    await page.waitForTimeout(150);
    n = await rows();
  }
  const single = page.getByRole("button", { name: /Best single/ });
  check("best single card is clickable", (await single.count()) === 1, await single.count());
  await single.click();
  await page.locator('[role="dialog"]').waitFor();
  const dlg1 = await page.locator('[role="dialog"]').innerText();
  check("single popup shows solve number", /Solve #\d+/.test(dlg1), dlg1.replace(/\n/g, " | ").slice(0, 120));
  check("single popup has scramble block", /Scramble\s*\n\s*\S/.test(dlg1), dlg1.replace(/\n/g, " | ").slice(-160));
  const viewCount = await page.locator('[role="dialog"] div[aria-hidden][class*="h-44"]').count();
  check("single popup renders scramble view", viewCount === 1, viewCount);
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached" });

  const curAo5 = page.getByRole("button", { name: /^Ao5/ });
  check("current Ao5 card is clickable", (await curAo5.count()) === 1, await curAo5.count());
  await curAo5.click();
  await page.locator('[role="dialog"]').waitFor();
  const dlgCur = await page.locator('[role="dialog"]').innerText();
  check("current Ao5 popup title", dlgCur.includes("Ao5") && !dlgCur.includes("Best"), dlgCur.replace(/\n/g, " | ").slice(0, 120));
  check("current Ao5 range ends at newest", new RegExp(`Solves #\\d+–#${n}$`).test(dlgCur.trim().split("\n").find((l) => /^Solves #/.test(l)) || ""), dlgCur.replace(/\n/g, " | ").slice(0, 160));
  const chip = page.locator('[role="dialog"] button.tabular-nums').first();
  check("current Ao5 has 5 chips", (await page.locator('[role="dialog"] button.tabular-nums').count()) === 5);
  await chip.click();
  await page.locator('[role="dialog"]').waitFor();
  const dlgChip = await page.locator('[role="dialog"]').innerText();
  check("chip opens the solve popup", /Solve #\d+/.test(dlgChip) && dlgChip.includes("Scramble"), dlgChip.replace(/\n/g, " | ").slice(0, 160));
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached" });

  const ao5 = page.getByRole("button", { name: /Best Ao5/ });
  check("best Ao5 card is clickable", (await ao5.count()) === 1, await ao5.count());
  await ao5.click();
  await page.locator('[role="dialog"]').waitFor();
  const dlg2 = await page.locator('[role="dialog"]').innerText();
  check("Best Ao5 popup title", dlg2.includes("Best Ao5"), dlg2.replace(/\n/g, " | ").slice(0, 120));
  check("Best Ao5 popup window range", /Solves #\d+.+#\d+/.test(dlg2), dlg2.replace(/\n/g, " | ").slice(0, 160));
  const chips = await page.locator('[role="dialog"] button.tabular-nums').count();
  check("Best Ao5 popup has 5 chips", chips === 5, chips);
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { state: "detached" });

  check("Ao12 not clickable at 5 solves", (await page.getByRole("button", { name: /Best Ao12/ }).count()) === 0
    && (await page.getByRole("button", { name: /^Ao12/ }).count()) === 0);

  const sol = page.locator('section[aria-label="Statistics"] .grid > *').first();
  const statsSection = page.locator('section[aria-label="Statistics"]');
  const m0 = (await sol.innerText()).match(/(\d+)\/(\d+)/);
  check("Solves card shows valid/total", m0 !== null, (await sol.innerText()).replace(/\n/g, " | "));
  check("Solves denominator equals total rows", m0 !== null && Number(m0[2]) === n, m0?.[0] ?? "?");
  const secTxt = await statsSection.innerText();
  check("redundant card copy removed", !secTxt.includes("in this session") && !secTxt.includes("valid solves"));

  const newestRow = page.locator("tbody tr").first();
  await newestRow.getByRole("button", { name: /^Toggle DNF on solve/ }).click();
  await page.waitForTimeout(150);
  const afterDnf = (await sol.innerText()).match(/(\d+)\/(\d+)/);
  check(
    "DNF lowers the valid count",
    m0 !== null && afterDnf !== null && Number(afterDnf[1]) === Number(m0[1]) - 1 && afterDnf[2] === m0[2],
    afterDnf?.[0] ?? "?",
  );
  await newestRow.getByRole("button", { name: /^Toggle DNF on solve/ }).click();
  await page.waitForTimeout(150);
  const restored = (await sol.innerText()).match(/(\d+)\/(\d+)/);
  check("ratio restored after un-DNF", m0 !== null && restored !== null && restored[0] === m0[0], restored?.[0] ?? "?");
});

});
