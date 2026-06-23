import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-bonus-section',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './bonus-section.component.html',
    styleUrls: ['../../creator-shared.css', './bonus-section.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BonusSectionComponent {
    @Input() bonusTitle: string = '';
    @Input() bonus1Label: string = '';
    @Input() bonus1Text: string = '';
    @Input() bonus2Label: string = '';
    @Input() bonus2Text: string = '';
    @Input() bonus3Label: string = '';
    @Input() bonus3Text: string = '';

    @Output() bonusTitleChange  = new EventEmitter<string>();
    @Output() bonus1LabelChange = new EventEmitter<string>();
    @Output() bonus1TextChange  = new EventEmitter<string>();
    @Output() bonus2LabelChange = new EventEmitter<string>();
    @Output() bonus2TextChange  = new EventEmitter<string>();
    @Output() bonus3LabelChange = new EventEmitter<string>();
    @Output() bonus3TextChange  = new EventEmitter<string>();
}
