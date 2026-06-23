import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { VideoManagerService } from '../services/video-manager.service';

/**
 * Attach to any <video> element.
 * - Plays via VideoManagerService when the video is >= threshold visible.
 * - Pauses when fully out of the viewport.
 * - Plays with sound when the browser allows it (after user interaction).
 * - Falls back to muted if the browser blocks autoplay with audio.
 * - Respects prefers-reduced-motion (does not autoplay).
 * - Only one video plays at a time (enforced by VideoManagerService).
 */
@Directive({
  selector: '[appVideoScroll]',
  standalone: true,
})
export class VideoScrollDirective implements OnInit, OnDestroy {
  /** Intersection ratio required to start playback (0–1). Default 0.3. */
  @Input() vsThreshold = 0.3;

  private el = inject(ElementRef);
  private videoManager = inject(VideoManagerService);
  private observer!: IntersectionObserver;

  ngOnInit(): void {
    const video = this.el.nativeElement as HTMLVideoElement;
    // Do NOT force muted  let sound play if browser allows it.
    // VideoManagerService handles the muted fallback when autoplay is blocked.
    video.playsInline = true;

    // Respect user's motion preference  do not autoplay
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= this.vsThreshold) {
          this.videoManager.play(video);
        } else if (!entry.isIntersecting) {
          // Fully left the viewport  pause
          this.videoManager.pause(video);
        }
        // Partially visible but below threshold: leave current state unchanged
      },
      { threshold: [0, this.vsThreshold, 1.0] }
    );

    this.observer.observe(video);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
