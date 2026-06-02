import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero';
import { AboutTalk2Component } from '../../components/about-talk2/about-talk2';
import { MovementComponent } from '../../components/movement/movement';
import { BosZeeWeiComponent } from '../../components/bos-zee-wei/bos-zee-wei';
import { VoorWieHomeComponent } from '../../components/voor-wie-home/voor-wie-home';
import { AboutShortComponent } from '../../components/about-short/about-short';
import { OpleidingComponent } from '../../components/opleiding/opleiding';
import { DegeluksbewegingComponent } from '../../components/degeluksbeweging/degeluksbeweging';
import { CtaBottomComponent } from '../../components/cta-bottom/cta-bottom';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    AboutTalk2Component,
    MovementComponent,
    BosZeeWeiComponent,
    VoorWieHomeComponent,
    AboutShortComponent,
    OpleidingComponent,
    DegeluksbewegingComponent,
    CtaBottomComponent,
    FooterComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {}
