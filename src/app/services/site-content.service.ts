import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SiteContentEntry {
    key: string;
    value: string;
}

@Injectable({ providedIn: 'root' })
export class SiteContentService {
    private readonly baseUrl = '/api/site-content-api';

    constructor(private http: HttpClient) {}

    get(key: string): Observable<SiteContentEntry | null> {
        return this.http.get<SiteContentEntry | null>(this.baseUrl, { params: { key } });
    }

    save(key: string, value: string): Observable<any> {
        return this.http.put(this.baseUrl, { key, value });
    }
}
