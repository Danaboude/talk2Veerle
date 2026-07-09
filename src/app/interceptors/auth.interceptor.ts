import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    if (!req.url.startsWith('/api/')) return next(req);

    const token = localStorage.getItem('talk2_admin_token');
    if (!token) return next(req);

    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
