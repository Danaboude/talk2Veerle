import { Directive, ElementRef, Input, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollAnimate]',
  standalone: true,
})
export class ScrollAnimateDirective implements OnInit, OnDestroy {
  @Input() animateFrom: 'bottom' | 'left' | 'right' | 'scale' = 'bottom';
  @Input() animateDelay = 0;

  private observer?: IntersectionObserver;

  constructor(
    private el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Impeccable: skip all animation for users who prefer reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = this.el.nativeElement;
    el.style.opacity = '0';
    el.style.transitionDelay = `${this.animateDelay}ms`;
    el.style.transitionProperty = 'opacity, transform';
    el.style.transitionDuration = '900ms';
    el.style.transitionTimingFunction = 'cubic-bezier(0.16, 1, 0.3, 1)';

    const transforms: Record<string, string> = {
      bottom: 'translateY(60px)',
      left: 'translateX(-64px)',
      right: 'translateX(64px)',
      scale: 'scale(0.88)',
    };
    el.style.transform = transforms[this.animateFrom];

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = '1';
            el.style.transform = this.animateFrom === 'scale' ? 'scale(1)' : 'translate(0,0)';
            this.observer?.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' },
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
