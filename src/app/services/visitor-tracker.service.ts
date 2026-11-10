import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './auth.service';

const ENDPOINT = '/api/visitors-api';
const SESSION_KEY = 'talk2_visit_session';

// Pages that are not part of the public website: never tracked.
const PRIVATE_PREFIXES = ['/login', '/dashboard', '/create'];

/**
 * Reports which public page a visitor has open and for how long, so the dashboard
 * (Bezoekers) can show it. Only runs in the browser, and never for a logged-in admin,
 * so Veerle's own visits do not end up in the statistics.
 *
 * Time is counted while the tab is visible, and sent when the page changes or the tab
 * is hidden/closed.
 */
@Injectable({ providedIn: 'root' })
export class VisitorTrackerService {
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);
    private readonly doc = inject(DOCUMENT);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    private started = false;
    private sessionId = '';
    private currentPath: string | null = null;
    private visibleSince: number | null = null; // when the current visible stretch began
    private visibleMs = 0;                       // visible time collected for the current page, not yet sent

    start(): void {
        if (!this.isBrowser || this.started) return;
        this.started = true;
        this.sessionId = this.loadSessionId();

        this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe(e => this.onNavigated(e.urlAfterRedirects));
        if (this.router.navigated) this.onNavigated(this.router.url); // first page finished loading before we started

        this.doc.addEventListener('visibilitychange', () => {
            if (this.doc.visibilityState === 'hidden') {
                this.pauseClock();
                this.sendTime();
            } else {
                this.resumeClock();
            }
        });
        // Safari does not reliably fire visibilitychange when a tab is closed.
        window.addEventListener('pagehide', () => {
            this.pauseClock();
            this.sendTime();
        });
    }

    private onNavigated(url: string): void {
        const path = url.split(/[?#]/)[0] || '/';
        if (path === this.currentPath) return;

        this.pauseClock();
        this.sendTime(); // close the page we are leaving
        this.currentPath = null;

        if (this.isPrivate(path) || this.auth.isAuthenticated) return;

        this.currentPath = path;
        this.visibleMs = 0;
        this.send({ path, view: true, seconds: 0 });
        if (this.doc.visibilityState === 'visible') this.resumeClock();
    }

    private isPrivate(path: string): boolean {
        return PRIVATE_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
    }

    private resumeClock(): void {
        if (this.currentPath && this.visibleSince === null) this.visibleSince = Date.now();
    }

    private pauseClock(): void {
        if (this.visibleSince === null) return;
        this.visibleMs += Date.now() - this.visibleSince;
        this.visibleSince = null;
    }

    private sendTime(): void {
        if (!this.currentPath) return;
        const seconds = Math.round(this.visibleMs / 1000);
        this.visibleMs = 0;
        if (seconds > 0) this.send({ path: this.currentPath, view: false, seconds });
    }

    private send(event: { path: string; view: boolean; seconds: number }): void {
        const payload = JSON.stringify({ sessionId: this.sessionId, ...event });
        try {
            // sendBeacon survives the page being closed; fetch+keepalive is the fallback.
            const queued = navigator.sendBeacon?.(ENDPOINT, new Blob([payload], { type: 'application/json' }));
            if (!queued) {
                void fetch(ENDPOINT, {
                    method: 'POST', keepalive: true, body: payload,
                    headers: { 'Content-Type': 'application/json' },
                }).catch(() => {});
            }
        } catch {
            // Statistics must never break the website.
        }
    }

    // One id per browser tab session: no cookies, and a new visit gets a new id.
    private loadSessionId(): string {
        try {
            const saved = sessionStorage.getItem(SESSION_KEY);
            if (saved) return saved;
            const fresh = crypto.randomUUID();
            sessionStorage.setItem(SESSION_KEY, fresh);
            return fresh;
        } catch {
            return crypto.randomUUID();
        }
    }
}
