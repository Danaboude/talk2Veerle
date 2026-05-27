import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-tagline-banner',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './tagline-banner.html',
  styleUrl: './tagline-banner.css',
})
export class TaglineBannerComponent {}
