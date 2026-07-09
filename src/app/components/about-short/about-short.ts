import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-about-short',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './about-short.html',
  styleUrl: './about-short.css',
})
export class AboutShortComponent {
  usePlaceholderPhoto(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null; // avoid a loop if the fallback is also missing
    img.src = 'veelr_draw_paint.jpg';
  }
}
