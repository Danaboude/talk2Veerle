import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header';

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
  showHeader = signal(true);

  ngOnInit(): void {
    // Set initial state (handles hard refresh on a non-home route)
    this.updateHeader(this.router.url);

    // Update on every navigation
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => this.updateHeader(e.urlAfterRedirects));
  }

  private updateHeader(url: string): void {
    const hide = HEADER_HIDDEN_PREFIXES.some(prefix => url.startsWith(prefix));
    this.showHeader.set(!hide);
  }
}
