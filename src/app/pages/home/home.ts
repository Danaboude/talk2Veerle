import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero';
import { AboutTalk2Component } from '../../components/about-talk2/about-talk2';
import { CtaBottomComponent } from '../../components/cta-bottom/cta-bottom';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    AboutTalk2Component,
    CtaBottomComponent,
    FooterComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {}
