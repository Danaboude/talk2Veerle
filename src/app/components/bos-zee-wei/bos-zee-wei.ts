import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { VideoScrollDirective } from '../../directives/video-scroll.directive';

@Component({
  selector: 'app-bos-zee-wei',
  standalone: true,
  imports: [ScrollAnimateDirective, VideoScrollDirective],
  templateUrl: './bos-zee-wei.html',
  styleUrl: './bos-zee-wei.css',
})
export class BosZeeWeiComponent {}
