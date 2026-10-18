import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { VoorWieHomeComponent } from '../../components/voor-wie-home/voor-wie-home';
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
    FooterComponent,
  ],
  templateUrl: './aanbod.html',
  styleUrl: './aanbod.css',
})
export class AanbodComponent implements OnInit {
  private offeringsService = inject(OfferingsService);
  readonly bookingLinks = BOOKING_LINKS;

  individueleOfferings = signal<Offering[]>([]);
  duosOfferings = signal<Offering[]>([]);
  organisatieOfferings = signal<Offering[]>([]);
  professionalOfferings = signal<Offering[]>([]);

  ngOnInit(): void {
    this.offeringsService.getPublishedForAudience('individuen').subscribe({
      next: (data) => this.individueleOfferings.set(data),
      error: () => {},
    });
    this.offeringsService.getPublishedForAudience('duos').subscribe({
      next: (data) => this.duosOfferings.set(data),
      error: () => {},
    });
    this.offeringsService.getPublishedForAudience('organisaties').subscribe({
      // De kennismaking heeft hierboven al één duidelijke hoofdactie.
      next: (data) => this.organisatieOfferings.set(data.filter(o => o.contactLink !== BOOKING_LINKS.freeDiscoveryCall)),
      error: () => {},
    });
    this.offeringsService.getPublishedForAudience('professionals').subscribe({
      next: (data) => this.professionalOfferings.set(data),
      error: () => {},
    });
  }

}
