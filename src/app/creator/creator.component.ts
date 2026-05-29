import {
    Component, signal, computed, ChangeDetectionStrategy, inject, OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SurveyService } from '../services/survey.service';
import { Survey, Question, QuestionAnswer, EMAIL_TEMPLATE_TYPES, AutomationTrigger, AutomationStep, Testimonial } from '../models/survey.model';



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

function newTestimonial(author = '', quote = ''): Testimonial {
    return { id: crypto.randomUUID(), author, quote, stars: 5 };
}

@Component({
    selector: 'app-creator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './creator.component.html',
    styleUrl: './creator.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatorComponent implements OnInit {
    private surveyService = inject(SurveyService);
    private router = inject(Router);
    private activeRoute = inject(ActivatedRoute);
    private sanitizer = inject(DomSanitizer);

    emailTypes = signal<{id: string, label: string}[]>([{ id: 'NONE', label: 'Geen email versturen' }]);
    emailBodies = signal<Record<string, { subject: string; body: string }>>({});

    // Survey fields
    title = signal('Nieuwe Kwalificatie Campagne');
    company = signal<'Talk2'>('Talk2');
    heroHeadline = signal('Direct Inzicht in de Tijd besteding van Jouw Team');
    heroSubtext = signal('Ontdek hoe jouw bedrijf met 30-40% kan verbeteren door inzicht in tijd en processen.');
    ctaText = signal('Download Brochure');
    heroImagePreview = signal<string | null>(null);
    heroImageBase64 = signal<string | null>(null);
    brochureUrl = signal<string | null>(null);
    brochureBase64 = signal<string | null>(null);
    videoUrl = signal('https://www.youtube.com/watch?v=8QOXrIVfvXw');
    questions = signal<Question[]>([newQuestion()]);

    // Global email
    globalEmailEnabled = signal(false);
    globalEmailType = signal('NONE');

    // Bonus text signals
    bonusTitle = signal('Verbeter de samenwerking tussen afdelingen binnen je bedrijf');
    bonus1Label = signal('Bonus #1: Inzicht');
    bonus1Text = signal('Leer hoe je inzicht krijgt in je processen');
    bonus2Label = signal('Bonus #2: Tijdstudie');
    bonus2Text = signal('Klantcase over duur, cyclus en faseduur');
    bonus3Label = signal('Bonus #3: Gratis advies');
    bonus3Text = signal('15 minuten gesprek voor praktische informatie');
    bonusCTALabel = signal('Gratis Brochure');

    // Automation triggers
    openedNoSubmitEnabled = signal(true);
    openedNoSubmitEmail = signal('SURVEY_REMINDER');
    startedNoFinishEnabled = signal(true);
    startedNoFinishEmail = signal('SURVEY_REMINDER');
    finishedNoMeetingEnabled = signal(false);
    finishedNoMeetingEmail = signal('NONE');

    // Advanced Automation Sequences
    automationSequenceB = signal<AutomationStep[]>([]);
    automationSequenceC = signal<AutomationStep[]>([]);

    // Testimonials
    testimonials = signal<Testimonial[]>([
        newTestimonial('Reynaers Aluminium', 'Dankzij Talk2 ontwikkelden we een productonafhankelijke tijdstudie en een nieuwe interne software voor workflowmanagement. We definieerden de parameters van ramen en deuren ongeacht de afmetingen, waarna we de productiesnelheid optimaliseerden met 43%.'),
        newTestimonial('Benteler Automotive Belgium', 'Talk2 verzorgden tijdstudie, procesoptimalisaties en trainingen die resulteerden in een betere balansatie tussen onze productielijnen. Ze leerden ons kritisch kijken naar de eigen organisatie.')
    ]);

    // UI state
    saving = signal(false);
    savedId = signal<string | null>(null);
    activeEmailPreview = signal<string | null>(null); // which question id is showing email preview
    activeTab = signal<'editor' | 'preview'>('editor');
    expandedQuestion = signal<string | null>(null);

    // UI State
    snackbarMessage = signal<string | null>(null);
    private snackbarTimeout: any;

    showSnackbar(msg: string): void {
        this.snackbarMessage.set(msg);
        if (this.snackbarTimeout) clearTimeout(this.snackbarTimeout);
        this.snackbarTimeout = setTimeout(() => {
            this.snackbarMessage.set(null);
        }, 3000);
    }

    // Global email preview
    showGlobalEmailPreview = signal(false);

    ngOnInit(): void {
        this.surveyService.getEmailTemplates().subscribe({
            next: (templates) => {
                const types = [{ id: 'NONE', label: 'Geen email versturen' }];
                const bodies: Record<string, {subject: string, body: string}> = {};
                templates.forEach(t => {
                    types.push({ id: t.id, label: t.label });
                    bodies[t.id] = { subject: t.subject, body: t.body };
                });
                this.emailTypes.set(types);
                this.emailBodies.set(bodies);
            },
            error: (err) => console.error('Failed to load email templates', err)
        });

        const id = this.activeRoute.snapshot.paramMap.get('id');
        if (id) {
            this.savedId.set(id);
            this.surveyService.getSurveyById(id).subscribe({
                next: (s) => {
                    this.company.set(s.company || 'Talk2');
                    this.title.set(s.title || 'Campagne');
                    this.heroHeadline.set(s.heroHeadline || '');
                    this.heroSubtext.set(s.heroSubtext || '');
                    this.ctaText.set(s.ctaText || '');
                    this.videoUrl.set(s.videoUrl || '');

                    if (s.heroImage) {
                        this.heroImagePreview.set(s.heroImage);
                        this.heroImageBase64.set(s.heroImage);
                    }

                    if (s.brochureUrl) {
                        this.brochureUrl.set(s.brochureUrl);
                        this.brochureBase64.set(s.brochureUrl);
                    }

                    if (s.questions && s.questions.length > 0) {
                        this.questions.set(s.questions);
                    }

                    if (s.globalEmailConfig) {
                        this.globalEmailEnabled.set(s.globalEmailConfig.enabled || false);
                        this.globalEmailType.set(s.globalEmailConfig.type || 'NONE');
                        if (s.globalEmailConfig.type && s.globalEmailConfig.type !== 'NONE') {
                            this.showGlobalEmailPreview.set(true);
                        }
                    }

                    // Load bonus texts
                    if (s.bonusTitle) this.bonusTitle.set(s.bonusTitle);
                    if (s.bonus1Label) this.bonus1Label.set(s.bonus1Label);
                    if (s.bonus1Text) this.bonus1Text.set(s.bonus1Text);
                    if (s.bonus2Label) this.bonus2Label.set(s.bonus2Label);
                    if (s.bonus2Text) this.bonus2Text.set(s.bonus2Text);
                    if (s.bonus3Label) this.bonus3Label.set(s.bonus3Label);
                    if (s.bonus3Text) this.bonus3Text.set(s.bonus3Text);
                    if (s.bonusCTALabel) this.bonusCTALabel.set(s.bonusCTALabel);

                    // Load automation triggers
                    if (s.openedNoSubmitEmail) {
                        this.openedNoSubmitEnabled.set(s.openedNoSubmitEmail.enabled);
                        this.openedNoSubmitEmail.set(s.openedNoSubmitEmail.emailType);
                    }
                    if (s.startedNoFinishEmail) {
                        this.startedNoFinishEnabled.set(s.startedNoFinishEmail.enabled);
                        this.startedNoFinishEmail.set(s.startedNoFinishEmail.emailType);
                    }
                    if (s.finishedNoMeetingEmail) {
                        this.finishedNoMeetingEnabled.set(s.finishedNoMeetingEmail?.enabled || false);
                        this.finishedNoMeetingEmail.set(s.finishedNoMeetingEmail?.emailType || 'NONE');
                    }
                    this.automationSequenceB.set(s.automationSequenceB || []);
                    this.automationSequenceC.set(s.automationSequenceC || []);

                    // Load testimonials if they exist
                    if (s.testimonials && s.testimonials.length > 0) {
                        this.testimonials.set(s.testimonials);
                    }
                },
                error: (err) => console.error('Failed to load survey', err)
            });
        }
    }

    get sharableUrl(): string {
        return this.savedId() ? `${window.location.origin}/survey/${this.savedId()}` : '';
    }

    get globalEmailPreview() {
        const t = this.globalEmailType();
        const bodies = this.emailBodies();
        return t !== 'NONE' && bodies[t] ? bodies[t] : null;
    }

    get youtubeEmbedUrl(): SafeResourceUrl | null {
        const url = this.videoUrl();
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (!match) return null;
        return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${match[1]}`);
    }

    addAutomationStep(seq: 'B' | 'C'): void {
        const step: AutomationStep = {
            id: Math.random().toString(36).substring(2, 9),
            templateId: 'NONE',
            delayDays: 1
        };
        if (seq === 'B') {
            this.automationSequenceB.update(steps => [...steps, step]);
        } else {
            this.automationSequenceC.update(steps => [...steps, step]);
        }
    }

    removeAutomationStep(seq: 'B' | 'C', index: number): void {
        if (seq === 'B') {
            this.automationSequenceB.update(steps => steps.filter((_, i) => i !== index));
        } else {
            this.automationSequenceC.update(steps => steps.filter((_, i) => i !== index));
        }
    }

    updateAutomationStep(seq: 'B' | 'C', index: number, field: keyof AutomationStep, value: any): void {
        const updater = (steps: AutomationStep[]) => {
            const newSteps = [...steps];
            newSteps[index] = { ...newSteps[index], [field]: value };
            return newSteps;
        };
        if (seq === 'B') {
            this.automationSequenceB.update(updater);
        } else {
            this.automationSequenceC.update(updater);
        }
    }

    onImageUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            this.heroImagePreview.set(result);
            this.heroImageBase64.set(result);
        };
        reader.readAsDataURL(file);
    }

    onBrochureUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            this.brochureUrl.set(file.name);
            this.brochureBase64.set(result);
        };
        reader.readAsDataURL(file);
    }

    addQuestion(): void {
        this.questions.update(qs => [...qs, newQuestion()]);
    }

    removeQuestion(id: string): void {
        this.questions.update(qs => qs.filter(q => q.id !== id));
    }

    addAnswer(questionId: string): void {
        this.questions.update(qs =>
            qs.map(q => q.id === questionId ? { ...q, answers: [...q.answers, newAnswer()] } : q)
        );
    }

    removeAnswer(questionId: string, answerId: string): void {
        this.questions.update(qs =>
            qs.map(q => q.id === questionId
                ? { ...q, answers: q.answers.filter(a => a.id !== answerId) }
                : q)
        );
    }

    updateQuestion(id: string, field: keyof Question, value: any): void {
        this.questions.update(qs =>
            qs.map(q => q.id === id ? { ...q, [field]: value } : q)
        );
    }

    updateAnswer(questionId: string, answerId: string, field: keyof QuestionAnswer, value: any): void {
        this.questions.update(qs =>
            qs.map(q => q.id === questionId
                ? { ...q, answers: q.answers.map(a => a.id === answerId ? { ...a, [field]: value } : a) }
                : q)
        );
    }

    toggleQuestionExpand(qId: string): void {
        this.expandedQuestion.update(id => id === qId ? null : qId);
    }

    // Testimonial Management
    addTestimonial(): void {
        this.testimonials.update(ts => [...ts, newTestimonial()]);
    }

    removeTestimonial(id: string): void {
        if (this.testimonials().length <= 1) return; // Minimum 1
        this.testimonials.update(ts => ts.filter(t => t.id !== id));
    }

    updateTestimonial(id: string, field: keyof Testimonial, value: any): void {
        this.testimonials.update(ts => ts.map(t => t.id === id ? { ...t, [field]: value } : t));
    }

    toggleQuestionEmailPreview(qId: string): void {
        this.activeEmailPreview.update(id => id === qId ? null : qId);
    }

    getEmailLabel(type: string): string {
        return this.emailTypes().find(t => t.id === type)?.label ?? type;
    }

    getBrochureDisplayName(): string {
        const val = this.brochureUrl();
        if (!val) return '';
        // If it looks like a base64 data URI, show a friendly name
        if (val.startsWith('data:')) return 'PDF Brochure (geladen) ✓';
        // Otherwise it's a real filename (set during upload)
        const name = val.length > 40 ? val.substring(0, 37) + '...' : val;
        return name;
    }

    onGlobalEmailTypeChange(type: string): void {
        this.globalEmailType.set(type);
        if (type !== 'NONE') {
            this.showGlobalEmailPreview.set(true);
        } else {
            this.showGlobalEmailPreview.set(false);
        }
    }

    async save(): Promise<void> {
        this.saving.set(true);
        let finalTitle = this.title();
        if (finalTitle === 'Nieuwe Kwalificatie Campagne' && this.heroHeadline()) {
            finalTitle = this.heroHeadline();
        }

        const survey: Survey = {
            company: this.company(),
            title: finalTitle,
            heroImage: this.heroImageBase64() || undefined,
            heroHeadline: this.heroHeadline(),
            heroSubtext: this.heroSubtext(),
            ctaText: this.ctaText(),
            questions: this.questions(),
            globalEmailConfig: {
                enabled: this.globalEmailEnabled(),
                type: this.globalEmailType(),
                subject: this.emailBodies()[this.globalEmailType()]?.subject || '',
                body: this.emailBodies()[this.globalEmailType()]?.body || '',
            },
            videoUrl: this.videoUrl(),
            brochureUrl: this.brochureBase64() || undefined,
            // Bonus texts
            bonusTitle: this.bonusTitle(),
            bonus1Label: this.bonus1Label(),
            bonus1Text: this.bonus1Text(),
            bonus2Label: this.bonus2Label(),
            bonus2Text: this.bonus2Text(),
            bonus3Label: this.bonus3Label(),
            bonus3Text: this.bonus3Text(),
            bonusCTALabel: this.bonusCTALabel(),
            // Automation triggers
            openedNoSubmitEmail: {
                enabled: this.openedNoSubmitEnabled(),
                emailType: this.openedNoSubmitEmail(),
            },
            startedNoFinishEmail: {
                enabled: this.startedNoFinishEnabled(),
                emailType: this.startedNoFinishEmail(),
            },
            finishedNoMeetingEmail: {
                enabled: this.finishedNoMeetingEnabled(),
                emailType: this.finishedNoMeetingEmail()
            },
            automationSequenceB: this.automationSequenceB(),
            automationSequenceC: this.automationSequenceC(),
            testimonials: this.testimonials(),
        };

        if (this.savedId()) {
            survey._id = this.savedId()!;
            this.surveyService.updateSurvey(survey).subscribe({
                next: () => {
                    this.saving.set(false);
                    this.showSnackbar('Campagne succesvol bijgewerkt!');
                },
                error: () => {
                    this.saving.set(false);
                    this.showSnackbar('Fout bij opslaan.');
                }
            });
        } else {
            this.surveyService.createSurvey(survey).subscribe({
                next: (created) => {
                    this.savedId.set(created._id!);
                    this.saving.set(false);
                    this.showSnackbar('Nieuwe campagne aangemaakt!');
                    // Update URL without reloading
                    this.router.navigate(['/create', created._id], { replaceUrl: true });
                },
                error: () => {
                    this.saving.set(false);
                    this.showSnackbar('Fout bij maken campagne.');
                }
            });
        }
    }

    copyLink(): void {
        navigator.clipboard.writeText(this.sharableUrl);
    }

    goToDashboard(): void {
        this.router.navigate(['/dashboard']);
    }
}
