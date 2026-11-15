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

test('a full run from title to game over', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?seed=777');
  await page.click('[data-act="new-run"]');

  // Turn 1: play a card, then build and launch a satellite.
  await page.locator('[data-act="card"]:not([disabled])').first().click();
  await page.click('[data-act="mission"][data-arg="satellite"]');
  for (const slot of ['booster', 'upper', 'payload']) {
    await page.locator(`[data-act="part"][data-arg^="${slot}|"]`).first().click();
  }
  const launch = page.locator('[data-act="launch"]');
  if (await launch.isEnabled()) await launch.click();

  // Then answer whatever comes up until the run ends.
  for (let i = 0; i < 300 && !(await page.locator('main.phase-over').count()); i++) {
    if (await page.locator('main.phase-crisis').count()) await page.keyboard.press('1');
    else if (await page.locator('main.phase-reward').count()) await page.keyboard.press('1');
    else if (await page.locator('main.phase-report').count()) await page.click('[data-act="continue"]');
    else await page.click('[data-act="end-turn"]');
  }
  await expect(page.locator('main.phase-over .stamp')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the scene gallery renders every screen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/gallery.html');
  await expect(page.locator('.scene')).toHaveCount(8);
  expect(errors).toEqual([]);
});

test('phone width: no sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?seed=777');
  await page.click('[data-act="new-run"]');
  await page.click('[data-act="mission"][data-arg="satellite"]');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
