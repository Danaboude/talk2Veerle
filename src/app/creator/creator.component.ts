import {
    Component, signal, ChangeDetectionStrategy, inject, OnInit
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { SurveyService } from '../services/survey.service';
import { Survey, AutomationStep, Testimonial, Question, QuestionAnswer } from '../models/survey.model';

function newAnswer(): QuestionAnswer {
    return { id: crypto.randomUUID(), text: '', emailType: 'NONE' };
}

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

import { CampagneSectionComponent }    from './sections/campagne-section/campagne-section.component';
import { HeroSectionComponent }         from './sections/hero-section/hero-section.component';
import { BonusSectionComponent }        from './sections/bonus-section/bonus-section.component';
import { AutomationSectionComponent }   from './sections/automation-section/automation-section.component';
import { QuestionsSectionComponent }    from './sections/questions-section/questions-section.component';
import { TestimonialsSectionComponent } from './sections/testimonials-section/testimonials-section.component';
import { VideoSectionComponent }        from './sections/video-section/video-section.component';
import { CreatorPreviewComponent }      from './preview/creator-preview.component';

function newTestimonial(author = '', quote = ''): Testimonial {
    return { id: crypto.randomUUID(), author, quote, stars: 5 };
}

@Component({
    selector: 'app-creator',
    standalone: true,
    imports: [
        CampagneSectionComponent,
        HeroSectionComponent,
        BonusSectionComponent,
        AutomationSectionComponent,
        QuestionsSectionComponent,
        TestimonialsSectionComponent,
        VideoSectionComponent,
        CreatorPreviewComponent,
    ],
    templateUrl: './creator.component.html',
    styleUrl: './creator.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatorComponent implements OnInit {
    private surveyService = inject(SurveyService);
    private router        = inject(Router);
    private activeRoute   = inject(ActivatedRoute);
    private sanitizer     = inject(DomSanitizer);

    // ── Email types ──────────────────────────────
    emailTypes = signal<{ id: string; label: string }[]>([
        { id: 'NONE', label: 'Geen email versturen' }
    ]);
    emailBodies = signal<Record<string, { subject: string; body: string }>>({});

    // ── Survey fields ────────────────────────────
    title           = signal('Nieuwe Kwalificatie Campagne');
    company         = signal<'Talk2'>('Talk2');
    heroHeadline    = signal('Direct Inzicht in de Tijd besteding van Jouw Team');
    heroSubtext     = signal('Ontdek hoe jouw bedrijf met 30-40% kan verbeteren door inzicht in tijd en processen.');
    ctaText         = signal('Download Brochure');
    heroImagePreview = signal<string | null>(null);
    heroImageBase64  = signal<string | null>(null);
    brochureUrl     = signal<string | null>(null);
    brochureBase64  = signal<string | null>(null);
    videoUrl        = signal('https://www.youtube.com/watch?v=8QOXrIVfvXw');
    questions       = signal<Question[]>([newQuestion()]);

    // ── Bonus texts ──────────────────────────────
    bonusTitle    = signal('Verbeter de samenwerking tussen afdelingen binnen je bedrijf');
    bonus1Label   = signal('Bonus #1: Inzicht');
    bonus1Text    = signal('Leer hoe je inzicht krijgt in je processen');
    bonus2Label   = signal('Bonus #2: Tijdstudie');
    bonus2Text    = signal('Klantcase over duur, cyclus en faseduur');
    bonus3Label   = signal('Bonus #3: Gratis advies');
    bonus3Text    = signal('15 minuten gesprek voor praktische informatie');
    bonusCTALabel = signal('Gratis Brochure');

    // ── Automation ───────────────────────────────
    automationSequenceB = signal<AutomationStep[]>([]);
    automationSequenceC = signal<AutomationStep[]>([]);

    // ── Testimonials ─────────────────────────────
    testimonials = signal<Testimonial[]>([
        newTestimonial(
            'Reynaers Aluminium',
            'Dankzij Talk2 ontwikkelden we een productonafhankelijke tijdstudie en een nieuwe interne software voor workflowmanagement. We definieerden de parameters van ramen en deuren ongeacht de afmetingen, waarna we de productiesnelheid optimaliseerden met 43%.'
        ),
        newTestimonial(
            'Benteler Automotive Belgium',
            'Talk2 verzorgden tijdstudie, procesoptimalisaties en trainingen die resulteerden in een betere balansatie tussen onze productielijnen. Ze leerden ons kritisch kijken naar de eigen organisatie.'
        ),
    ]);

    // ── UI state ─────────────────────────────────
    saving           = signal(false);
    savedId          = signal<string | null>(null);
    snackbarMessage  = signal<string | null>(null);
    private snackbarTimeout: any;

    showSnackbar(msg: string): void {
        this.snackbarMessage.set(msg);
        if (this.snackbarTimeout) clearTimeout(this.snackbarTimeout);
        this.snackbarTimeout = setTimeout(() => this.snackbarMessage.set(null), 3000);
    }

    ngOnInit(): void {
        // Load email templates
        this.surveyService.getEmailTemplates().subscribe({
            next: (templates) => {
                const types = [{ id: 'NONE', label: 'Geen email versturen' }];
                const bodies: Record<string, { subject: string; body: string }> = {};
                templates.forEach(t => {
                    types.push({ id: t.id, label: t.label });
                    bodies[t.id] = { subject: t.subject, body: t.body };
                });
                this.emailTypes.set(types);
                this.emailBodies.set(bodies);
            },
            error: (err) => console.error('Failed to load email templates', err)
        });

        // Load existing survey if editing
        const id = this.activeRoute.snapshot.paramMap.get('id');
        if (id) {
            this.loadSurvey(id);
        } else {
            // No ID → auto-load the most recent survey instead of showing blank
            this.surveyService.getAllSurveys().subscribe({
                next: (surveys) => {
                    if (surveys?.length) {
                        const latest = surveys[surveys.length - 1];
                        this.router.navigate(['/create', latest._id], { replaceUrl: true });
                    }
                    // If no surveys exist at all, stay on blank new-survey form
                },
                error: () => { /* stay on blank form */ }
            });
        }
    }

    private loadSurvey(id: string): void {
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
                if (s.questions?.length) this.questions.set(s.questions);

                if (s.bonusTitle)    this.bonusTitle.set(s.bonusTitle);
                if (s.bonus1Label)   this.bonus1Label.set(s.bonus1Label);
                if (s.bonus1Text)    this.bonus1Text.set(s.bonus1Text);
                if (s.bonus2Label)   this.bonus2Label.set(s.bonus2Label);
                if (s.bonus2Text)    this.bonus2Text.set(s.bonus2Text);
                if (s.bonus3Label)   this.bonus3Label.set(s.bonus3Label);
                if (s.bonus3Text)    this.bonus3Text.set(s.bonus3Text);
                if (s.bonusCTALabel) this.bonusCTALabel.set(s.bonusCTALabel);

                if (s.automationSequenceB) this.automationSequenceB.set(s.automationSequenceB);
                if (s.automationSequenceC) this.automationSequenceC.set(s.automationSequenceC);
                if (s.testimonials?.length) this.testimonials.set(s.testimonials);
            },
            error: (err) => console.error('Failed to load survey', err)
        });
    }

    get sharableUrl(): string {
        return this.savedId()
            ? `${window.location.origin}/survey/${this.savedId()}`
            : '';
    }

    getBrochureDisplayName(): string {
        const val = this.brochureUrl();
        if (!val) return '';
        if (val.startsWith('data:')) return 'PDF Brochure (geladen) ✓';
        return val.length > 40 ? val.substring(0, 37) + '...' : val;
    }

    /** Called when the campagne-section child uploads a new brochure */
    onBrochureFromSection(payload: { name: string; base64: string }): void {
        this.brochureUrl.set(payload.name);
        this.brochureBase64.set(payload.base64);
    }

    async save(): Promise<void> {
        this.saving.set(true);
        let finalTitle = this.title();
        if (finalTitle === 'Nieuwe Kwalificatie Campagne' && this.heroHeadline()) {
            finalTitle = this.heroHeadline();
        }

        const survey: Survey = {
            company:      this.company(),
            title:        finalTitle,
            heroImage:    this.heroImageBase64() || undefined,
            heroHeadline: this.heroHeadline(),
            heroSubtext:  this.heroSubtext(),
            ctaText:      this.ctaText(),
            questions:    this.questions(),
            globalEmailConfig: {
                enabled: false,
                type: 'NONE',
                subject: '',
                body: '',
            },
            videoUrl:    this.videoUrl(),
            brochureUrl: this.brochureBase64() || undefined,
            bonusTitle:   this.bonusTitle(),
            bonus1Label:  this.bonus1Label(),
            bonus1Text:   this.bonus1Text(),
            bonus2Label:  this.bonus2Label(),
            bonus2Text:   this.bonus2Text(),
            bonus3Label:  this.bonus3Label(),
            bonus3Text:   this.bonus3Text(),
            bonusCTALabel: this.bonusCTALabel(),
            automationSequenceB: this.automationSequenceB(),
            automationSequenceC: this.automationSequenceC(),
            testimonials: this.testimonials(),
        };

        if (this.savedId()) {
            survey._id = this.savedId()!;
            this.surveyService.updateSurvey(survey).subscribe({
                next:  () => { this.saving.set(false); this.showSnackbar('Campagne succesvol bijgewerkt!'); },
                error: () => { this.saving.set(false); this.showSnackbar('Fout bij opslaan.'); }
            });
        } else {
            this.surveyService.createSurvey(survey).subscribe({
                next: (created) => {
                    this.savedId.set(created._id!);
                    this.saving.set(false);
                    this.showSnackbar('Nieuwe campagne aangemaakt!');
                    this.router.navigate(['/create', created._id], { replaceUrl: true });
                },
                error: () => { this.saving.set(false); this.showSnackbar('Fout bij maken campagne.'); }
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
