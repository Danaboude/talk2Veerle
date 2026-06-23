import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { inject } from '@angular/core';

@Component({
    selector: 'app-video-section',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './video-section.component.html',
    styleUrls: ['../../creator-shared.css', './video-section.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoSectionComponent {
    private sanitizer = inject(DomSanitizer);

    @Input() videoUrl: string = '';
    @Output() videoUrlChange = new EventEmitter<string>();

    get embedUrl(): SafeResourceUrl | null {
        const url = this.videoUrl;
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (!match) return null;
        return this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube.com/embed/${match[1]}`
        );
    }
}
