export interface EmailTemplate {
    id: string;
    label: string;
    subject: string;
    body: string;
}

export interface Testimonial {
    id: string;
    quote: string;
    author: string;
    stars: number;
}

export interface QuestionAnswer {
    id: string;
    text: string;
    emailType?: string; // optional email type to trigger for this answer
}

export interface Question {
    id: string;
    text: string;
    type: 'single' | 'multiple';
    answers: QuestionAnswer[];
    emailEnabled: boolean;
    emailType?: string; // default email type for this question
    emailTriggerAnswerId?: string; // ID of the answer that triggers the email
    allowOther?: boolean; // If true, user can write their own answer
}

export interface EmailConfig {
    enabled: boolean;
    subject: string;
    body: string;
    type?: string;
}

export interface AutomationTrigger {
    enabled: boolean;
    emailType: string; // template ID
}

export interface Survey {
    _id?: string;
    title: string;
    heroImage?: string;
    heroHeadline: string;
    heroSubtext: string;
    ctaText: string;
    questions: Question[];
    globalEmailConfig: EmailConfig;
    videoUrl?: string;
    brochureUrl?: string;
    createdAt?: string;
    responseCount?: number;
    // Bonus text column
    bonusTitle?: string;
    bonus1Label?: string;
    bonus1Text?: string;
    bonus2Label?: string;
    bonus2Text?: string;
    bonus3Label?: string;
    bonus3Text?: string;
    bonusCTALabel?: string;
    // Automation email triggers
    openedNoSubmitEmail?: AutomationTrigger;
    startedNoFinishEmail?: AutomationTrigger;
    finishedNoMeetingEmail?: AutomationTrigger;
    // Multi-step automation sequences
    automationSequenceB?: AutomationStep[]; // Completed but no appointment
    automationSequenceC?: AutomationStep[]; // Started but not finished
    // Branding Variant
    company?: 'Talk2' | 'Talk2';
    // Testimonials
    testimonials?: Testimonial[];
}

export interface AutomationStep {
    id: string;
    templateId: string;
    delayDays: number;
}

export interface SurveyResponse {
    _id?: string;
    surveyId: string;
    respondentName: string;
    respondentEmail: string;
    respondentPhone?: string;
    answers: { [questionId: string]: string | string[] };
    emailsSent?: { type: string; sentAt: string }[];
    submittedAt?: string;
}

export const EMAIL_TEMPLATE_TYPES = [
    { id: 'NONE', label: 'Geen email versturen' },
    { id: 'BROCHURE', label: 'Brochure Download' },
    { id: 'IMPROVEMENT', label: '30-40% Verbetering' },
    { id: 'UNDERSTANDING', label: 'Begrijpen voor Verbeteren' },
    { id: 'TIME_INSIGHT', label: 'Inzicht in Tijdsbesteding' },
    { id: 'MEASURE', label: 'Niet Meten is Niet Weten' },
    { id: 'SURVEY_REMINDER', label: 'Herinnering Vragenlijst' },
    { id: 'BROCHURE_REMINDER', label: 'Herinnering Brochure' },
    { id: 'BOOKING_CONFIRMATION', label: 'Afspraak Bevestiging' },
    { id: 'LINK_OPENED_REMINDER', label: 'Herinnering: Link geopend (niet ingevuld)' },
    { id: 'SURVEY_INCOMPLETE_REMINDER', label: 'Herinnering: Survey niet afgemaakt' },
    { id: 'NO_MEETING_REMINDER', label: 'Herinnering: Geen afspraak geboekt' },
];

export interface DaySchedule {
    active: boolean;
    start: string; // "09:00"
    end: string;   // "17:00"
}

export interface CalendarSettings {
    _id?: string;
    weeklyHours: {
        monday: DaySchedule;
        tuesday: DaySchedule;
        wednesday: DaySchedule;
        thursday: DaySchedule;
        friday: DaySchedule;
        saturday: DaySchedule;
        sunday: DaySchedule;
    };
    specificDates?: { date: string; start: string; end: string }[]; // Formatted as YYYY-MM-DD
    slotDurationMinutes: number;
    lookaheadDays: number;
    updatedAt?: string;
}

export interface Booking {
    _id?: string;
    name: string;
    email: string;
    phone?: string;
    date: string; // "YYYY-MM-DD"
    time: string; // "HH:MM"
    surveyId: string;
    respondentId?: string;
    status: 'confirmed' | 'cancelled' | 'completed';
    createdAt?: string;
}
