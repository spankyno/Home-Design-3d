import React from 'react';
import { COPYRIGHT, FOOTER_LINKS } from '../site';

/**
 * Site footer: links to the About page, the author's blog, Aitor Hub and the contact page, plus the copyright.
 * Kept to a single thin row so it costs almost no editing space.
 */
export const Footer: React.FC = () => (
  <footer className="shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-1 flex flex-wrap items-center justify-between gap-x-6 gap-y-0.5 text-[11px] text-slate-500 select-none">
    <p className="font-medium">{COPYRIGHT}</p>

    <nav aria-label="Enlaces del sitio">
      <ul className="flex items-center gap-4">
        {FOOTER_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              title={link.title}
              target="_blank"
              rel={link.internal ? 'noopener' : 'noopener noreferrer'}
              className="font-semibold text-slate-600 hover:text-sky-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600 rounded-xs"
            >
              {link.label}
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  </footer>
);
