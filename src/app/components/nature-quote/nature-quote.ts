import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-nature-quote',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './nature-quote.html',
  styleUrl: './nature-quote.css',
})
export class NatureQuoteComponent {}
