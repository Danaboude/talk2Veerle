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
  readonly bookingUrl = BOOKING_LINKS.general;

  newsletterEmail = '';
  newsletterState: 'idle' | 'submitting' | 'done' | 'error' = 'idle';

  subscribeNewsletter(): void {
    if (!this.newsletterEmail) return;
    this.newsletterState = 'submitting';
    this.surveyService.subscribeNewsletter(this.newsletterEmail).subscribe({
      next: () => {
        this.newsletterState = 'done';
        this.newsletterEmail = '';
      },
      error: () => { this.newsletterState = 'error'; },
    });
  }
}
