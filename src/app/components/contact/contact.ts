import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

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
  readonly bookingUrl = 'https://cal.com/abdulkareem-dandal-rdextz/';
  form: ContactForm = { naam: '', email: '', telefoon: '', bericht: '' };
  submitted = false;

  submitForm(): void {
    if (this.form.naam && this.form.email && this.form.bericht) {
      this.submitted = true;
      this.form = { naam: '', email: '', telefoon: '', bericht: '' };
    }
  }
}
