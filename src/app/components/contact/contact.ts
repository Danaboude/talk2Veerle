import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { SurveyService } from '../../services/survey.service';
import { BOOKING_LINKS } from '../../config/booking-links';

interface ContactForm {
  naam: string;
  email: string;
  telefoon: string;
  bericht: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, ScrollAnimateDirective],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class ContactComponent {
  private surveyService = inject(SurveyService);

  readonly bookingLinks = BOOKING_LINKS;

  form: ContactForm = { naam: '', email: '', telefoon: '', bericht: '' };
  submitted = false;
  submitting = false;
  submitError = false;

  submitForm(): void {
    if (!this.form.naam || !this.form.email || !this.form.bericht) return;

    this.submitting = true;
    this.submitError = false;
    this.surveyService.submitContact(this.form).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
        this.form = { naam: '', email: '', telefoon: '', bericht: '' };
      },
      error: () => {
        this.submitting = false;
        this.submitError = true;
      },
    });
  }
}
