/** Public facts about the site and its author: single source of truth for the footer and the About page copy. */

export const AUTHOR = {
  name: 'Aitor Sánchez Gutiérrez',
  blog: 'https://aitorsanchez.pages.dev',
  hub: 'https://aitorhub.vercel.app',
  contact: 'https://aitorsanchez.pages.dev/contacto',
} as const;

export const COPYRIGHT = `© 2026 ${AUTHOR.name}. Todos los derechos reservados.`;

/** Path of the static About page (see /acerca-de/index.html). */
export const ABOUT_PATH = '/acerca-de/';

export interface FooterLink {
  label: string;
  href: string;
  /** Same-site page opened in a new tab so the editor session is never interrupted. */
  internal?: boolean;
  /** Short description for assistive technology and tooltips. */
  title: string;
}

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Acerca de', href: ABOUT_PATH, internal: true, title: 'Tecnología, funcionamiento y autor de My Home Design' },
  { label: 'Blog', href: AUTHOR.blog, title: 'Blog de Aitor Sánchez' },
  { label: 'Aitor Hub', href: AUTHOR.hub, title: 'Aitor Hub: proyectos y recursos' },
  { label: 'Contacto', href: AUTHOR.contact, title: 'Contactar con el autor' },
];
