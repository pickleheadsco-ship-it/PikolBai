import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to generate 200.html for Cloudflare Pages native SPA fallback
const cloudflareSpaFallbackPlugin = () => ({
  name: 'cloudflare-spa-fallback',
  closeBundle() {
    const distDir = path.resolve(__dirname, 'dist');
    const indexPath = path.resolve(distDir, 'index.html');
    const spaPath = path.resolve(distDir, '200.html');
    const notFoundPath = path.resolve(distDir, '404.html');

    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, spaPath);
      fs.copyFileSync(indexPath, notFoundPath);
    }
  },
});

// Plugin to proxy ReClub URL fetches server-side avoiding browser CORS restrictions
const reclubProxyPlugin = () => ({
  name: 'reclub-proxy-plugin',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (!req.url || !req.url.startsWith('/api/reclub/fetch')) {
        return next();
      }
      try {
        const fullUrl = new URL(req.url, 'http://localhost:3000');
        const targetUrl = fullUrl.searchParams.get('url');

        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Missing url query parameter' }));
          return;
        }

        const validUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

        const remoteResp = await fetch(validUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });

        const contentType = remoteResp.headers.get('content-type') || '';
        const bodyText = await remoteResp.text();

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            ok: true,
            status: remoteResp.status,
            contentType,
            url: validUrl,
            data: bodyText,
          })
        );
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Failed to fetch remote URL' }));
      }
    });
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cloudflareSpaFallbackPlugin(), reclubProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
