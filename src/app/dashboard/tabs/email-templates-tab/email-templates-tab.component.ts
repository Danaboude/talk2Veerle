import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-email-templates-tab',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './email-templates-tab.component.html',
    styleUrl: './email-templates-tab.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplatesTabComponent {
    @Input() emailTemplates: any[] = [];
    @Input() emailTemplatesLoading: boolean = false;

    @Output() templateSave   = new EventEmitter<any>();
    @Output() templateDelete = new EventEmitter<any>();
    @Output() templateAdd    = new EventEmitter<void>();
}
