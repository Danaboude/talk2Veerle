import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-survey-hero',
    standalone: true,
    imports: [],
    templateUrl: './survey-hero.component.html',
    styleUrl: './survey-hero.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyHeroComponent {
    @Input() heroHeadline: string = '';
    @Input() heroSubtext: string = '';
    @Input() ctaText: string = '';
    @Input() heroImage: string | undefined = undefined;

    @Output() ctaClick = new EventEmitter<void>();
}
