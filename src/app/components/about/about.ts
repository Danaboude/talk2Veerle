import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class AboutComponent {
  opleidingen = [
    'Universitaire opleiding Klinische Psychologie',
    'Opleiding Systemische Therapie (IOST)',
    'Certified NLP Practitioner & Master',
    'Mindfulness-Based Stress Reduction (MBSR)',
    'Opleiding Hartcoherentie-Facilitator',
    'Opleiding Ecotherapie & Naturally Healing',
    'Training Motiverende Gespreksvoering',
    'Opleiding Traumasensitief Werken',
  ];

  specialisaties = [
    'Systemische communicatie en samenspreken',
    'Stress, burn-out en herstel',
    'Verwerking van verlies en rouw',
    'Identiteits- en levensvraagstukken',
    'Communicatie binnen teams en organisaties',
    'Natuur als therapeutisch instrument',
  ];
}
