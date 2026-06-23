import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Survey, SurveyResponse } from '../../../models/survey.model';

@Component({
    selector: 'app-surveys-tab',
    standalone: true,
    imports: [CommonModule, RouterLink, UpperCasePipe],
    templateUrl: './surveys-tab.component.html',
    styleUrl: './surveys-tab.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveysTabComponent {
    @Input() surveys: Survey[] = [];
    @Input() loading: boolean = false;
    @Input() selectedSurvey: Survey | null = null;
    @Input() responses: SurveyResponse[] = [];
    @Input() responsesLoading: boolean = false;
    @Input() expandedResponse: string | null = null;
    @Input() sendingEmail: boolean = false;
    @Input() surveyStats: any = null;
    @Input() questionStats: any[] = [];
    @Input() lowestEngagementQuestion: any = null;

    @Output() surveySelected     = new EventEmitter<Survey>();
    @Output() surveyEdit         = new EventEmitter<Survey>();
    @Output() surveyDelete       = new EventEmitter<Survey>();
    @Output() responseExpand     = new EventEmitter<string>();
    @Output() responseDelete     = new EventEmitter<{ response: SurveyResponse; event: Event }>();
    @Output() reminderSend       = new EventEmitter<SurveyResponse>();
    @Output() emailModalOpen     = new EventEmitter<SurveyResponse>();
    @Output() linkCopy           = new EventEmitter<string>();

    formatDate(iso: string): string {
        if (!iso) return '';
        return new Date(iso).toLocaleString('nl-BE', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    getEmailTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            BROCHURE:         'Brochure Download',
            IMPROVEMENT:      '30-40% Verbetering',
            UNDERSTANDING:    'Begrijpen voor Verbeteren',
            TIME_INSIGHT:     'Inzicht in Tijdsbesteding',
            MEASURE:          'Niet Meten is Niet Weten',
            SURVEY_REMINDER:  'Herinnering Vragenlijst',
            BROCHURE_REMINDER:'Herinnering Brochure',
        };
        return labels[type] || type;
    }

    getAnswerText(survey: Survey, questionId: string, answerId: string): string {
        if (answerId?.startsWith('OTHER:')) return answerId.replace('OTHER:', '');
        const q = survey.questions.find(q => q.id === questionId);
        if (!q) return answerId;
        const a = q.answers.find(a => a.id === answerId || a.text === answerId);
        return a?.text || answerId;
    }
}
