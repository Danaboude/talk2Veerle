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
    { id: 'over-talk2', label: 'Over Talk2' },
    { id: 'methode', label: 'Methode' },
    { id: 'voor-wie', label: 'Aanbod' },
    { id: 'over-mij', label: 'Over mij' },
    { id: 'contact', label: 'Contact' },
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
