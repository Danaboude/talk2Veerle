import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-hero-section',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './hero-section.component.html',
    styleUrls: ['../../creator-shared.css', './hero-section.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSectionComponent {
    @Input() heroHeadline: string = '';
    @Input() heroSubtext: string = '';
    @Input() ctaText: string = '';

    @Output() heroHeadlineChange = new EventEmitter<string>();
    @Output() heroSubtextChange = new EventEmitter<string>();
    @Output() ctaTextChange = new EventEmitter<string>();
}
