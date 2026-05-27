import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

interface Service {
  number: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './services.html',
  styleUrl: './services.css',
})
export class ServicesComponent {
  services: Service[] = [
    {
      number: '01',
      title: 'Therapie',
      description:
        'In een veilige en rustige omgeving werken we samen aan inzicht in uw patronen en emoties. Via gesprek, stilte en lichaamsbewustzijn vindt u uw weg naar heelheid en verbinding.',
    },
    {
      number: '02',
      title: 'Coaching in de Natuur',
      description:
        'De natuur als spiegel en gids. Al wandelend of zittend in het groen ontdekt u nieuwe perspectieven op uw situatie. Natuur helpt u terug te keren naar innerlijke rust en kracht.',
    },
    {
      number: '03',
      title: 'Training',
      description:
        'Communicatietrainingen op maat voor individuen en teams. Leer anders begeleiden, anders communiceren en verbinding maken vanuit echte aanwezigheid en oprechte aandacht.',
    },
  ];
}
