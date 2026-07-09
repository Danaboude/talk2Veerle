import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { VoorWieHomeComponent } from '../../components/voor-wie-home/voor-wie-home';
import { CtaBottomComponent } from '../../components/cta-bottom/cta-bottom';
import { FooterComponent } from '../../components/footer/footer';
import { BOOKING_LINKS } from '../../config/booking-links';
import { OfferingsService, Offering } from '../../services/offerings.service';

@Component({
  selector: 'app-aanbod',
  standalone: true,
  imports: [
    CommonModule,
    ScrollAnimateDirective,
    VoorWieHomeComponent,
    CtaBottomComponent,
    FooterComponent,
  ],
  templateUrl: './aanbod.html',
  styleUrl: './aanbod.css',
})
export class AanbodComponent implements OnInit {
  private offeringsService = inject(OfferingsService);
  readonly bookingUrl = BOOKING_LINKS.general;

  individueleOfferings = signal<Offering[]>([]);
  organisatieOfferings = signal<Offering[]>([]);
  professionalOfferings = signal<Offering[]>([]);
  // Duo's is intentionally static  no dynamic offerings are fetched for it.

  ngOnInit(): void {
    this.offeringsService.getPublishedForAudience('individuen').subscribe({
      next: (data) => this.individueleOfferings.set(data),
      error: () => {},
    });
    this.offeringsService.getPublishedForAudience('organisaties').subscribe({
      next: (data) => this.organisatieOfferings.set(data),
      error: () => {},
    });
    this.offeringsService.getPublishedForAudience('professionals').subscribe({
      next: (data) => this.professionalOfferings.set(data),
      error: () => {},
    });
  }

  scrollToBooking(ctaId: string): void {
    const el = document.getElementById(ctaId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el as HTMLElement | null)?.focus({ preventScroll: true });
  }
}
