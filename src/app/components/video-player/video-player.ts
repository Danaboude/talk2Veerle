import {
  Component, Input, ViewChild, ElementRef,
  OnDestroy, inject,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { VideoManagerService } from '../../services/video-manager.service';

/**
 * Drop-in video player with:
 *  • Manual play only  no autoplay on scroll (low sensory load)
 *  • Circular buffering spinner during network stalls
 *  • Play / Pause toggle
 *  • −3 s / +3 s skip buttons
 *  • Thin progress bar
 *  • Controls auto-hide after 2.5 s while playing
 */
@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './video-player.html',
  styleUrl: './video-player.css',
})
export class VideoPlayerComponent implements OnDestroy {
  /** Video source  local path or full external URL */
  @Input() src!: string;
  @Input() loop = true;
  @Input() label = 'Video';
  /** Thumbnail shown before playback starts and whenever the video is paused/ended, so we never flash a black frame */
  @Input() poster?: string;

  @ViewChild('vid') videoRef!: ElementRef<HTMLVideoElement>;

  private videoManager = inject(VideoManagerService);

  isLoading = true;
  isPlaying = false;
  controlsVisible = false;
  progress = 0; // 0–100

  private hideTimer?: ReturnType<typeof setTimeout>;
  private rafId?: number;

  private get video(): HTMLVideoElement {
    return this.videoRef.nativeElement;
  }

  // ── Video events ──────────────────────────────────────────
  onLoadStart(): void { this.isLoading = true; }
  onCanPlay(): void   { this.isLoading = false; }
  onWaiting(): void   { this.isLoading = true; }

  onPlaying(): void {
    this.isLoading = false;
    this.isPlaying = true;
    this.tickProgress();
  }

  onPause(): void {
    this.isPlaying = false;
    cancelAnimationFrame(this.rafId!);
  }

  onEnded(): void {
    if (!this.loop) {
      this.isPlaying = false;
      this.progress = 0;
    }
  }

  // ── Controls ──────────────────────────────────────────────
  togglePlay(): void {
    if (this.isPlaying) {
      this.videoManager.pause(this.video);
    } else {
      this.videoManager.play(this.video);
    }
  }

  skip(seconds: number): void {
    const v = this.video;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + seconds));
  }

  showControls(): void {
    this.controlsVisible = true;
    clearTimeout(this.hideTimer);
    if (this.isPlaying) {
      this.hideTimer = setTimeout(() => { this.controlsVisible = false; }, 2500);
    }
  }

  blurControls(): void {
    if (this.isPlaying) {
      clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => { this.controlsVisible = false; }, 2500);
    }
  }

  // ── Progress via rAF ──────────────────────────────────────
  private tickProgress(): void {
    const v = this.video;
    if (v.duration) {
      this.progress = (v.currentTime / v.duration) * 100;
    }
    this.rafId = requestAnimationFrame(() => this.tickProgress());
  }

  ngOnDestroy(): void {
    clearTimeout(this.hideTimer);
    cancelAnimationFrame(this.rafId!);
  }
}
