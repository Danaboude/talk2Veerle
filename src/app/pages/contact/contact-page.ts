import { Component } from '@angular/core';
import { ContactComponent } from '../../components/contact/contact';
import { FaqComponent } from '../../components/faq/faq';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [ContactComponent, FaqComponent, FooterComponent],
  templateUrl: './contact-page.html',
})
export class ContactPageComponent {}
