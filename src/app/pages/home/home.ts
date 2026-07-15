import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero';
import { AboutTalk2Component } from '../../components/about-talk2/about-talk2';
import { CtaBottomComponent } from '../../components/cta-bottom/cta-bottom';
import { MovementComponent } from '../../components/movement/movement';
import { AanbodIntroComponent } from '../../components/aanbod-intro/aanbod-intro';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    AboutTalk2Component,
    CtaBottomComponent,
    MovementComponent,
    AanbodIntroComponent,
    FooterComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {}
