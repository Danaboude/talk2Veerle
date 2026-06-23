import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Survey } from '../../../models/survey.model';

@Component({
    selector: 'app-survey-wizard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './survey-wizard.component.html',
    styleUrl: './survey-wizard.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyWizardComponent {
    @Input() survey: Survey | null = null;
    @Input() currentStep: number = 0;
    @Input() submitting: boolean = false;
    @Input() name: string = '';
    @Input() email: string = '';
    @Input() phone: string = '';
    @Input() phoneError: string | null = null;
    @Input() canProceedToQuestions: boolean = false;
    @Input() answers: { [questionId: string]: string } = {};
    @Input() otherAnswers: { [questionId: string]: string } = {};

    @Output() nameChange = new EventEmitter<string>();
    @Output() emailChange = new EventEmitter<string>();
    @Output() phoneChange = new EventEmitter<string>();
    @Output() submitLeadClick = new EventEmitter<void>();
    @Output() nextStepClick = new EventEmitter<void>();
    @Output() prevStepClick = new EventEmitter<void>();
    @Output() answerAndNextSelect = new EventEmitter<{ questionId: string; answerId: string; isLast: boolean }>();
    @Output() otherAnswerSubmit = new EventEmitter<string>();
    @Output() otherAnswerUpdate = new EventEmitter<{ questionId: string; text: string }>();
    @Output() meetingPreferenceSelect = new EventEmitter<'yes' | 'no'>();

    isSelected(questionId: string, answerId: string): boolean {
        return this.answers[questionId] === answerId;
    }

    get totalSteps(): number {
        return (this.survey?.questions?.length || 0) + 2;
    }

    get displayStep(): number {
        if (this.currentStep === 0) return 1;
        if (this.currentStep > this.totalSteps) return this.totalSteps;
        return this.currentStep;
    }

    get progressPercent(): number {
        if (this.totalSteps === 0) return 0;
        return (this.currentStep / this.totalSteps) * 100;
    }
}
