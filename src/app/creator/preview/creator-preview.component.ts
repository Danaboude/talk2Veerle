import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Question, Testimonial, AutomationStep } from '../../models/survey.model';

@Component({
    selector: 'app-creator-preview',
    standalone: true,
    imports: [],
    templateUrl: './creator-preview.component.html',
    styleUrl: './creator-preview.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatorPreviewComponent {
    private sanitizer = inject(DomSanitizer);

    @Input() heroHeadline: string = '';
    @Input() heroSubtext: string = '';
    @Input() ctaText: string = '';
    @Input() heroImagePreview: string | null = null;
    @Input() bonusTitle: string = '';
    @Input() bonus1Label: string = '';
    @Input() bonus1Text: string = '';
    @Input() bonus2Label: string = '';
    @Input() bonus2Text: string = '';
    @Input() bonus3Label: string = '';
    @Input() bonus3Text: string = '';
    @Input() bonusCTALabel: string = '';
    @Input() questions: Question[] = [];
    @Input() testimonials: Testimonial[] = [];
    @Input() sequenceB: AutomationStep[] = [];
    @Input() sequenceC: AutomationStep[] = [];
    @Input() emailTypes: { id: string; label: string }[] = [];
    @Input() videoUrl: string = '';

    get embedUrl(): SafeResourceUrl | null {
        if (!this.videoUrl) return null;
        const match = this.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (!match) return null;
        return this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube.com/embed/${match[1]}`
        );
    }

    getEmailLabel(templateId: string): string {
        return this.emailTypes.find(t => t.id === templateId)?.label ?? templateId;
    }
}
