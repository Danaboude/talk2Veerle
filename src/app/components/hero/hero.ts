import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class HeroComponent {
  private router = inject(Router);

  goToAanbod(): void {
    this.router.navigateByUrl('/aanbod');
  }
}
