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
        return new Observable(observer => {
            if (email === 'veerlefollens@hotmail.com' && password === 'veerle2001') {
                const token = 'talk2-hardcoded-token';
                localStorage.setItem('talk2_admin_token', token);
                this.isAuthenticatedSubject.next(true);
                observer.next({ success: true, token });
                observer.complete();
            } else {
                observer.error({ error: { error: 'Ongeldige inloggegevens.' } });
            }
        });
    }

    logout() {
        localStorage.removeItem('talk2_admin_token');
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/login']);
    }
}
