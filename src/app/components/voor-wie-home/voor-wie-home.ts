import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-voor-wie-home',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './voor-wie-home.html',
  styleUrl: './voor-wie-home.css',
})
export class VoorWieHomeComponent {
  scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
