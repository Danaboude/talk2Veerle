import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { BOOKING_LINKS } from '../config/booking-links';
import { SiteContentService } from './site-content.service';

// The main green button of each section on the Aanbod page. Veerle edits these in the dashboard (tab "Knoppen").
export type PageButtonKey = 'individuen' | 'duos' | 'professionals' | 'organisaties';

export interface PageButton {
    label: string;
    url: string;
}

export type PageButtons = Record<PageButtonKey, PageButton>;

export const PAGE_BUTTONS_KEY = 'aanbod_buttons';

// Used until Veerle changes something, and as fallback if the database can't be reached.
export const DEFAULT_PAGE_BUTTONS: PageButtons = {
    individuen: { label: 'Boek een eerste gesprek', url: BOOKING_LINKS.firstSession },
    duos: { label: 'Plan een eerste gesprek', url: BOOKING_LINKS.allSessions },
    professionals: { label: 'Boek een kennismakingsgesprek', url: BOOKING_LINKS.freeDiscoveryCall },
    organisaties: { label: 'Boek een kennismakingsgesprek', url: BOOKING_LINKS.freeDiscoveryCall },
};

export const PAGE_BUTTON_SECTIONS: { key: PageButtonKey; title: string }[] = [
    { key: 'individuen', title: 'Individuen' },
    { key: 'duos', title: "Duo's en koppels" },
    { key: 'professionals', title: 'Professionals' },
    { key: 'organisaties', title: 'Organisaties & Groepen' },
];

/**
 * Turns whatever Veerle typed into a safe link:
 * a https link stays as is, an e-mail address becomes a mailto: link, anything else is rejected (null).
 */
export function normalizeButtonUrl(input: string): string | null {
    const value = (input ?? '').trim();
    if (/^https:\/\/\S+$/i.test(value)) return value;
    if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]{2,}/i.test(value)) return value;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return `mailto:${value}`;
    return null;
}

@Injectable({ providedIn: 'root' })
export class PageButtonsService {
    private siteContent = inject(SiteContentService);

    get(): Observable<PageButtons> {
        return this.siteContent.get(PAGE_BUTTONS_KEY).pipe(
            map(entry => this.merge(entry?.value)),
            catchError(() => of(DEFAULT_PAGE_BUTTONS)),
        );
    }

    save(buttons: PageButtons): Observable<unknown> {
        return this.siteContent.save(PAGE_BUTTONS_KEY, JSON.stringify(buttons));
    }

    // Saved values win, but anything missing or invalid falls back to the default so a button never breaks.
    private merge(raw?: string): PageButtons {
        let saved: Partial<Record<PageButtonKey, Partial<PageButton>>> = {};
        try { saved = raw ? JSON.parse(raw) : {}; } catch { /* ignore broken data */ }
        const result = { ...DEFAULT_PAGE_BUTTONS };
        for (const { key } of PAGE_BUTTON_SECTIONS) {
            const label = saved[key]?.label?.trim();
            const url = normalizeButtonUrl(saved[key]?.url ?? '');
            result[key] = { label: label || DEFAULT_PAGE_BUTTONS[key].label, url: url || DEFAULT_PAGE_BUTTONS[key].url };
        }
        return result;
    }
}
