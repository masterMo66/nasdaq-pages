import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import { CALENDAR } from './data/calendar.mjs';

export async function publishedData() {
  const [snapshot, vix] = await Promise.all(['snapshot', 'vix'].map(name => readFile(`data/${name}.json`, 'utf8').then(JSON.parse)));
  return { 'snapshot.json': { ...snapshot, vix }, 'calendar.json': CALENDAR };
}

export default defineConfig({
  base: './',
  plugins: [react(), {
    name: 'published-data',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const name = req.url?.split('?')[0].replace(/^\//, '');
        if (!['snapshot.json', 'calendar.json'].includes(name)) return next();
        try { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify((await publishedData())[name])); }
        catch (error) { next(error); }
      });
    },
    async generateBundle() {
      for (const [fileName, data] of Object.entries(await publishedData())) {
        this.emitFile({ type: 'asset', fileName, source: JSON.stringify(data) });
      }
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' });
    },
  }],
});
