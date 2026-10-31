import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Offering } from '../../../services/offerings.service';

@Component({
    selector: 'app-offerings-tab',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './offerings-tab.component.html',
    styleUrl: './offerings-tab.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferingsTabComponent {
    @Input() offerings: Offering[] = [];
    @Input() offeringsLoading = false;

    @Output() offeringSave = new EventEmitter<Offering>();
    @Output() offeringDelete = new EventEmitter<Offering>();
    @Output() offeringAdd = new EventEmitter<void>();

    bookingMode(o: Offering): 'email' | 'cal' | 'link' {
        const link = (o.contactLink ?? '').trim();
        if (!/^https:\/\//i.test(link)) return 'email';
        return /^https:\/\/(www\.|app\.)?cal\.com\//i.test(link) ? 'cal' : 'link';
    }

    setBookingMode(o: Offering, mode: 'email' | 'cal' | 'link'): void {
        // E-mail = lege link (de website maakt zelf de mailto met onderwerp).
        o.contactLink = mode === 'email' ? '' : mode === 'cal' ? 'https://cal.com/talk2' : 'https://';
    }

    readonly audiences: { value: Offering['audience']; label: string }[] = [
        { value: 'individuen', label: 'Individuen' },
        { value: 'duos', label: "Duo's en koppels" },
        { value: 'organisaties', label: 'Organisaties & Groepen' },
        { value: 'professionals', label: 'Professionals' },
    ];
}
