import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BOOKING_LINKS } from '../../config/booking-links';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class HeroComponent {
  private router = inject(Router);
  readonly bookingUrl = BOOKING_LINKS.general;

  goToAanbod(): void {
    this.router.navigateByUrl('/aanbod');
  }
}
