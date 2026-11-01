import { RenderMode, ServerRoute } from '@angular/ssr';

// Public pages are turned into real HTML at build time, so Google and AI crawlers
// (which often do not run JavaScript) can read the full text.
// Admin, login, creator and survey pages stay client-only and are never prerendered.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'aanbod', renderMode: RenderMode.Prerender },
  { path: 'aanpak', renderMode: RenderMode.Prerender },
  { path: 'over-mij', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
