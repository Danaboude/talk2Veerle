import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SurveyService } from '../services/survey.service';
import { Survey, SurveyResponse, CalendarSettings } from '../models/survey.model';
import { SurveyHeroComponent } from './sections/survey-hero/survey-hero.component';
import { SurveyWizardComponent } from './sections/survey-wizard/survey-wizard.component';
import { SurveyTestimonialsComponent } from './sections/survey-testimonials/survey-testimonials.component';
import { SurveyThankyouComponent } from './sections/survey-thankyou/survey-thankyou.component';

@Component({
    selector: 'app-survey',
    standalone: true,
    imports: [CommonModule, FormsModule, SurveyHeroComponent, SurveyWizardComponent, SurveyTestimonialsComponent, SurveyThankyouComponent],
    templateUrl: './survey.component.html',
    styleUrl: './survey.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class SurveyComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private surveyService = inject(SurveyService);
    private sanitizer = inject(DomSanitizer);

    survey = signal<Survey | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);
    submitted = signal(false);
    submitting = signal(false);
    isBrochureDownloadDone = signal(false);

    // Intro survey state
    showIntro = signal(false);
    introAccepted = signal(false);

    // Form fields
    name = signal('');
    email = signal('');
    phone = signal('');
    answers = signal<{ [questionId: string]: string }>({});
    otherAnswers = signal<{ [questionId: string]: string }>({});
    responseObjId = signal<string | null>(null); // Save DB ID to link booking later

    // Wizard
    currentStep = signal(0);

    // Bookings
    calendarSettings = signal<CalendarSettings | null>(null);
    availableDates = signal<{ date: string; display: string }[]>([]);
    availableTimes = signal<string[]>([]);
    loadingTimes = signal(false);
    selectedDate = signal<string | null>(null);
    formattedSelectedDate = computed(() => {
        const d = this.selectedDate();
        if (!d) return null;
        const [y, m, d_part] = d.split('-');
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d_part), 12, 0, 0);
        return new Intl.DateTimeFormat('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj);
    });
    selectedTime = signal<string | null>(null);
    bookingStatus = signal<'idle' | 'booking' | 'success' | 'error'>('idle');

    // DatePicker constraints
    minDateString = signal<string>('');
    maxDateString = signal<string>('');

    safeShowPicker(picker: HTMLInputElement): void {
        if (typeof picker.showPicker === 'function') {
            try {
                picker.showPicker();
            } catch (e) {
                console.error('showPicker failed:', e);
            }
        } else {
            // Fallback for older browsers
            picker.click();
        }
    }

    get phoneError(): string | null {
        const val = this.phone().trim();
        if (!val) return 'Telefoonnummer is verplicht';
        if (!val.startsWith('+')) return 'Landcode (+) ontbreekt (bijv. +32)';
        
        const cleanVal = val.replace(/\s+/g, '');
        if (cleanVal.length < 10) return 'Nummer is te kort';
        if (cleanVal.length > 15) return 'Nummer is te lang';
        
        const phoneRegex = /^\+[0-9]{7,15}$/;
        if (!phoneRegex.test(cleanVal)) return 'Ongeldig formaat';
        
        return null;
    }

    get canProceedToQuestions(): boolean {
        return !!this.name().trim() && !!this.email().trim() && !this.phoneError;
    }

    nextStep(): void {
        if (this.currentStep() === 0 && !this.canProceedToQuestions) return;
        this.currentStep.update(s => s + 1);
    }

    prevStep(): void {
        this.currentStep.update(s => Math.max(0, s - 1));
    }

    wantsMeeting = signal<string | null>(null);

    selectMeetingPreference(choice: 'yes' | 'no'): void {
        this.wantsMeeting.set(choice);
        this.submit();
    }

    selectAnswerAndNext(questionId: string, answerId: string, isLast: boolean): void {
        this.selectAnswer(questionId, answerId);

        if (answerId === 'other') {
            // Don't auto-advance, let user type
            return;
        }

        if (isLast) {
            // Instantly call submit which handles the spinner
            this.submit();
        } else {
            // Short delay to let user see their selection before transitioning to the next question
            setTimeout(() => {
                this.nextStep();
            }, 350);
        }
    }

    submitOtherAnswer(questionId: string): void {
        const text = this.otherAnswers()[questionId];
        if (!text) return;

        // Store the actual text in the answers object
        this.answers.update(a => ({ ...a, [questionId]: 'OTHER:' + text }));

        const isLast = this.currentStep() === (this.survey()?.questions?.length || 0) + 1;

        if (isLast) {
            this.submit();
        } else {
            this.nextStep();
        }
    }

    updateOtherAnswer(questionId: string, text: string): void {
        this.otherAnswers.update(oa => ({ ...oa, [questionId]: text }));
    }

    embedUrl = computed(() => {
        const url = this.survey()?.videoUrl;
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (!match) return null;
        // Autoplay=1 and Mute=0 to ensure sound if possible
        return this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=0`
        );
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        const mode = this.route.snapshot.queryParamMap.get('mode');
        const respondentId = this.route.snapshot.queryParamMap.get('respondentId');
        const hostname = window.location.hostname;

        if (!id) {
            // Handle subdomain logic: survey.p41.be or survey.aeriez.com
            if (hostname.includes('Talk2')) {
                this.loadSurveyByCompany('Talk2', mode, respondentId);
            } else if (hostname.includes('Talk2')) {
                this.loadSurveyByCompany('Talk2', mode, respondentId);
            } else {
                // Not a survey subdomain and no ID, go to login
                this.router.navigate(['/login']);
            }
            this.loadCalendarSettings();
            return;
        }

        // Regular ID-based load
        this.surveyService.getSurveyById(id).subscribe({
            next: (s) => this.handleSurveyLoad(s, mode, respondentId),
            error: () => { this.error.set('Survey niet gevonden.'); this.loading.set(false); },
        });

        this.loadCalendarSettings();
    }

    private loadSurveyByCompany(company: string, mode: string | null, respondentId: string | null): void {
        this.surveyService.getSurveyByCompany(company).subscribe({
            next: (s) => this.handleSurveyLoad(s, mode, respondentId),
            error: () => { this.error.set(`Geen survey gevonden voor ${company}.`); this.loading.set(false); },
        });
    }

    private loadCalendarSettings(): void {
        // Removed calendar settings
    }

    private handleSurveyLoad(s: Survey, mode: string | null, respondentId: string | null): void {
        // Enforce default testimonials if missing or empty for all surveys
        if (!s.testimonials || s.testimonials.length === 0) {
            s.testimonials = [
                {
                    id: '1',
                    author: 'Reynaers Aluminium',
                    quote: 'Dankzij Talk2 ontwikkelden we een productonafhankelijke tijdstudie en een nieuwe interne software voor workflowmanagement. We definieerden de parameters van ramen en deuren ongeacht de afmetingen, waarna we de productiesnelheid optimaliseerden met 43%.',
                    stars: 5
                },
                {
                    id: '2',
                    author: 'Benteler Automotive Belgium',
                    quote: 'Talk2 verzorgden tijdstudie, procesoptimalisaties en trainingen die resulteerden in een betere balansatie tussen onze productielijnen. Ze leerden ons kritisch kijken naar de eigen organisatie.',
                    stars: 5
                }
            ];
        }

        this.survey.set(s);
        this.loading.set(false);

        if (respondentId) {
            this.responseObjId.set(respondentId);
            this.surveyService.getResponseById(respondentId).subscribe({
                next: (resp) => {
                    this.name.set(resp.respondentName || '');
                    this.email.set(resp.respondentEmail || '');
                    this.phone.set(resp.respondentPhone || '');
                    
                    this.introAccepted.set(true);
                    this.showIntro.set(true);

                    if (mode === 'calendar') {
                        this.submitted.set(true);
                        this.wantsMeeting.set('yes');
                    } else if (mode === 'brochure') {
                        this.isBrochureDownloadDone.set(true);
                        this.downloadBrochure();
                        this.submitted.set(true);
                    } else {
                        this.currentStep.set(1);
                    }
                }
            });
        }
    }

    selectAnswer(questionId: string, answerId: string): void {
        this.answers.update(a => ({ ...a, [questionId]: answerId }));
    }

    isSelected(questionId: string, answerId: string): boolean {
        return this.answers()[questionId] === answerId;
    }

    get formValid(): boolean {
        const s = this.survey();
        if (!s) return false;
        if (!this.name().trim() || !this.email().trim() || this.phoneError) return false;
        return s.questions.every(q => !!this.answers()[q.id]);
    }

    async submitLead(): Promise<void> {
        if (!this.canProceedToQuestions || this.submitting()) return;
        this.submitting.set(true);
        const response: Partial<SurveyResponse> = {
            surveyId: this.survey()!._id!,
            respondentName: this.name(),
            respondentEmail: this.email(),
            respondentPhone: this.phone(),
            answers: {}, // Empty for now
        };

        this.surveyService.submitResponse(response as SurveyResponse).subscribe({
            next: (res: any) => {
                if (res._id) {
                    this.responseObjId.set(res._id);
                }
                this.submitting.set(false);
                
                // Trigger Brochure Email
                this.surveyService.sendEmail({
                    email: response.respondentEmail!,
                    name: response.respondentName!,
                    templateId: 'BROCHURE',
                    responseId: res._id,
                    surveyId: this.survey()?._id,
                    company: this.survey()?.company
                }).subscribe();

                // Move directly to Questions (Skip Intro Video)
                this.introAccepted.set(true);
                this.nextStep();
            },
            error: () => { 
                alert('Er is iets misgegaan. Probeer het opnieuw.'); 
                this.submitting.set(false); 
            },
        });
    }

    submit(): void {
        const s = this.survey();
        if (!s) return;

        this.submitting.set(true);
        const responseId = this.responseObjId();
        
        const combinedAnswers = { 
            ...this.answers(),
            wantsMeeting: this.wantsMeeting() ?? 'no'
        };

        if (responseId) {
            this.surveyService.updateResponse(responseId, combinedAnswers as any).subscribe({
                next: () => {
                    this.submitting.set(false);
                    this.submitted.set(true);
                },
                error: (err) => {
                    console.error('Update failed:', err);
                    this.submitting.set(false);
                    // Still show thank you if lead was already captured? 
                    // Better to just show thank you anyway to avoid user frustration
                    this.submitted.set(true);
                }
            });
        } else {
            this.submitting.set(false);
            this.submitted.set(true);
        }
    }

    acceptIntro(): void {
        this.introAccepted.set(true);
        this.nextStep();
    }

    downloadBrochure(): void {
        const s = this.survey();
        const link = document.createElement('a');
        
        if (s?.brochureUrl) {
            // It might be a base64 string or a URL
            link.href = s.brochureUrl;
            link.download = s.brochureUrl.startsWith('data:application/pdf') ? 'Brochure.pdf' : s.brochureUrl.split('/').pop() || 'Brochure.pdf';
        } else {
            link.href = '/Brochure.pdf';
            link.download = 'Brochure.pdf';
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    scrollToSurvey(): void {
        this.showIntro.set(true);
        setTimeout(() => {
            document.getElementById('survey-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    // --- Bookings Logic ---
    computeAvailableDates(settings: CalendarSettings): void {
        const dates: { date: string; display: string }[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0); // start of day

        // Setup DatePicker constraints
        this.minDateString.set(now.toISOString().split('T')[0]);
        const max = new Date(now);
        max.setDate(now.getDate() + (settings.lookaheadDays || 14));
        this.maxDateString.set(max.toISOString().split('T')[0]);

        // Strictly use specific dates (no generic weekly fallback)
        if (settings.specificDates && settings.specificDates.length > 0) {
            // Sort dates chronologically
            const sortedSpecific = [...settings.specificDates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const uniqueDates = new Set<string>();

            for (const sd of sortedSpecific) {
                const [y, m, d_part] = sd.date.split('-');
                const localDateObj = new Date(Number(y), Number(m) - 1, Number(d_part), 12, 0, 0);
                if (localDateObj >= now) {
                    if (!uniqueDates.has(sd.date)) {
                        uniqueDates.add(sd.date);
                        const display = new Intl.DateTimeFormat('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' }).format(localDateObj);
                        dates.push({ date: sd.date, display });
                    }
                }
            }
        }

        this.availableDates.set(dates);
    }

    selectDate(dateStr: string): void {
        this.selectedDate.set(dateStr);
        this.selectedTime.set(null);

        const settings = this.calendarSettings();
        if (!settings) return;

        let startStr = '';
        let endStr = '';

        // Strictly use specific dates
        if (!settings.specificDates || settings.specificDates.length === 0) {
            this.availableTimes.set([]);
            return;
        }

        const specificMatches = settings.specificDates.filter(sd => sd.date === dateStr);
        if (specificMatches.length === 0) {
            this.availableTimes.set([]);
            return;
        }

        const times: string[] = [];
        const slotLen = settings.slotDurationMinutes || 30;

        for (const match of specificMatches) {
            const [startH, startM] = match.start.split(':').map(Number);
            const [endH, endM] = match.end.split(':').map(Number);

            let currentMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            while (currentMinutes + slotLen <= endMinutes) {
                const h = Math.floor(currentMinutes / 60);
                const m = currentMinutes % 60;
                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                if (!times.includes(timeStr)) {
                    times.push(timeStr);
                }
                currentMinutes += slotLen;
            }
        }

        // Fetch bookings for this date and filter out taken slots
        this.loadingTimes.set(true);
        this.availableTimes.set([]); // Clear briefly

        this.surveyService.getBookings(dateStr).subscribe({
            next: (bookings) => {
                // Bookings that are not cancelled
                const activeBookings = bookings.filter((b: any) => b.status !== 'cancelled');
                const takenTimes = activeBookings.map((b: any) => b.time);

                // Keep only times that are NOT in takenTimes
                const filteredTimes = times.filter(t => !takenTimes.includes(t));

                this.availableTimes.set(filteredTimes);
                this.loadingTimes.set(false);
            },
            error: () => {
                // If it fails, fallback to showing all times.
                this.availableTimes.set(times);
                this.loadingTimes.set(false);
            }
        });
    }

    bookAppointment(): void {
        const date = this.selectedDate();
        const time = this.selectedTime();
        if (!date || !time) return;

        this.bookingStatus.set('booking');

        const booking = {
            surveyId: this.survey()!._id,
            respondentId: this.responseObjId(),
            name: this.name(),
            email: this.email(),
            phone: this.phone(),
            date: date,
            time: time
        };

        this.surveyService.createBooking(booking).subscribe({
            next: () => {
                this.bookingStatus.set('success');
                console.log('[DEBUG survey.component] Booking created successfully. Triggering confirmation email...');
                // Trigger Confirmation Email
                this.surveyService.sendEmail({
                    email: booking.email,
                    name: booking.name,
                    templateId: 'BOOKING_CONFIRMATION',
                    bookingDate: booking.date,
                    bookingTime: booking.time,
                    company: this.survey()?.company
                }).subscribe({
                    next: (res) => console.log('[DEBUG survey.component] Email api reported success:', res),
                    error: (err) => console.error('[DEBUG survey.component] Email api reported error:', err)
                });
            },
            error: (err) => {
                console.error('[DEBUG survey.component] Error creating booking:', err);
                this.bookingStatus.set('error');
            }
        });
    }
}
