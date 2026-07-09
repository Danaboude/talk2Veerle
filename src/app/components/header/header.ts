import { Component, HostListener, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BOOKING_LINKS } from '../../config/booking-links';

interface NavChild {
  label: string;
  fragment: string;
  description: string;
}

interface NavItem {
  id: string;
  label: string;
  route: string;
  dropdown: NavChild[] | null;
}

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
  openDropdown = signal<string | null>(null);
  mobileOpenDropdown = signal<string | null>(null);

  private router = inject(Router);
  readonly bookingUrl = BOOKING_LINKS.general;

  navItems: NavItem[] = [
    { id: 'over-talk2', label: 'Over Talk2', route: '/', dropdown: null },
    {
      id: 'aanpak',
      label: 'Aanpak',
      route: '/aanpak',
      dropdown: [
        { label: 'Bos', fragment: 'bos', description: 'Grond onder de voeten' },
        { label: 'Zee', fragment: 'zee', description: 'Ruimte voor emotie en beweging' },
        { label: 'Wei', fragment: 'wei', description: 'Openheid en verbinding' },
      ],
    },
    {
      id: 'aanbod',
      label: 'Aanbod',
      route: '/aanbod',
      dropdown: [
        { label: 'Individuen', fragment: 'individuen', description: 'Voor je eigen proces' },
        { label: "Duo's & Koppels", fragment: 'duos', description: 'Samen in verbinding' },
        { label: 'Professionals', fragment: 'professionals', description: 'Begeleiding voor begeleiders' },
        { label: 'Organisaties & Groepen', fragment: 'organisaties', description: 'Team- en groepswerk' },
      ],
    },
    { id: 'over-mij', label: 'Over mij', route: '/over-mij', dropdown: null },
    { id: 'contact', label: 'Contact', route: '/contact', dropdown: null },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 60);
  }

  goHome(): void {
    this.mobileMenuOpen.set(false);
    this.router.navigateByUrl('/');
  }

  navigate(item: NavItem, child?: NavChild): void {
    this.mobileMenuOpen.set(false);
    this.openDropdown.set(null);
    this.mobileOpenDropdown.set(null);
    if (child) {
      this.router.navigate([item.route], { fragment: child.fragment });
    } else {
      this.router.navigateByUrl(item.route);
    }
  }

  toggleMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  toggleMobileDropdown(id: string): void {
    this.mobileOpenDropdown.update((current) => (current === id ? null : id));
  }
}
