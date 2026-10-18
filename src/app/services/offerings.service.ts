import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BOOKING_LINKS } from '../config/booking-links';

export type OfferingAudience = 'individuen' | 'organisaties' | 'professionals' | 'duos';

export interface Offering {
    id: string;
    title: string;
    intro: string;
    description: string;
    eventDate: string;
    location: string;
    price: string;
    contactLink: string;
    audience: OfferingAudience;
    published: boolean;
}

type OfferingResponse = Offering & { event_date?: string; contact_link?: string };

function normalizeOffering(row: OfferingResponse): Offering {
    const link = (row.contactLink ?? row.contact_link ?? '').trim();
    let contactLink = '';
    if (Object.values(BOOKING_LINKS).some(url => url === link)) contactLink = link;
    else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(link)) contactLink = `mailto:${link}`;
    else if (/^(mailto:|tel:)/i.test(link)) contactLink = link;
    else {
        try {
            const url = new URL(link);
            if (url.protocol === 'https:' && !/(^|\.)cal\.com$/i.test(url.hostname)) contactLink = link;
        } catch { /* Geen of ongeldige inschrijflink: toon de contactoptie. */ }
    }
    return { ...row, eventDate: row.eventDate ?? row.event_date ?? '', contactLink };
}

@Injectable({ providedIn: 'root' })
export class OfferingsService {
    private readonly baseUrl = '/api/offerings-api';

    constructor(private http: HttpClient) {}

    // Public: published offerings for one audience (used on the aanbod page)
    getPublishedForAudience(audience: OfferingAudience): Observable<Offering[]> {
        return this.http.get<OfferingResponse[]>(this.baseUrl, { params: { audience, published: 'true' } })
            .pipe(map(rows => rows.map(normalizeOffering)));
    }

    // Admin: full list (used in the dashboard)
    getAll(): Observable<Offering[]> {
        return this.http.get<OfferingResponse[]>(this.baseUrl)
            .pipe(map(rows => rows.map(row => ({ ...row, eventDate: row.eventDate ?? row.event_date ?? '', contactLink: row.contactLink ?? row.contact_link ?? '' }))));
    }

    save(offering: Offering): Observable<any> {
        return this.http.put(this.baseUrl, offering);
    }

    delete(id: string): Observable<any> {
        return this.http.delete(this.baseUrl, { params: { id } });
    }
}
