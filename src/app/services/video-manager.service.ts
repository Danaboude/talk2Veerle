import { Injectable } from '@angular/core';

/**
 * Ensures only one video plays at a time across the entire page.
 * - Attempts to play with sound (after user interaction browsers allow this).
 * - If the browser blocks audio autoplay, falls back to muted play automatically.
 * - Pauses the previous video before starting a new one.
 */
@Injectable({ providedIn: 'root' })
export class VideoManagerService {
  private current: HTMLVideoElement | null = null;

  play(video: HTMLVideoElement): void {
    // Pause whatever is currently playing
    if (this.current && this.current !== video) {
      this.current.pause();
    }
    this.current = video;

    // Attempt to play with sound
    video.muted = false;
    video.play().catch(() => {
      // Browser blocked audio autoplay (e.g. page just loaded, no interaction yet).
      // Fall back to muted so the video still plays visually.
      video.muted = true;
      video.play().catch(() => {
        // Video play entirely blocked — nothing we can do
      });
    });
  }

  pause(video: HTMLVideoElement): void {
    video.pause();
    if (this.current === video) {
      this.current = null;
    }
  }
}
