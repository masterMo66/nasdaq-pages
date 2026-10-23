import { test, expect } from '@playwright/test';

test('iOS-style pointer follows, magnetizes, releases for precision and keyboard', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#funds tbody tr')).toHaveCount(12);
  await page.mouse.move(300, 205);
  await expect(page.locator('html')).toHaveAttribute('data-ios-pointer', 'on');
  await expect(page.locator('.ios-pointer')).toHaveCSS('pointer-events', 'none');
  const button = page.getByRole('group', { name: '时间区间', exact: true }).getByRole('button', { name: '1个月', exact: true });
  await button.hover();
  await expect(button).toHaveAttribute('data-ios-magnetic', '');
  await expect(page.locator('html')).toHaveAttribute('data-ios-pointer-mode', 'magnetic');
  await expect.poll(async () => (await page.locator('.ios-pointer').boundingBox()).width).toBeGreaterThan(40);
  await expect(button).toHaveCSS('cursor', 'none');
  await page.screenshot({ path: 'preview/ios-pointer-magnetic.png' });
  await page.mouse.down();
  await expect(button).toHaveAttribute('data-ios-pressed', '');
  await page.mouse.up();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('searchbox', { name: '搜索基金' }).hover();
  await expect(page.locator('html')).not.toHaveAttribute('data-ios-pointer', 'on');
  await page.getByRole('searchbox', { name: '搜索基金' }).fill('513100');
  await expect(page.locator('#funds tbody tr')).toHaveCount(1);
  await button.hover();
  await expect(page.locator('html')).toHaveAttribute('data-ios-pointer', 'on');
  await page.keyboard.press('Tab');
  await expect(page.locator('html')).not.toHaveAttribute('data-ios-pointer', 'on');
  await button.hover();
  await page.mouse.wheel(0, 180);
  await expect(page.locator('html')).not.toHaveAttribute('data-ios-pointer', 'on');
  expect(errors).toEqual([]);
});

test('reduced motion retains native pointer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const button = page.getByRole('button', { name: '读取最新快照', exact: true });
  await button.hover();
  await expect(page.locator('html')).not.toHaveAttribute('data-ios-pointer', 'on');
  await expect(button).not.toHaveCSS('cursor', 'none');
  await expect(page.locator('.ios-pointer-layer')).toBeHidden();
});

test('upcoming strip height remains fixed with three, one and zero events', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-24T00:00:00Z') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.setFixedTime(new Date('2026-10-24T00:00:00Z'));
    await page.goto(`/?upcoming-width=${width}#calendar`);
    await expect(page.locator('.upcoming-event')).toHaveCount(3);
    const before = (await page.locator('.next-events').boundingBox()).height;
    await page.getByRole('button', { name: '政治', exact: true }).click();
    await expect(page.locator('.upcoming-event')).toHaveCount(1);
    expect((await page.locator('.next-events').boundingBox()).height).toBe(before);
    await page.clock.setFixedTime(new Date('2028-01-01T00:00:00Z'));
    await page.reload();
    await expect(page.locator('.upcoming-event')).toHaveCount(0);
    await expect(page.locator('.upcoming-grid>.subtle')).toBeVisible();
    expect((await page.locator('.next-events').boundingBox()).height).toBe(before);
  }
});

test('compare add/remove uses arc transitions without reviving an exiting chip', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.chip')).toHaveCount(3);
  const button = page.locator('.compare:not(.on)').first();
  const label = await button.getAttribute('aria-label');
  await button.click();
  await expect(page.locator('.chip')).toHaveCount(4);
  const chip = page.getByRole('button', { name: `移除${label.slice(2)}对比`, exact: true });
  await chip.scrollIntoViewIfNeeded();
  const code = await chip.getAttribute('data-fund-code');
  await chip.click();
  await expect(page.locator(`.chip[data-fund-code="${code}"]`)).toBeDisabled();
  await expect(page.locator('.chip')).toHaveCount(3);
  await expect(page.locator('.compare.on')).toHaveCount(3);
});

test.describe('touch pointer', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('touch controls work without a custom pointer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '1个月', exact: true }).tap();
    await expect(page.getByRole('button', { name: '1个月', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).not.toHaveAttribute('data-ios-pointer', 'on');
    await expect(page.locator('.ios-pointer-layer')).toBeHidden();
  });
});
