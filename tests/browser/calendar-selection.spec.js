import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function contrast(locator) {
  return locator.evaluate(element => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = color => { context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1); return [...context.getImageData(0, 0, 1, 1).data]; };
    const style = getComputedStyle(element), foreground = rgba(style.color);
    let parent = element, background = [255, 255, 255, 255];
    while (parent) {
      const candidate = rgba(getComputedStyle(parent).backgroundColor);
      if (candidate[3] === 255) { background = candidate; break; }
      parent = parent.parentElement;
    }
    const luminance = color => color.slice(0, 3).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
    const a = luminance(foreground), b = luminance(background);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  });
}

test('whole date cell selects through whitespace, with keyboard and independent event clicks', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-24T00:00:00Z') });
  await page.goto('/#calendar');
  const empty = page.locator('[data-date="2026-10-24"]');
  await empty.click({ position: { x: 8, y: 75 } });
  await expect(empty).toHaveClass(/selected-day/);
  await expect(empty.locator('.day-select')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.calendar-detail h2')).toHaveText('2026-10-24');
  const cell = page.locator('[data-date="2026-10-29"]');
  await cell.locator('.day-select').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.calendar-detail h2')).toHaveText('2026-10-29');
  await cell.locator('.calendar-event').first().click();
  await expect(cell.locator('.calendar-event').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.is-current-event')).toBeVisible();
  await cell.locator('.day-select').focus();
  await page.keyboard.press('Space');
  await expect(cell.locator('.calendar-event[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('.calendar-cell .calendar-cell')).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const theme of ['light', 'dark']) {
  test(`calendar labels and stats retain contrast before, during and after hover in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' });
    await page.goto('/');
    if (theme === 'dark') await page.getByRole('switch', { name: '深色模式' }).click();
    const card = page.getByRole('article', { name: '区间最高 / 最低', exact: true });
    await expect(card.locator('.stat-range-row')).toHaveCount(2);
    for (const strong of await card.locator('.stat-range-row strong').all()) expect(await contrast(strong)).toBeGreaterThanOrEqual(4.5);
    const before = await card.locator('.stat-card-value').evaluate(el => getComputedStyle(el).backgroundColor);
    await card.hover();
    await expect.poll(() => card.locator('.stat-card-value').evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(before);
    for (let frame = 0; frame < 4; frame++) {
      for (const text of await card.locator('.stat-range-row span, .stat-range-row strong').all()) expect(await contrast(text)).toBeGreaterThanOrEqual(4.5);
      await page.waitForTimeout(50);
    }
    await page.screenshot({ path: `preview/stat-range-hover-${theme}.png` });
    for (const other of await page.locator('.historystats .stat-card').all()) {
      await other.hover();
      for (const value of await other.locator('.stat-card-value strong').all()) expect(await contrast(value)).toBeGreaterThanOrEqual(4.5);
    }
    // Theme changes must not interpolate a light panel under dark-theme labels.
    await page.getByRole('switch', { name: '深色模式' }).click();
    for (const text of await page.locator('.stat-card-label>span:last-child, .stat-card-note').all()) expect(await contrast(text)).toBeGreaterThanOrEqual(4.5);
    await page.getByRole('switch', { name: '深色模式' }).click();
    await page.goto('/#calendar');
    await expect(page.locator('.calendar-cell')).toHaveCount(42);
    for (const [category, label] of [['inflation', '通胀'], ['jobs', '就业'], ['fed', '美联储'], ['politics', '政治'], ['growth', '经济增长'], ['earnings', '财报']]) {
      await page.getByRole('button', { name: label, exact: true }).click();
      const event = page.locator(`.calendar-event.cal-category-${category}`).first();
      if (!await event.count()) await page.getByRole('button', { name: '下个月', exact: true }).click();
      await expect(event).toBeVisible();
      const cell = event.locator('..').locator('..');
      await cell.locator('.day-select').focus(); await page.keyboard.press('Enter');
      expect(await contrast(event)).toBeGreaterThanOrEqual(4.5);
      expect(await event.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(await cell.evaluate(el => getComputedStyle(el).backgroundColor));
      await event.hover();
      expect(await contrast(event)).toBeGreaterThanOrEqual(4.5);
      await event.click();
      await expect(event).toHaveAttribute('aria-pressed', 'true');
      expect(await contrast(event)).toBeGreaterThanOrEqual(4.5);
    }
    await page.getByRole('group', { name: '事件类别', exact: true }).getByRole('button', { name: '全部', exact: true }).click();
    await page.mouse.move(1, 1);
    await page.screenshot({ path: `preview/calendar-selection-${theme}.png`, fullPage: true });
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
  });
}

test('375px touch date whitespace selects without shifting the grid', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/#calendar');
  const cell = page.locator('[data-date="2026-10-24"]');
  const before = (await page.locator('.calendar-grid').boundingBox()).height;
  await cell.locator('.day-select').tap({ position: { x: 8, y: 70 } });
  await expect(cell).toHaveClass(/selected-day/);
  expect((await page.locator('.calendar-grid').boundingBox()).height).toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'preview/calendar-touch-selection.png', fullPage: true });
  await context.close();
});
