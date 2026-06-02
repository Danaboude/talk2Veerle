import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-degeluksbeweging',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './degeluksbeweging.html',
  styleUrl: './degeluksbeweging.css',
})
export class DegeluksbewegingComponent {}
