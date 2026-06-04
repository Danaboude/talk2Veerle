import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { VideoPlayerComponent } from '../video-player/video-player';

@Component({
  selector: 'app-bos-zee-wei',
  standalone: true,
  imports: [ScrollAnimateDirective, VideoPlayerComponent],
  templateUrl: './bos-zee-wei.html',
  styleUrl: './bos-zee-wei.css',
})
export class BosZeeWeiComponent {
  readonly bosVideoUrl =
    'https://res.cloudinary.com/dcoclrn93/video/upload/v1780516819/BOS_20260410203642776_1_smir4a.mp4';
  readonly zeeVideoUrl =
    'https://res.cloudinary.com/dcoclrn93/video/upload/v1780532527/ZEE_20260410155539145_1_cixgnp.mp4';
  readonly weiVideoUrl =
    'https://res.cloudinary.com/dcoclrn93/video/upload/v1780516795/WEI_20260409125941198_1_ullytr.mp4';
}
