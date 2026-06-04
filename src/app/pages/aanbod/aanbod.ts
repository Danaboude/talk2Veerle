import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { CommonGroundComponent } from '../../components/common-ground/common-ground';
import { CtaBottomComponent } from '../../components/cta-bottom/cta-bottom';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-aanbod',
  standalone: true,
  imports: [
    ScrollAnimateDirective,
    CommonGroundComponent,
    CtaBottomComponent,
    FooterComponent,
  ],
  templateUrl: './aanbod.html',
  styleUrl: './aanbod.css',
})
export class AanbodComponent {
  readonly bookingUrl = 'https://cal.com/abdulkareem-dandal-rdextz/';
}
