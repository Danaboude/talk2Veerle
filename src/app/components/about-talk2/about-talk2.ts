import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { VideoPlayerComponent } from '../video-player/video-player';

@Component({
  selector: 'app-about-talk2',
  standalone: true,
  imports: [ScrollAnimateDirective, VideoPlayerComponent],
  templateUrl: './about-talk2.html',
  styleUrl: './about-talk2.css',
})
export class AboutTalk2Component {
  readonly videoUrl = 'about_talk.mp4';
}
