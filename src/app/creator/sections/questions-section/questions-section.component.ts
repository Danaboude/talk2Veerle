import { Component, Input, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Question, QuestionAnswer } from '../../../models/survey.model';

function newQuestion(): Question {
    return {
        id: crypto.randomUUID(),
        text: '',
        type: 'single',
        answers: [newAnswer(), newAnswer()],
        emailEnabled: false,
        emailType: 'NONE'
    };
}

function newAnswer(): QuestionAnswer {
    return { id: crypto.randomUUID(), text: '', emailType: 'NONE' };
}

@Component({
    selector: 'app-questions-section',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './questions-section.component.html',
    styleUrls: ['../../creator-shared.css', './questions-section.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsSectionComponent {
    @Input() questions: Question[] = [];
    @Output() questionsChange = new EventEmitter<Question[]>();

    expandedQuestion = signal<string | null>(null);

    toggleExpand(qId: string): void {
        this.expandedQuestion.update(id => id === qId ? null : qId);
    }

    addQuestion(): void {
        this.questionsChange.emit([...this.questions, newQuestion()]);
    }

    removeQuestion(id: string): void {
        this.questionsChange.emit(this.questions.filter(q => q.id !== id));
    }

    updateQuestion(id: string, field: keyof Question, value: any): void {
        this.questionsChange.emit(
            this.questions.map(q => q.id === id ? { ...q, [field]: value } : q)
        );
    }

    addAnswer(questionId: string): void {
        this.questionsChange.emit(
            this.questions.map(q =>
                q.id === questionId ? { ...q, answers: [...q.answers, newAnswer()] } : q
            )
        );
    }

    removeAnswer(questionId: string, answerId: string): void {
        this.questionsChange.emit(
            this.questions.map(q =>
                q.id === questionId
                    ? { ...q, answers: q.answers.filter(a => a.id !== answerId) }
                    : q
            )
        );
    }

    updateAnswer(questionId: string, answerId: string, field: keyof QuestionAnswer, value: any): void {
        this.questionsChange.emit(
            this.questions.map(q =>
                q.id === questionId
                    ? { ...q, answers: q.answers.map(a => a.id === answerId ? { ...a, [field]: value } : a) }
                    : q
            )
        );
    }
}
