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
        if (this.isAuthenticatedSubject.value && !this.hasToken()) this.isAuthenticatedSubject.next(false);
        return this.isAuthenticatedSubject.value;
    }

    // A token only counts if it exists AND has not expired (the old check ignored expiry,
    // so an expired session looked logged-in and every API call silently failed with 401).
    private hasToken(): boolean {
        const token = localStorage.getItem('talk2_admin_token');
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
            return !!payload.exp && Date.now() < payload.exp;
        } catch {
            return false;
        }
    }

    // Swap the current token for a fresh one so active users stay logged in.
    renew(): void {
        if (!this.hasToken()) return;
        this.http.get<{ token: string }>('/api/auth').subscribe({
            next: res => localStorage.setItem('talk2_admin_token', res.token),
            error: () => {},
        });
    }

    // Called when the server rejects our token: clear it and send the user to the login page.
    sessionExpired() {
        localStorage.removeItem('talk2_admin_token');
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/login']);
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
