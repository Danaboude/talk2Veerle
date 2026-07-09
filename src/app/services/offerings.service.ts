import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type OfferingAudience = 'individuen' | 'organisaties' | 'professionals';

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

@Injectable({ providedIn: 'root' })
export class OfferingsService {
    private readonly baseUrl = '/api/offerings-api';

    constructor(private http: HttpClient) {}

    // Public: published offerings for one audience (used on the aanbod page)
    getPublishedForAudience(audience: OfferingAudience): Observable<Offering[]> {
        return this.http.get<Offering[]>(this.baseUrl, { params: { audience, published: 'true' } });
    }

    // Admin: full list (used in the dashboard)
    getAll(): Observable<Offering[]> {
        return this.http.get<Offering[]>(this.baseUrl);
    }

    save(offering: Offering): Observable<any> {
        return this.http.put(this.baseUrl, offering);
    }

    delete(id: string): Observable<any> {
        return this.http.delete(this.baseUrl, { params: { id } });
    }
}
