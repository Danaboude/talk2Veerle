import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-aanbod-intro',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './aanbod-intro.html',
  styleUrl: './aanbod-intro.css',
})
export class AanbodIntroComponent {}
