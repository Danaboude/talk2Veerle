import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly bookingUrl = 'https://cal.com/abdulkareem-dandal-rdextz/';

  /** Show the floating pill once the hero is out of view (~100vh) */
  showFloatingPill = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.showFloatingPill.set(window.scrollY > window.innerHeight * 0.75);
  }
}
