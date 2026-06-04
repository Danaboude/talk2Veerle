import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-common-ground',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './common-ground.html',
  styleUrl: './common-ground.css',
})
export class CommonGroundComponent {}
