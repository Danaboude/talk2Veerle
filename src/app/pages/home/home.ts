import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero';
import { TaglineBannerComponent } from '../../components/tagline-banner/tagline-banner';
import { AboutComponent } from '../../components/about/about';
import { ServicesComponent } from '../../components/services/services';
import { TestimonialsComponent } from '../../components/testimonials/testimonials';
import { NatureQuoteComponent } from '../../components/nature-quote/nature-quote';
import { ContactComponent } from '../../components/contact/contact';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    TaglineBannerComponent,
    AboutComponent,
    ServicesComponent,
    TestimonialsComponent,
    NatureQuoteComponent,
    ContactComponent,
    FooterComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {}
