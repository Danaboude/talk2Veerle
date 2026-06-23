import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-campagne-section',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './campagne-section.component.html',
    styleUrls: ['../../creator-shared.css', './campagne-section.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampagneSectionComponent {
    @Input() title: string = '';
    @Input() brochureUrl: string | null = null;
    @Input() brochureDisplayName: string = '';

    @Output() titleChange = new EventEmitter<string>();
    @Output() brochureUploaded = new EventEmitter<{ name: string; base64: string }>();

    onBrochureUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            this.brochureUploaded.emit({ name: file.name, base64 });
        };
        reader.readAsDataURL(file);
    }
}
