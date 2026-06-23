import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Testimonial } from '../../../models/survey.model';

@Component({
    selector: 'app-survey-testimonials',
    standalone: true,
    imports: [],
    templateUrl: './survey-testimonials.component.html',
    styleUrl: './survey-testimonials.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyTestimonialsComponent {
    @Input() testimonials: Testimonial[] = [];
}
