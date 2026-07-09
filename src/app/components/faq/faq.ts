import { Component, OnInit, inject, signal } from '@angular/core';
import { SiteContentService } from '../../services/site-content.service';

interface FaqItem {
  question: string;
  answer: string;
}

const DEFAULT_PRICING_ANSWER = 'Individueel: €80/u, intake €90/u\nDuo / koppel: €90/u, intake €100/u\nVoor coaching professionals, team- of groepsbegeleiding, trainingen en bezinningsbegeleidingen werk ik op maat. Hiervoor worden tarieven in overleg bepaald.';

export const FAQ_PRICING_KEY = 'faq_pricing';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [],
  templateUrl: './faq.html',
  styleUrl: './faq.css',
})
export class FaqComponent implements OnInit {
  private siteContentService = inject(SiteContentService);

  openIndex = signal<number | null>(null);
  pricingAnswer = signal(DEFAULT_PRICING_ANSWER);

  items: FaqItem[] = [
    {
      question: 'Hoe ga je om met privacy?',
      answer: 'Alles wat je deelt, wordt met zorg en vertrouwelijkheid behandeld. Persoonsgegevens worden verwerkt in overeenstemming met de geldende privacywetgeving (GDPR).',
    },
    {
      question: 'Wat als ik moet annuleren?',
      answer: 'Graag 24 uur op voorhand. Bij laattijdige annulatie kan de sessie aangerekend worden.',
    },
    {
      question: 'Hoe kan ik betalen?',
      answer: 'Cash of Payconiq.',
    },
    {
      question: 'Is er terugbetaling mogelijk?',
      answer: 'Dat hangt af van je mutualiteit. We bekijken dit samen tijdens het eerste gesprek.',
    },
    {
      question: 'Hoeveel kost een sessie?',
      answer: '', // filled in from pricingAnswer() in the template
    },
    {
      question: 'Hoe lang duurt een sessie?',
      answer: 'Gesprekken gaan doorgaans door in blokken van minimaal anderhalf uur, zodat er voldoende ruimte is om te vertragen, te voelen en te verdiepen. Dit geldt zowel voor individuele begeleiding als voor gesprekken met koppels of ouder en kind.',
    },
    {
      question: 'Wat bedoel je met neurodivergent?',
      answer: 'Met neurodivergent verwijs ik naar mensen die prikkels, contact of informatie vaak anders ervaren of verwerken, zoals mensen met ASS, AD(H)D, hoogbegaafdheid en hooggevoeligheid. Niet als etiket, maar als een manier om beter te begrijpen wat iemand nodig heeft.',
    },
    {
      question: 'Waar gaan de sessies door?',
      answer: 'Voornamelijk in de regio Antwerpen, vaak in de natuur, in overleg op een plek die rust en veiligheid biedt. Bij regen of koude kan (een deel van) het traject online of in een binnenruimte doorgaan.',
    },
    {
      question: "Hoe gaat zo'n sessie in de natuur er concreet aan toe?",
      answer: 'We stemmen eerst samen af wat er op dat moment aan de orde is en wat je nodig hebt. Daarna werken we al wandelend of op een rustige plek in de natuur, met gesprek, lichaamsgerichte oefeningen, stilte of aandacht voor wat je lichaam aangeeft. Er is geen vast stappenplan: de sessie ontstaat telkens opnieuw, afgestemd op jouw tempo en situatie.',
    },
    {
      question: 'Is therapie in de natuur vergelijkbaar met klassieke praattherapie?',
      answer: 'Ja en nee: we werken niet alleen via woorden. Buiten zijn helpt vaak om te vertragen, te ademen en opnieuw contact te maken met jezelf. De natuur helpt om samen te onderzoeken wat er speelt: ze brengt ruimte, beweging en vaak ook meer helderheid, in een tempo dat bij jou past.',
    },
    {
      question: 'Wat als ik niet goed weet wat ik nodig heb?',
      answer: 'Dat is heel normaal. We vertrekken vanuit wat er nu voelbaar is: spanning, overprikkeling, vastlopen of vermoeidheid. Van daaruit ontstaat gaandeweg richting.',
    },
    {
      question: 'Hoe weet ik welke begeleiding bij mij past?',
      answer: 'Dat hangt af van je prikkelbalans, energie en of je wil werken rond persoonlijke patronen of relaties. Tijdens een eerste gesprek bekijken we samen wat op dit moment het meest helpend is.',
    },
  ];

  ngOnInit(): void {
    this.siteContentService.get(FAQ_PRICING_KEY).subscribe({
      next: (entry) => {
        if (entry?.value) this.pricingAnswer.set(entry.value);
      },
      error: () => {},
    });
  }

  toggle(index: number): void {
    this.openIndex.update((current) => (current === index ? null : index));
  }
}
