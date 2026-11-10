import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header';
import { SeoService } from './seo/seo.service';
import { VisitorTrackerService } from './services/visitor-tracker.service';

/** Routes where the public website header should NOT appear */
const HEADER_HIDDEN_PREFIXES = ['/login', '/survey', '/dashboard', '/create'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private router = inject(Router);
  private seo = inject(SeoService);
  private tracker = inject(VisitorTrackerService);
  showHeader = signal(true);

  ngOnInit(): void {
    this.tracker.start();

    // Set initial state (handles hard refresh on a non-home route)
    this.updateHeader(this.router.url);

    // Update on every navigation
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.updateHeader(e.urlAfterRedirects);
        this.seo.apply(this.deepest(this.router.routerState.snapshot.root).data['seo'], e.urlAfterRedirects);
      });
  }

  private deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    while (route.firstChild) route = route.firstChild;
    return route;
  }

  private updateHeader(url: string): void {
    const hide = HEADER_HIDDEN_PREFIXES.some(prefix => url.startsWith(prefix));
    this.showHeader.set(!hide);
  }
}
