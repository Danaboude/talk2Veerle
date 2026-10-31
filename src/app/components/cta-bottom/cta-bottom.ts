import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { SurveyService } from '../../services/survey.service';
import { BOOKING_LINKS } from '../../config/booking-links';

@Component({
  selector: 'app-cta-bottom',
  standalone: true,
  imports: [ScrollAnimateDirective, FormsModule],
  templateUrl: './cta-bottom.html',
  styleUrl: './cta-bottom.css',
})
export class CtaBottomComponent {
  private surveyService = inject(SurveyService);
  readonly bookingUrl = BOOKING_LINKS.firstSession;

  newsletterEmail = '';
  alreadySubscribed = false;
  newsletterState: 'idle' | 'submitting' | 'done' | 'error' | 'invalid' = 'idle';

  subscribeNewsletter(): void {
    const email = this.newsletterEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      this.newsletterState = 'invalid';
      return;
    }
    this.newsletterState = 'submitting';
    this.surveyService.subscribeNewsletter(email).subscribe({
      next: (res: { alreadySubscribed?: boolean }) => {
        this.alreadySubscribed = !!res?.alreadySubscribed;
        this.newsletterState = 'done';
        this.newsletterEmail = '';
      },
      error: () => { this.newsletterState = 'error'; },
    });
  }
}
