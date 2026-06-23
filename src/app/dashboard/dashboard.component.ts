import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SurveyService } from '../services/survey.service';
import { AuthService } from '../services/auth.service';
import { Survey, SurveyResponse, CalendarSettings, Booking } from '../models/survey.model';
import { FormsModule } from '@angular/forms';

import { SurveysTabComponent }       from './tabs/surveys-tab/surveys-tab.component';
import { BookingsTabComponent }       from './tabs/bookings-tab/bookings-tab.component';
import { EmailTemplatesTabComponent } from './tabs/email-templates-tab/email-templates-tab.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, SurveysTabComponent, BookingsTabComponent, EmailTemplatesTabComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class DashboardComponent implements OnInit {
    private surveyService = inject(SurveyService);
    private router = inject(Router);
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    surveys = signal<Survey[]>([]);
    loading = signal(true);
    selectedSurvey = signal<Survey | null>(null);
    responses = signal<SurveyResponse[]>([]);
    responsesLoading = signal(false);
    expandedResponse = signal<string | null>(null);

    // Survey Analytics Computed Signals
    surveyStats = computed(() => {
        const res = this.responses();
        const survey = this.selectedSurvey();
        if (!res.length || !survey) return null;

        const total = res.length;
        const onlyContact = res.filter(r => Object.keys(r.answers).length === 0).length;
        const started = res.filter(r => Object.keys(r.answers).length > 0).length;

        // A response is finished if it has all questions answered
        const finished = res.filter(r => {
            const answerCount = Object.keys(r.answers).length;
            return answerCount >= survey.questions.length;
        }).length;

        const booked = 0;

        return {
            total,
            onlyContact,
            started,
            finished,
            booked,
            completionRate: Math.round((finished / total) * 100) || 0,
            bookingRate: Math.round((booked / total) * 100) || 0,
            dropOffRate: Math.round(((total - finished) / total) * 100) || 0
        };
    });

    questionStats = computed(() => {
        const res = this.responses();
        const survey = this.selectedSurvey();
        if (!res.length || !survey) return [];

        return survey.questions.map(q => {
            const count = res.filter(r => r.answers[q.id] !== undefined && r.answers[q.id] !== null && r.answers[q.id] !== '').length;
            const percent = Math.round((count / res.length) * 100);
            return {
                id: q.id,
                text: q.text,
                count,
                percent
            };
        });
    });

    lowestEngagementQuestion = computed(() => {
        const stats = this.questionStats();
        if (!stats.length || stats.every(s => s.percent === 100)) return null;
        // Find question with lowest count that is less than total responses
        return [...stats].sort((a, b) => a.count - b.count)[0];
    });

    // Email Modal State
    showEmailModal = signal(false);
    emailComposeSubject = signal('');
    emailComposeBody = signal('');
    emailTargetResponse = signal<SurveyResponse | null>(null);
    sendingEmail = signal(false);

    // Dynamic Email Templates
    emailTemplates = signal<any[]>([]);
    emailTemplatesLoading = signal(false);

    // Dashboard Tabs
    activeTab = signal<'surveys' | 'bookings' | 'email-templates'>('surveys');

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

    // Calendar & Bookings State
    calendarSettings = signal<CalendarSettings | null>(null);
    savingCalendar = signal(false);
    bookings = signal<Booking[]>([]);
    bookingsLoading = signal(false);

    processedBookings = computed(() => {
        const now = new Date().getTime();
        const rawBookings = this.bookings() || [];

        return [...rawBookings].map(b => {
            // Need to parse date/time properly even across timezones, assuming local is fine
            const bTime = new Date(`${b.date}T${b.time}:00`).getTime();
            return {
                ...b,
                isPast: bTime < now,
                timestamp: bTime
            };
        }).sort((a, b) => {
            if (a.isPast && !b.isPast) return 1; // Past bookings go to the bottom
            if (!a.isPast && b.isPast) return -1; // Upcoming bookings stay on top

            // If both are upcoming, sort soonest first
            if (!a.isPast && !b.isPast) return a.timestamp - b.timestamp;

            // If both are past, sort most recent past first (descending)
            return b.timestamp - a.timestamp;
        });
    });

    // Specific Dates & Visual Calendar State
    currentMonth = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    calendarDays = signal<{ date: Date | null, isToday: boolean, isSelected: boolean, hasSlots: boolean }[]>([]);
    selectedCalendarDate = signal<Date | null>(null);

    newSpecificTimeStart = signal('09:00');
    newSpecificTimeEnd = signal('17:00');

    // To allow iterating over days in the template
    daysOfWeek: (keyof CalendarSettings['weeklyHours'])[] = [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ];
    dayLabels: Record<string, string> = {
        monday: 'Maandag', tuesday: 'Dinsdag', wednesday: 'Woensdag',
        thursday: 'Donderdag', friday: 'Vrijdag', saturday: 'Zaterdag', sunday: 'Zondag'
    };

    ngOnInit(): void {
        this.loadSurveys();
        // this.loadCalendarSettings();
        // this.loadBookings();
        this.loadEmailTemplates();
    }

    setTab(tab: 'surveys' | 'bookings' | 'email-templates'): void {
        this.activeTab.set(tab);
        // tab bookings handled externally
        if (tab === 'email-templates' && this.emailTemplates().length === 0) {
            this.loadEmailTemplates();
        }
    }



    logout() {
        this.authService.logout();
    }

    loadCalendarSettings(): void { }
