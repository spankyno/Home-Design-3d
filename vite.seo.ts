import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

/**
 * SEO build helpers.
 *
 *  - Replaces tokens in every HTML entry: `%SITE_URL%` (absolute canonical / social URLs), `%BUILD_DATE%` and
 *    `%PKG_<name>%` (installed dependency versions, so the About page never lists stale versions).
 *  - Emits `sitemap.xml` and `robots.txt` with the production URL.
 *
 * The public URL comes from the SITE_URL environment variable (e.g. SITE_URL=https://mydomain.com npm run build).
 */

/** Pages included in the sitemap (path, change frequency, priority). */
const PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/acerca-de/', changefreq: 'monthly', priority: '0.7' },
];

const DEFAULT_SITE_URL = 'https://home-design-3d.kbo1.workers.dev';

/** Social / structured-data image (1200×630 PNG in /public), listed in the sitemap for both pages. */
const SITEMAP_IMAGE = '/og-image.png';

type PackageJson = { version?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

export function seoPlugin(): Plugin {
  const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
  const buildDate = new Date().toISOString().slice(0, 10);

  const readJson = (url: URL) => JSON.parse(readFileSync(url, 'utf8')) as PackageJson;
  const declared = readJson(new URL('./package.json', import.meta.url));
  const ranges = { ...declared.dependencies, ...declared.devDependencies };

  // Prefer the version actually installed; fall back to the declared range (^1.2.3 -> 1.2.3)
  const versionOf = (name: string) => {
    try {
      const installed = readJson(new URL(`./node_modules/${name}/package.json`, import.meta.url)).version;
      if (installed) return installed;
    } catch {
      // not installed (e.g. a clean checkout before `npm install`)
    }
    return (ranges[name] ?? '').replace(/^[^\d]*/, '');
  };

  return {
    name: 'my-home-design-seo',

    transformIndexHtml(html) {
      return html
        .replaceAll('%SITE_URL%', siteUrl)
        .replaceAll('%BUILD_DATE%', buildDate)
        .replace(/%PKG_([a-z0-9._-]+)%/g, (_m, name: string) => versionOf(name) || name);
    },

    generateBundle() {
      const urls = PAGES.map(
        (p) =>
          `  <url>\n    <loc>${siteUrl}${p.path}</loc>\n    <lastmod>${buildDate}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n    <image:image>\n      <image:loc>${siteUrl}${SITEMAP_IMAGE}</image:loc>\n    </image:image>\n  </url>`
      ).join('\n');

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
    },
  };
}
