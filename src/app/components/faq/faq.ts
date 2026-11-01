import { Component, OnInit, inject, signal } from '@angular/core';
import { FAQ_ITEMS, FaqItem } from '../../seo/faq-items';
import { SiteContentService } from '../../services/site-content.service';

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

  items: FaqItem[] = FAQ_ITEMS;

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
