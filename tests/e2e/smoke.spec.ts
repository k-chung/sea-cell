// E2E smoke tests: a real browser plays the built game. Run: npm run e2e
// They check that every screen works end to end, not the rules (unit tests cover those).

import { expect, type Page, test } from '@playwright/test';

/** Collect console errors and page crashes; each test ends by expecting none. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** Play from the title screen to game over: one card, one satellite launch, then answer everything. */
async function playFullRun(page: Page) {
  await page.goto('/?seed=777');
  await page.click('[data-act="new-run"]');
  await page.locator('[data-act="card"]:not([disabled])').first().click();
  await page.click('[data-act="mission"][data-arg="satellite"]');
  for (const slot of ['booster', 'upper', 'payload']) {
    await page.locator(`[data-act="part"][data-arg^="${slot}|"]`).first().click();
  }
  const launch = page.locator('[data-act="launch"]');
  if (await launch.isEnabled()) await launch.click();
  for (let i = 0; i < 300 && !(await page.locator('main.phase-over').count()); i++) {
    const options = page.locator('main.phase-crisis .options button, main.phase-reward .options button');
    if (await options.count()) await options.first().click();
    else if (await page.locator('main.phase-flight').count()) await page.click('[data-act="proceed"]');
    else if (await page.locator('main.phase-report').count()) await page.click('[data-act="continue"]');
    else await page.click('[data-act="end-turn"]');
  }
  await expect(page.locator('main.phase-over .stamp')).toBeVisible();
}

test('PC: a full run from title to game over', async ({ page }) => {
  const errors = watchErrors(page);
  await playFullRun(page);
  expect(errors).toEqual([]);
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('a full run by tapping, with no sideways scrolling', async ({ page }) => {
    const errors = watchErrors(page);
    await playFullRun(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    expect(errors).toEqual([]);
  });

  test('a playtest note opens a prefilled idea issue', async ({ page }) => {
    await page.goto('/?seed=777');
    await page.click('[data-act="new-run"]');
    await page.click('[data-act="note"]');
    await page.fill('#note-text', 'Too many cards');
    const href = await page.locator('[data-act="note-send"]').getAttribute('href');
    expect(href).toContain('issues/new?template=idea.md');
    expect(decodeURIComponent(href ?? '')).toContain('Too many cards');
  });
});

test('the scene gallery renders every screen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/gallery.html');
  await expect(page.locator('.scene')).toHaveCount(9);
  expect(errors).toEqual([]);
});
