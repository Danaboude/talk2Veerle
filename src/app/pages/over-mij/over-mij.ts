import { Component } from '@angular/core';
import { AboutShortComponent } from '../../components/about-short/about-short';
import { OpleidingComponent } from '../../components/opleiding/opleiding';
import { DegeluksbewegingComponent } from '../../components/degeluksbeweging/degeluksbeweging';
import { CtaBottomComponent } from '../../components/cta-bottom/cta-bottom';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-over-mij',
  standalone: true,
  imports: [
    AboutShortComponent,
    OpleidingComponent,
    DegeluksbewegingComponent,
    CtaBottomComponent,
    FooterComponent,
  ],
  templateUrl: './over-mij.html',
})
export class OverMijComponent {}
