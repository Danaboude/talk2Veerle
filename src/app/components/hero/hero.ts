import { Component } from '@angular/core';
import { VideoScrollDirective } from '../../directives/video-scroll.directive';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [VideoScrollDirective],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class HeroComponent {
  readonly bookingUrl = 'https://cal.com/abdulkareem-dandal-rdextz/';

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