saveCalendarSettings(): void { }
// ===== VISUAL CALENDAR LOGIC =====

    generateCalendar(): void {
        const month = this.currentMonth();
        const year = month.getFullYear();
        const m = month.getMonth();

        const firstDay = new Date(year, m, 1);
        const lastDay = new Date(year, m + 1, 0);

        // JS getDay(): Sun=0, Mon=1... We want Mon=0, Sun=6
        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek === -1) startDayOfWeek = 6;

        const days = [];

        // Padding for previous month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ date: null, isToday: false, isSelected: false, hasSlots: false });
        }

        const pad = (n: number) => n.toString().padStart(2, '0');
        const toLocalIso = (d: Date | null) => d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : null;

        const todayStr = toLocalIso(new Date());
        const selectedStr = toLocalIso(this.selectedCalendarDate());
        const settings = this.calendarSettings();

        // Days of current month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateObj = new Date(year, m, d, 12, 0, 0); // Noon to avoid timezone shift dates
            const dateStr = toLocalIso(dateObj);

            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedStr;

            // Check if there are specific slots for this date
            const hasSlots = !!settings?.specificDates?.find(sd => sd.date === dateStr);

            days.push({ date: dateObj, isToday, isSelected, hasSlots });
        }

        this.calendarDays.set(days);
    }

    prevMonth(): void {
        const d = new Date(this.currentMonth());
        d.setMonth(d.getMonth() - 1);
        this.currentMonth.set(d);
        this.generateCalendar();
    }

    nextMonth(): void {
        const d = new Date(this.currentMonth());
        d.setMonth(d.getMonth() + 1);
        this.currentMonth.set(d);
        this.generateCalendar();
    }

    selectCalendarDate(date: Date | null): void {
        if (!date) return;
        this.selectedCalendarDate.set(date);
        this.newSpecificTimeStart.set('09:00');
        this.newSpecificTimeEnd.set('17:00');
        this.generateCalendar();
    }

    // Update add/remove logic to use selectedCalendarDate
    addSpecificDate(): void {
        const settings = this.calendarSettings();
        if (!settings) return;
        const selDate = this.selectedCalendarDate();
        if (!selDate || !this.newSpecificTimeStart() || !this.newSpecificTimeEnd()) {
            this.showSnackbar('Selecteer een datum op de kalender, en vul de tijden in.');
            return;
        }

        const pad = (n: number) => n.toString().padStart(2, '0');
        const dateStr = `${selDate.getFullYear()}-${pad(selDate.getMonth() + 1)}-${pad(selDate.getDate())}`;

        if (!settings.specificDates) {
            settings.specificDates = [];
        }

        settings.specificDates.push({
            date: dateStr,
            start: this.newSpecificTimeStart(),
            end: this.newSpecificTimeEnd()
        });

        this.calendarSettings.set({ ...settings });

        // Re-generate to show the red dot on the calendar
        this.generateCalendar();
        this.saveCalendarSettings(); // Auto-save inline
    }

    removeSpecificDate(index: number, dateStr?: string): void {
        const settings = this.calendarSettings();
        if (!settings || !settings.specificDates) return;

        if (dateStr) {
            // Remove exactly matching date string if called from day panel
            const idx = settings.specificDates.findIndex(sd => sd.date === dateStr && sd.start === settings.specificDates![index].start);
            if (idx !== -1) settings.specificDates.splice(idx, 1);
        } else {
            // Remove by typical index reference
            settings.specificDates.splice(index, 1);
        }

        this.calendarSettings.set({ ...settings });
        this.generateCalendar();
        this.saveCalendarSettings(); // Auto-save inline
    }

    copyToEveryWeek(): void {
        const selObj = this.selectedCalendarDate();
        if (!selObj) return;

        const currentSlots = this.selectedDateSlots();
        if (currentSlots.length === 0) {
            this.showSnackbar('Voeg eerst tijden toe aan deze dag voordat je kunt kopiëren.');
            return;
        }

        const settings = this.calendarSettings();
        if (!settings || !settings.specificDates) return;

        // Copy for the next 12 weeks (approx 3 months)
        const weeksToCopy = 12;
        let addedCount = 0;

        for (let i = 1; i <= weeksToCopy; i++) {
            const nextDate = new Date(selObj.getFullYear(), selObj.getMonth(), selObj.getDate(), 12, 0, 0);
            nextDate.setDate(nextDate.getDate() + (i * 7));
            const pad = (n: number) => n.toString().padStart(2, '0');
            const nextDateStr = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())}`;

            for (const slot of currentSlots) {
                const exists = settings.specificDates.some(sd => sd.date === nextDateStr && sd.start === slot.start && sd.end === slot.end);
                if (!exists) {
                    settings.specificDates.push({
                        date: nextDateStr,
                        start: slot.start,
                        end: slot.end
                    });
                    addedCount++;
                }
            }
        }

        if (addedCount > 0) {
            this.calendarSettings.set({ ...settings });
            this.generateCalendar();
            this.saveCalendarSettings(); // Auto-save inline
            this.showSnackbar(`Succesvol gekopieerd naar de komende ${weeksToCopy} weken!`);
        } else {
            this.showSnackbar('Deze tijden staan al ingesteld voor de komende weken.');
        }
    }

    // Gets slots specific to the currently selected calendar date
    selectedDateSlots = computed(() => {
        const selObj = this.selectedCalendarDate();
        if (!selObj) return [];
        const pad = (n: number) => n.toString().padStart(2, '0');
        const dateStr = `${selObj.getFullYear()}-${pad(selObj.getMonth() + 1)}-${pad(selObj.getDate())}`;
        const settings = this.calendarSettings();
        if (!settings || !settings.specificDates) return [];

        return settings.specificDates.map((sd, i) => ({ ...sd, originalIndex: i }))
            .filter(sd => sd.date === dateStr);
    });

    loadBookings(): void {
        this.bookingsLoading.set(true);
        this.surveyService.getBookings().subscribe({
            next: (b) => { this.bookings.set(b); this.bookingsLoading.set(false); },
            error: () => this.bookingsLoading.set(false)
        });
    }

    deleteBooking(booking: Booking): void {
        if (!confirm(`Afspraak met ${booking.name} op ${booking.date} verwijderen?`)) return;
        this.surveyService.deleteBooking(booking._id!).subscribe({
            next: () => {
                this.bookings.update(bs => bs.filter(b => b._id !== booking._id));
                this.showSnackbar('Afspraak verwijderd.');
            },
            error: (err) => {
                console.error('Delete booking failed', err);
                this.showSnackbar('Fout bij verwijderen afspraak.');
            }
        });
    }

    loadEmailTemplates(): void {
        this.emailTemplatesLoading.set(true);
        this.surveyService.getEmailTemplates().subscribe({
            next: (data) => {
                this.emailTemplates.set(data);
                this.emailTemplatesLoading.set(false);
            },
            error: () => {
                console.error("Failed to load templates");
                this.emailTemplatesLoading.set(false);
            }
        });
    }

    saveEmailTemplate(template: any): void {
        this.surveyService.updateEmailTemplate(template).subscribe({
            next: () => {
                this.showSnackbar(`Template '${template.label}' succesvol opgeslagen!`);
            },
            error: () => {
                this.showSnackbar(`Fout bij opslaan van template '${template.label}'.`);
            }
        });
    }

    deleteEmailTemplate(template: any): void {
        if (!confirm(`Weet je zeker dat je de template '${template.label}' wilt verwijderen?`)) return;
        this.surveyService.deleteEmailTemplate(template.id).subscribe({
            next: () => {
                this.emailTemplates.update(ts => ts.filter(t => t.id !== template.id));
                this.showSnackbar(`Template '${template.label}' verwijderd.`);
            },
            error: () => {
                this.showSnackbar(`Fout bij verwijderen van template '${template.label}'.`);
            }
        });
    }

    addNewTemplate(): void {
        const id = `CUSTOM_${Math.floor(Math.random() * 100000)}`;
        this.emailTemplates.update(ts => [{ id, label: 'Label schrijven', subject: '', body: '' }, ...ts]);
        // Note: they need to click "Opslaan" to actually save it to DB
    }

    getTemplateLabel(type: string): string {
        this.loading.set(true);
        this.surveyService.getAllSurveys().subscribe({
            next: (s) => { this.surveys.set(s); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
        return ''; // Added return to satisfy method signature
    }

    loadSurveys(): void {
        this.loading.set(true);
        this.surveyService.getAllSurveys().subscribe({
            next: (s) => { this.surveys.set(s); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }

    selectSurvey(survey: Survey): void {
        this.selectedSurvey.set(survey);
        this.responses.set([]);
        this.responsesLoading.set(true);
        this.surveyService.getResponsesBySurvey(survey._id!).subscribe({
            next: (r) => { this.responses.set(r); this.responsesLoading.set(false); },
            error: () => this.responsesLoading.set(false),
        });
    }

    toggleResponseExpand(id: string): void {
        this.expandedResponse.update(cur => cur === id ? null : id);
    }

    getAnswerText(survey: Survey, questionId: string, answerId: string): string {
        if (answerId && answerId.startsWith('OTHER:')) {
            return answerId.replace('OTHER:', '');
        }
        const q = survey.questions.find(q => q.id === questionId);
        if (!q) return answerId;
        const a = q.answers.find(a => a.id === answerId || a.text === answerId);
        return a?.text || answerId;
    }

    deleteResponse(response: SurveyResponse, event: Event): void {
        event.stopPropagation();
        if (!confirm(`Reactie van ${response.respondentName} verwijderen?`)) return;
        this.surveyService.deleteResponse(response._id!).subscribe({
            next: () => {
                this.responses.update(rs => rs.filter(r => r._id !== response._id));
                this.showSnackbar('Reactie verwijderd.');
            },
            error: (err) => {
                console.error('Delete response failed', err);
                this.showSnackbar('Fout bij verwijderen reactie.');
            }
        });
    }

    getEmailTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            BROCHURE: 'Brochure Download',
            IMPROVEMENT: '30-40% Verbetering',
            UNDERSTANDING: 'Begrijpen voor Verbeteren',
            TIME_INSIGHT: 'Inzicht in Tijdsbesteding',
            MEASURE: 'Niet Meten is Niet Weten',
            SURVEY_REMINDER: 'Herinnering Vragenlijst',
            BROCHURE_REMINDER: 'Herinnering Brochure',
        };
        return labels[type] || type;
    }

    copyLink(id: string): void {
        navigator.clipboard.writeText(`${window.location.origin}/survey/${id}`);
    }

    deleteSurvey(survey: Survey): void {
        if (!confirm(`Survey "${survey.title}" verwijderen?`)) return;
        this.surveyService.deleteSurvey(survey._id!).subscribe({
            next: () => {
                this.surveys.update(ss => ss.filter(s => s._id !== survey._id));
                if (this.selectedSurvey()?._id === survey._id) {
                    this.selectedSurvey.set(null);
                    this.responses.set([]);
                }
            }
        });
    }

    editSurvey(survey: Survey): void {
        this.router.navigate(['/create', survey._id]);
    }

    sendReminder(response: SurveyResponse): void {
        if (!confirm(`Wil je een herinnering sturen naar ${response.respondentEmail}?`)) return;
        this.sendingEmail.set(true);
        this.surveyService.sendEmail({
            email: response.respondentEmail,
            name: response.respondentName,
            templateId: 'SURVEY_REMINDER',
            responseId: response._id!,
            company: this.selectedSurvey()?.company
        }).subscribe({
            next: () => {
                this.showSnackbar('Herinnering gestuurd!');
                this.sendingEmail.set(false);
                this.refreshResponses();
            },
            error: () => {
                this.showSnackbar('Fout bij versturen.');
                this.sendingEmail.set(false);
            }
        });
    }

    openEmailModal(response: SurveyResponse): void {
        this.emailTargetResponse.set(response);
        this.emailComposeSubject.set('');
        this.emailComposeBody.set('');
        this.showEmailModal.set(true);
    }

    closeEmailModal(): void {
        this.showEmailModal.set(false);
        this.emailTargetResponse.set(null);
    }

    sendCustomEmail(): void {
        const resp = this.emailTargetResponse();
        if (!resp || !this.emailComposeSubject().trim() || !this.emailComposeBody().trim()) return;

        this.sendingEmail.set(true);
        this.surveyService.sendEmail({
            email: resp.respondentEmail,
            name: resp.respondentName,
            subject: this.emailComposeSubject(),
            body: this.emailComposeBody(),
            responseId: resp._id!,
            company: this.selectedSurvey()?.company
        }).subscribe({
            next: () => {
                this.sendingEmail.set(false);
                this.closeEmailModal();
                this.showSnackbar('E-mail succesvol verstuurd!');
                this.refreshResponses();
            },
            error: () => {
                this.sendingEmail.set(false);
                this.showSnackbar('Fout bij versturen van e-mail.');
            }
        });
    }

    private refreshResponses(): void {
        if (this.selectedSurvey()) {
            this.surveyService.getResponsesBySurvey(this.selectedSurvey()!._id!).subscribe({
                next: (r) => this.responses.set(r)
            });
        }
    }

    formatDate(iso: string): string {
        return new Date(iso).toLocaleString('nl-BE', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }
}
