import { test, expect } from '@playwright/test';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';

test('production assets, refresh and calendar work under a GitHub Pages repository path', async ({ page }) => {
  const root = resolve('dist');
  const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (!pathname.startsWith('/nasdaq-pages/')) { response.writeHead(404).end(); return; }
    const path = resolve(root, pathname.slice('/nasdaq-pages/'.length) || 'index.html');
    if (relative(root, path).startsWith('..')) { response.writeHead(403).end(); return; }
    try {
      const body = await readFile(path);
      response.setHeader('Content-Type', { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' }[extname(path)] || 'application/octet-stream');
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/nasdaq-pages/`);
    await expect(page.locator('#funds tbody tr')).toHaveCount(12);
    const refresh = page.waitForResponse(response => response.url().includes('/nasdaq-pages/snapshot.json?'));
    await page.getByRole('button', { name: '读取最新快照' }).click();
    expect((await refresh).status()).toBe(200);
    await page.getByRole('link', { name: '美国重要日期', exact: true }).last().click();
    await expect(page.locator('.calendar-cell')).toHaveCount(42);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
