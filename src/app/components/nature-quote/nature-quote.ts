import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { BOOKING_LINKS } from '../../config/booking-links';

@Component({
  selector: 'app-nature-quote',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './nature-quote.html',
  styleUrl: './nature-quote.css',
})
export class NatureQuoteComponent {
  readonly bookingUrl = BOOKING_LINKS.general;
}
