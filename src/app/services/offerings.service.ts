import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CONTACT_EMAIL } from '../config/booking-links';

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

function mailtoFor(title?: string, address: string = CONTACT_EMAIL): string {
    return title ? `mailto:${address}?subject=${encodeURIComponent('Interesse in ' + title)}` : `mailto:${address}`;
}

function normalizeOffering(row: OfferingResponse): Offering {
    const link = (row.contactLink ?? row.contact_link ?? '').trim();
    // Standaard (geen of ongeldige link): een e-mail naar Veerle met de titel van het aanbod als onderwerp.
    let contactLink = mailtoFor(row.title);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(link)) contactLink = mailtoFor(row.title, link);
    else if (/^mailto:/i.test(link)) contactLink = link.includes('?') ? link : mailtoFor(row.title, link.slice(7));
    else if (/^tel:/i.test(link)) contactLink = link;
    else {
        try {
            const url = new URL(link);
            if (url.protocol === 'https:') contactLink = link;
        } catch { /* Geen of ongeldige link: val terug op e-mail. */ }
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
