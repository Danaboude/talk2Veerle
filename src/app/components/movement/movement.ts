import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { VideoPlayerComponent } from '../video-player/video-player';

@Component({
  selector: 'app-movement',
  standalone: true,
  imports: [ScrollAnimateDirective, VideoPlayerComponent],
  templateUrl: './movement.html',
  styleUrl: './movement.css',
})
export class MovementComponent {
  readonly videoUrl =
    'https://res.cloudinary.com/dcoclrn93/video/upload/v1780516883/Hoe_beweging_vorm_krijgt_20260409131551905_n1r2rz.mp4';
  readonly videoPoster = this.videoUrl.replace(/\.mp4$/, '.jpg');
}
