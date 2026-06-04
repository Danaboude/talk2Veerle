import { Component, HostListener, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

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

  private router = inject(Router);
  readonly bookingUrl = 'https://cal.com/abdulkareem-dandal-rdextz/';

  navItems = [
    { id: 'over-talk2', label: 'Over Talk2', route: null },
    { id: 'methode',    label: 'Methode',    route: null },
    { id: 'aanbod',     label: 'Aanbod',     route: '/aanbod' },
    { id: 'over-mij',  label: 'Over mij',   route: null },
    { id: 'contact',   label: 'Contact',    route: null },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 60);
  }

  navigate(item: { id: string; route: string | null }): void {
    this.mobileMenuOpen.set(false);
    if (item.route) {
      this.router.navigateByUrl(item.route);
    } else {
      // If on the home page scroll to section; otherwise go home first
      if (this.router.url === '/') {
        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        this.router.navigateByUrl('/').then(() => {
          setTimeout(() => {
            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        });
      }
    }
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    this.mobileMenuOpen.set(false);
  }

  toggleMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }
}
