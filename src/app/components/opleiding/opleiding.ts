import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-opleiding',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './opleiding.html',
  styleUrl: './opleiding.css',
})
export class OpleidingComponent {}
