import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Testimonial } from '../../../models/survey.model';

function newTestimonial(): Testimonial {
    return { id: crypto.randomUUID(), author: '', quote: '', stars: 5 };
}

@Component({
    selector: 'app-testimonials-section',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './testimonials-section.component.html',
    styleUrls: ['../../creator-shared.css', './testimonials-section.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsSectionComponent {
    @Input() testimonials: Testimonial[] = [];
    @Output() testimonialsChange = new EventEmitter<Testimonial[]>();

    addTestimonial(): void {
        this.testimonialsChange.emit([...this.testimonials, newTestimonial()]);
    }

    removeTestimonial(id: string): void {
        if (this.testimonials.length <= 1) return;
        this.testimonialsChange.emit(this.testimonials.filter(t => t.id !== id));
    }

    updateTestimonial(id: string, field: keyof Testimonial, value: any): void {
        this.testimonialsChange.emit(
            this.testimonials.map(t => t.id === id ? { ...t, [field]: value } : t)
        );
    }
}
