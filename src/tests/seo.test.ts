import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FURNITURE_CATALOG } from '../catalog';
import { COLOR_FAMILIES, FINISHES } from '../materials/finishes';
import { AUTHOR, COPYRIGHT, FOOTER_LINKS } from '../site';
import { seoPlugin } from '../../vite.seo';

const root = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');
const pages = { home: read('index.html'), about: read('acerca-de/index.html') };

const metaContent = (html: string, attr: string, value: string) =>
  new RegExp(`<meta[^>]*${attr}="${value}"[^>]*content="([^"]*)"`, 'i').exec(html)?.[1];

describe.each(Object.entries(pages))('SEO basics: %s', (_name, html) => {
  it('has a sensible title and meta description', () => {
    const title = /<title>([^<]+)<\/title>/.exec(html)?.[1] ?? '';
    const description = metaContent(html, 'name', 'description') ?? '';
    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(70);
    expect(description.length).toBeGreaterThanOrEqual(90);
    expect(description.length).toBeLessThanOrEqual(165);
  });

  it('declares language, canonical, robots, Open Graph and Twitter cards', () => {
    expect(html).toMatch(/<html lang="es">/);
    expect(html).toMatch(/<link rel="canonical" href="%SITE_URL%\//);
    expect(metaContent(html, 'name', 'robots')).toMatch(/index/);
    for (const prop of ['og:title', 'og:description', 'og:image', 'og:url', 'og:locale', 'og:site_name']) {
      expect(metaContent(html, 'property', prop), prop).toBeTruthy();
    }
    expect(metaContent(html, 'name', 'twitter:card')).toBe('summary_large_image');
    expect(metaContent(html, 'property', 'og:image')).toMatch(/^%SITE_URL%\/og-image\.jpg$/);
  });

  it('has valid JSON-LD structured data', () => {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      const data = JSON.parse(block.replaceAll('%SITE_URL%', 'https://example.com').replaceAll('%BUILD_DATE%', '2026-01-01'));
      expect(data['@context']).toBe('https://schema.org');
      expect(Array.isArray(data['@graph'])).toBe(true);
    }
  });

  it('links to the same-site assets it needs', () => {
    for (const asset of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'manifest.webmanifest', 'og-image.jpg']) {
      expect(existsSync(resolve(root, 'public', asset)), asset).toBe(true);
    }
  });
});

describe('content claims match the real data', () => {
  const numbers = {
    pieces: FURNITURE_CATALOG.length,
    colors: COLOR_FAMILIES.flatMap((f) => f.colors).length,
    finishes: FINISHES.length,
  };

  it.each(Object.entries(pages))('%s: piece / colour / finish counts are accurate', (_name, html) => {
    const text = html.replace(/<[^>]+>/g, ' ');
    for (const m of text.matchAll(/(\d+)\s+(piezas|muebles|colores|tonos|acabados)/g)) {
      const n = Number(m[1]);
      const kind = m[2];
      if (kind === 'piezas' || kind === 'muebles') expect(n, m[0]).toBe(numbers.pieces);
      if (kind === 'colores' || kind === 'tonos') expect(n, m[0]).toBe(numbers.colors);
      if (kind === 'acabados') expect(n, m[0]).toBe(numbers.finishes);
    }
    expect(text).toContain(`${numbers.pieces} piezas`);
  });
});

describe('About page', () => {
  const html = pages.about;

  it('has exactly one h1 and a logical heading structure', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect((html.match(/<h2[\s>]/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it('covers tech stack, how it works and the author contact data', () => {
    for (const word of ['Stack tecnológico', 'Cómo funciona', 'Autor y contacto', 'React', 'TypeScript', 'Three.js', 'Zustand']) {
      expect(html).toContain(word);
    }
    for (const url of [AUTHOR.blog, AUTHOR.hub, AUTHOR.contact]) expect(html).toContain(`href="${url}"`);
    expect(html).toContain(COPYRIGHT);
    expect(html).toContain('Aitor Sánchez Gutiérrez');
  });

  it('every image has alt text and external links are safe', () => {
    for (const img of html.matchAll(/<img\b[^>]*>/g)) expect(img[0]).toMatch(/\balt="/);
    for (const a of html.matchAll(/<a\b[^>]*href="https?:\/\/[^"]*"[^>]*>/g)) expect(a[0]).toMatch(/rel="[^"]*noopener/);
  });
});

describe('footer', () => {
  it('links to About, blog, Aitor Hub and contact with the requested URLs and the copyright', () => {
    expect(FOOTER_LINKS.map((l) => l.href)).toEqual(['/acerca-de/', AUTHOR.blog, AUTHOR.hub, AUTHOR.contact]);
    expect(AUTHOR.blog).toBe('https://aitorsanchez.pages.dev');
    expect(AUTHOR.hub).toBe('https://aitorhub.vercel.app');
    expect(AUTHOR.contact).toBe('https://aitorsanchez.pages.dev/contacto');
    expect(COPYRIGHT).toBe('© 2026 Aitor Sánchez Gutiérrez. Todos los derechos reservados.');
  });
});

describe('public files', () => {
  it('manifest is valid and its icons exist', () => {
    const manifest = JSON.parse(read('public/manifest.webmanifest'));
    expect(manifest.name).toBe('My Home Design');
    expect(manifest.lang).toBe('es');
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) expect(existsSync(resolve(root, 'public', icon.src.slice(1))), icon.src).toBe(true);
  });

  it('security and cache headers are defined', () => {
    const headers = read('public/_headers');
    for (const h of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy']) {
      expect(headers).toContain(h);
    }
    expect(headers).toMatch(/\/assets\/\*\s+Cache-Control: public, max-age=31536000, immutable/);
    expect(headers).toContain("object-src 'none'");
  });

  it('404 page is not indexable', () => {
    expect(read('public/404.html')).toMatch(/name="robots" content="noindex/);
  });
});

describe('seo build plugin', () => {
  it('replaces the site URL, build date and installed versions', () => {
    const plugin = seoPlugin();
    const hook = plugin.transformIndexHtml as (html: string) => string;
    const out = hook('<a href="%SITE_URL%/x">%BUILD_DATE%</a> %PKG_react% %PKG_three%');
    expect(out).not.toContain('%');
    expect(out).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(out).toMatch(/ \d+\.\d+\.\d+ \d+\.\d+\.\d+$/);
  });
});
