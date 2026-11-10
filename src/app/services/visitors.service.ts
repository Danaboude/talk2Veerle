import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Visitor } from '../models/visitor.model';

/** Admin-only access to the recorded website visits (the API checks the admin token). */
@Injectable({ providedIn: 'root' })
export class VisitorsService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/visitors-api';

    getAll(): Observable<Visitor[]> {
        return this.http.get<Visitor[]>(this.baseUrl);
    }

    delete(id: string): Observable<unknown> {
        return this.http.delete(this.baseUrl, { params: { id } });
    }

    deleteAll(): Observable<unknown> {
        return this.http.delete(this.baseUrl, { params: { all: 'true' } });
    }
}
