import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-voor-wie-home',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './voor-wie-home.html',
  styleUrl: './voor-wie-home.css',
})
export class VoorWieHomeComponent {
  private router = inject(Router);

  goToAanbod(): void {
    this.router.navigateByUrl('/aanbod');
  }
}
