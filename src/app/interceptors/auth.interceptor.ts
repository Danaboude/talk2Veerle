import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    if (!req.url.startsWith('/api/')) return next(req);

    const token = localStorage.getItem('talk2_admin_token');
    if (!token) return next(req);

    const authService = inject(AuthService);
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
        catchError((err: unknown) => {
            // Expired/invalid session on an admin call: back to the login page instead of an empty dashboard.
            if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.startsWith('/api/auth')) {
                authService.sessionExpired();
            }
            return throwError(() => err);
        }),
    );
};
