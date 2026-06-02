import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-about-short',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './about-short.html',
  styleUrl: './about-short.css',
})
export class AboutShortComponent {}
