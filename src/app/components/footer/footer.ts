import { Component } from '@angular/core';
import { BOOKING_LINKS } from '../../config/booking-links';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent {
  readonly bookingUrl = BOOKING_LINKS.general;
  year = new Date().getFullYear();

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
