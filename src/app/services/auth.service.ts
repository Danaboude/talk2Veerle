import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    // Simple reactive state
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    get isAuthenticated(): boolean {
        return this.isAuthenticatedSubject.value;
    }

    private hasToken(): boolean {
        return !!localStorage.getItem('talk2_admin_token');
    }

    login(email: string, password: string): Observable<{ success: boolean; token: string }> {
        return this.http.post<{ success: boolean; token: string }>('/api/auth', { email, password }).pipe(
            tap(res => {
                localStorage.setItem('talk2_admin_token', res.token);
                this.isAuthenticatedSubject.next(true);
            })
        );
    }

    logout() {
        localStorage.removeItem('talk2_admin_token');
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/login']);
    }
}
