import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { BOOKING_LINKS } from '../config/booking-links';
import { SiteContentService } from './site-content.service';

// The booking buttons on the Aanbod page (one per section) and the Contact page (two). Veerle edits these in the dashboard (tab "Knoppen").
export type PageButtonKey = 'individuen' | 'duos' | 'professionals' | 'organisaties' | 'contactIntake' | 'contactOther';

export interface PageButton {
    label: string;
    url: string;
    desc?: string; // small line under the label (only used on the Contact page)
}

export type PageButtons = Record<PageButtonKey, PageButton>;

export const PAGE_BUTTONS_KEY = 'aanbod_buttons';

// Used until Veerle changes something, and as fallback if the database can't be reached.
export const DEFAULT_PAGE_BUTTONS: PageButtons = {
    individuen: { label: 'Boek een eerste gesprek', url: BOOKING_LINKS.firstSession },
    duos: { label: 'Plan een eerste gesprek', url: BOOKING_LINKS.allSessions },
    professionals: { label: 'Boek een kennismakingsgesprek', url: BOOKING_LINKS.freeDiscoveryCall },
    organisaties: { label: 'Boek een kennismakingsgesprek', url: BOOKING_LINKS.freeDiscoveryCall },
    contactIntake: { label: 'Eerste intake 60 minuten', url: BOOKING_LINKS.firstSession, desc: 'Individuele therapie of coaching' },
    contactOther: { label: 'Alle andere sessies', url: BOOKING_LINKS.allSessions, desc: "Duo's, koppels, natuur en vervolgsessies: kies op de agenda" },
};

export const PAGE_BUTTON_SECTIONS: { key: PageButtonKey; title: string; page: string; hasDesc?: boolean }[] = [
    { key: 'individuen', title: 'Individuen', page: 'Pagina Aanbod' },
    { key: 'duos', title: "Duo's en koppels", page: 'Pagina Aanbod' },
    { key: 'professionals', title: 'Professionals', page: 'Pagina Aanbod' },
    { key: 'organisaties', title: 'Organisaties & Groepen', page: 'Pagina Aanbod' },
    { key: 'contactIntake', title: 'Eerste knop', page: 'Pagina Contact', hasDesc: true },
    { key: 'contactOther', title: 'Tweede knop', page: 'Pagina Contact', hasDesc: true },
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
            const desc = saved[key]?.desc;
            result[key] = {
                label: label || DEFAULT_PAGE_BUTTONS[key].label,
                url: url || DEFAULT_PAGE_BUTTONS[key].url,
                desc: typeof desc === 'string' ? desc.trim() : DEFAULT_PAGE_BUTTONS[key].desc,
            };
        }
        return result;
    }
}
