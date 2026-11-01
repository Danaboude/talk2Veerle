import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export const SITE_URL = 'https://www.talk2.be';
export const SITE_NAME = 'TALK2';
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

export interface SeoData {
  title: string;
  description: string;
  /** Path such as '/aanbod'. */
  path: string;
  /** Pages without this flag (admin, login, survey, unknown URLs) get noindex. */
  index?: boolean;
  image?: string;
  /** Structured data blocks (JSON-LD) for this page. */
  jsonLd?: object[];
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  apply(data: SeoData | undefined, path: string): void {
    if (!data) {
      this.title.setTitle('TALK2');
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
      this.removeCanonical();
      this.clearJsonLd();
      return;
    }
    const url = SITE_URL + (data.path === '/' ? '/' : data.path);
    const image = data.image ?? DEFAULT_IMAGE;
    this.title.setTitle(data.title);
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({
      name: 'robots',
      content: data.index === false ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1',
    });
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.setCanonical(url);
    // Page specific structured data is replaced on every navigation.
    this.clearJsonLd();
    (data.jsonLd ?? []).forEach(block => this.addJsonLd(block));
  }

  private addJsonLd(data: object): void {
    const el = this.doc.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-seo', 'page');
    el.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    this.doc.head.appendChild(el);
  }

  private clearJsonLd(): void {
    this.doc.head.querySelectorAll('script[data-seo="page"]').forEach(e => e.remove());
  }

  private setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private removeCanonical(): void {
    this.doc.head.querySelector('link[rel="canonical"]')?.remove();
  }
}
