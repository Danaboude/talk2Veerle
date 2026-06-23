import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';
import { CalendarSettings } from '../../../models/survey.model';

@Component({
    selector: 'app-survey-thankyou',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './survey-thankyou.component.html',
    styleUrl: './survey-thankyou.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyThankyouComponent {
    @Input() isBrochureDownloadDone: boolean = false;
    @Input() embedUrl: SafeResourceUrl | null = null;
    @Input() calendarSettings: CalendarSettings | null = null;
    @Input() availableDates: { date: string; display: string }[] = [];
    @Input() availableTimes: string[] = [];
    @Input() loadingTimes: boolean = false;
    @Input() selectedDate: string | null = null;
    @Input() formattedSelectedDate: string | null = null;
    @Input() selectedTime: string | null = null;
    @Input() bookingStatus: 'idle' | 'booking' | 'success' | 'error' = 'idle';
    @Input() minDateString: string = '';
    @Input() maxDateString: string = '';
    @Input() email: string = '';

    @Output() dateSelect = new EventEmitter<string>();
    @Output() timeSelect = new EventEmitter<string>();
    @Output() bookAppointmentClick = new EventEmitter<void>();

    safeShowPicker(picker: HTMLInputElement): void {
        if (typeof picker.showPicker === 'function') {
            try {
                picker.showPicker();
            } catch (e) {
                picker.click();
            }
        } else {
            picker.click();
        }
    }
}
