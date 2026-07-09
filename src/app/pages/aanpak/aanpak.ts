import { Component } from '@angular/core';
import { MovementComponent } from '../../components/movement/movement';
import { BosZeeWeiComponent } from '../../components/bos-zee-wei/bos-zee-wei';
import { CommonGroundComponent } from '../../components/common-ground/common-ground';
import { CtaBottomComponent } from '../../components/cta-bottom/cta-bottom';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-aanpak',
  standalone: true,
  imports: [
    MovementComponent,
    BosZeeWeiComponent,
    CommonGroundComponent,
    CtaBottomComponent,
    FooterComponent,
  ],
  templateUrl: './aanpak.html',
})
export class AanpakComponent {}
