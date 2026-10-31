import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { CONTACT_EMAIL } from '../../config/booking-links';
import { PageButtonsService, PageButtons, DEFAULT_PAGE_BUTTONS } from '../../services/page-buttons.service';

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
export class ContactComponent implements OnInit {
  private pageButtonsService = inject(PageButtonsService);

  // The two booking buttons; editable by Veerle in the dashboard (tab "Knoppen").
  buttons = signal<PageButtons>(DEFAULT_PAGE_BUTTONS);

  ngOnInit(): void {
    this.pageButtonsService.get().subscribe(b => this.buttons.set(b));
  }

  form: ContactForm = { naam: '', email: '', telefoon: '', bericht: '' };
  submitted = false;
  errors: { naam?: string; email?: string; bericht?: string } = {};

  submitForm(): void {
    this.form.naam = this.form.naam.trim();
    this.form.email = this.form.email.trim();
    this.form.bericht = this.form.bericht.trim();
    this.errors = {};
    if (!this.form.naam) this.errors.naam = 'Vul uw naam in.';
    if (!this.form.email) this.errors.email = 'Vul uw e-mailadres in.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.form.email)) this.errors.email = 'Dit e-mailadres lijkt niet te kloppen (bv. naam@voorbeeld.be).';
    if (!this.form.bericht) this.errors.bericht = 'Schrijf een bericht.';
    if (this.errors.naam || this.errors.email || this.errors.bericht) return;

    // Open the visitor's own mail app (Gmail, Outlook, Mail...) with the message ready to send to Veerle.
    const body = `Naam: ${this.form.naam}
E-mail: ${this.form.email}
Telefoon: ${this.form.telefoon || '-'}

${this.form.bericht}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Bericht van ' + this.form.naam)}&body=${encodeURIComponent(body)}`;
    this.submitted = true;
  }
}
