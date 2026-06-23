import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutomationStep } from '../../../models/survey.model';

function newStep(): AutomationStep {
    return {
        id: Math.random().toString(36).substring(2, 9),
        templateId: 'NONE',
        delayDays: 1
    };
}

@Component({
    selector: 'app-automation-section',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './automation-section.component.html',
    styleUrls: ['../../creator-shared.css', './automation-section.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomationSectionComponent {
    @Input() sequenceB: AutomationStep[] = [];
    @Input() sequenceC: AutomationStep[] = [];
    @Input() emailTypes: { id: string; label: string }[] = [];

    @Output() sequenceBChange = new EventEmitter<AutomationStep[]>();
    @Output() sequenceCChange = new EventEmitter<AutomationStep[]>();

    addStep(seq: 'B' | 'C'): void {
        if (seq === 'B') {
            this.sequenceBChange.emit([...this.sequenceB, newStep()]);
        } else {
            this.sequenceCChange.emit([...this.sequenceC, newStep()]);
        }
    }

    removeStep(seq: 'B' | 'C', index: number): void {
        if (seq === 'B') {
            this.sequenceBChange.emit(this.sequenceB.filter((_, i) => i !== index));
        } else {
            this.sequenceCChange.emit(this.sequenceC.filter((_, i) => i !== index));
        }
    }

    updateStep(seq: 'B' | 'C', index: number, field: keyof AutomationStep, value: any): void {
        const update = (steps: AutomationStep[]) => {
            const copy = [...steps];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        };
        if (seq === 'B') {
            this.sequenceBChange.emit(update(this.sequenceB));
        } else {
            this.sequenceCChange.emit(update(this.sequenceC));
        }
    }
}
