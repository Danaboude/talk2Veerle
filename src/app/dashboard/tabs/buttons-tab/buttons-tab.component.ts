import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    DEFAULT_PAGE_BUTTONS, PAGE_BUTTON_SECTIONS, PageButtonKey, PageButtons, PageButtonsService, normalizeButtonUrl,
} from '../../../services/page-buttons.service';

@Component({
    selector: 'app-buttons-tab',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './buttons-tab.component.html',
    styleUrl: './buttons-tab.component.css',
})
export class ButtonsTabComponent implements OnInit {
    private service = inject(PageButtonsService);

    readonly sections = PAGE_BUTTON_SECTIONS;
    buttons: PageButtons = structuredClone(DEFAULT_PAGE_BUTTONS);
    loading = signal(true);
    saving = signal(false);
    toast = signal<{ ok: boolean; text: string } | null>(null);
    private toastTimer?: ReturnType<typeof setTimeout>;

    ngOnInit(): void {
        this.service.get().subscribe(b => {
            this.buttons = structuredClone(b);
            this.loading.set(false);
        });
    }

    private notify(ok: boolean, text: string): void {
        this.toast.set({ ok, text });
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.toast.set(null), 5000);
    }

    reset(key: PageButtonKey): void {
        this.buttons[key] = { ...DEFAULT_PAGE_BUTTONS[key] };
    }

    save(): void {
        for (const { key, title } of this.sections) {
            const b = this.buttons[key];
            if (!b.label.trim()) return this.notify(false, `${title}: vul de tekst van de knop in.`);
            const url = normalizeButtonUrl(b.url);
            if (!url) return this.notify(false, `${title}: de link moet beginnen met https:// of een e-mailadres zijn.`);
            b.label = b.label.trim();
            b.url = url;
        }
        this.saving.set(true);
        this.service.save(this.buttons).subscribe({
            next: () => { this.saving.set(false); this.notify(true, 'Knoppen opgeslagen. Ze staan nu live op de website.'); },
            error: () => { this.saving.set(false); this.notify(false, 'Opslaan mislukt. Log opnieuw in en probeer het nog eens.'); },
        });
    }
}
