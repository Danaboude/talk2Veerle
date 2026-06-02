import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-cta-bottom',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './cta-bottom.html',
  styleUrl: './cta-bottom.css',
})
export class CtaBottomComponent {
  readonly bookingUrl = 'https://cal.com/abdulkareem-dandal-rdextz/';
}
