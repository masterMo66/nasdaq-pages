import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('S&P 500 has independent stats, comparisons, favorites, export and persisted index', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#funds tbody tr')).toHaveCount(12);
  await page.locator('.compare:not(.on)').first().click();
  await expect(page.locator('.chip')).toHaveCount(4);
  await page.getByRole('button', { name: '标普 500', exact: true }).click();
  await expect(page.locator('#funds tbody tr')).toHaveCount(4);
  await expect(page.locator('.breadcrumb')).toContainText('标普 500');
  await expect(page.getByRole('article', { name: '已覆盖标普 500 ETF' })).toContainText('4');
  await expect(page.locator('.chip')).toHaveCount(3);
  for (const code of ['513500', '513650', '159655', '159612']) await expect(page.locator('#funds tbody')).toContainText(code);
  await expect(page.locator('.chart-series')).toHaveCount(3);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出曲线 CSV' }).click();
  expect((await download).suggestedFilename()).toContain('标普500ETF同日溢价');
  await page.locator('.favorite').first().click();
  await page.getByRole('button', { name: '我的关注', exact: true }).click();
  await expect(page.locator('#funds tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: '纳指 100', exact: true }).click();
  await expect(page.locator('#funds tbody tr')).toHaveCount(12);
  await expect(page.locator('.chip')).toHaveCount(4);
  await page.getByRole('button', { name: '我的关注', exact: true }).click();
  await expect(page.locator('#funds tbody tr')).toHaveCount(0);
  await page.getByRole('button', { name: '标普 500', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: '标普 500', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#funds tbody tr')).toHaveCount(4);
  await page.getByRole('button', { name: '我的关注', exact: true }).click();
  await expect(page.locator('#funds tbody tr')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('S&P 500 remains usable at 375px in light and dark themes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: '标普 500', exact: true }).click();
  await expect(page.locator('#funds tbody tr')).toHaveCount(4);
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('switch', { name: '深色模式' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
    await page.screenshot({ path: `preview/sp500-mobile-${theme}.png`, fullPage: true });
  }
});
