import { Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  mobileMenuOpen = signal(false);
  scrolled = signal(false);

  readonly bookingUrl = 'https://cal.com/abdulkareem-dandal-rdextz/';

  navItems = [
    { id: 'aanbod', label: 'Aanbod' },
    { id: 'wie', label: 'Wie' },
    { id: 'contact', label: 'Contact' },
    { id: 'voor-wie', label: 'Voor Wie?' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 60);
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    this.mobileMenuOpen.set(false);
  }

  toggleMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }
}
