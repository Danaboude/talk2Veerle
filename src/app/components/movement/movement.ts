import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { VideoScrollDirective } from '../../directives/video-scroll.directive';

@Component({
  selector: 'app-movement',
  standalone: true,
  imports: [ScrollAnimateDirective, VideoScrollDirective],
  templateUrl: './movement.html',
  styleUrl: './movement.css',
})
export class MovementComponent {}
