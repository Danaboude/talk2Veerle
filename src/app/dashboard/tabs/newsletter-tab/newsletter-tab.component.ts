import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

interface Subscriber { id: number; email: string; created_at: string; }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
    selector: 'app-newsletter-tab',
    standalone: true,
    imports: [FormsModule, DatePipe],
    templateUrl: './newsletter-tab.component.html',
    styleUrl: './newsletter-tab.component.css',
})
export class NewsletterTabComponent implements OnInit {
    private http = inject(HttpClient);
    private readonly url = '/api/newsletter-api';

    subscribers = signal<Subscriber[]>([]);
    loading = signal(true);
    search = signal('');
    filtered = computed(() => {
        const q = this.search().trim().toLowerCase();
        return q ? this.subscribers().filter(s => s.email.includes(q)) : this.subscribers();
    });

    // Ids of the people who will receive the newsletter. New sign-ups are ticked by default.
    selected = signal<Set<number>>(new Set());
    selectedCount = computed(() => this.selected().size);
    allFilteredSelected = computed(() => this.filtered().length > 0 && this.filtered().every(s => this.selected().has(s.id)));

    subject = '';
    message = '';
    testEmail = '';
    sending = signal(false);
    confirmingSend = signal(false);
    toast = signal<{ ok: boolean; text: string } | null>(null);
    private toastTimer?: ReturnType<typeof setTimeout>;
    private confirmTimer?: ReturnType<typeof setTimeout>;

    ngOnInit(): void { this.load(); }

    private notify(ok: boolean, text: string): void {
        this.toast.set({ ok, text });
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.toast.set(null), 5000);
    }

    load(): void {
        this.loading.set(true);
        this.http.get<Subscriber[]>(this.url).subscribe({
            next: rows => {
                this.subscribers.set(rows);
                this.selected.set(new Set(rows.map(r => r.id)));
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.notify(false, 'Inschrijvingen laden mislukt. Log opnieuw in als dit blijft gebeuren.');
            },
        });
    }

    isSelected(id: number): boolean { return this.selected().has(id); }

    toggle(id: number): void {
        this.selected.update(set => {
            const next = new Set(set);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    // Selects or deselects everyone currently shown (so it also works on a search result).
    toggleAll(): void {
        const ids = this.filtered().map(s => s.id);
        const selectAll = !this.allFilteredSelected();
        this.selected.update(set => {
            const next = new Set(set);
            ids.forEach(id => (selectAll ? next.add(id) : next.delete(id)));
            return next;
        });
    }

    remove(s: Subscriber): void {
        if (!confirm(`${s.email} verwijderen uit de lijst?`)) return;
        this.http.delete(this.url, { params: { id: s.id } }).subscribe({
            next: () => {
                this.subscribers.update(list => list.filter(x => x.id !== s.id));
                this.selected.update(set => { const next = new Set(set); next.delete(s.id); return next; });
                this.notify(true, `${s.email} is verwijderd.`);
            },
            error: () => this.notify(false, 'Verwijderen mislukt.'),
        });
    }

    send(test: boolean): void {
        if (!this.subject.trim() || !this.message.trim()) {
            this.notify(false, 'Vul een onderwerp en een bericht in.');
            return;
        }
        const testTo = this.testEmail.trim();
        if (test && !EMAIL_RE.test(testTo)) {
            this.notify(false, 'Vul een geldig e-mailadres in voor de test.');
            return;
        }
        if (!test && this.selectedCount() === 0) {
            this.notify(false, 'Selecteer eerst minstens één persoon.');
            return;
        }
        // Sending to everyone needs a second click so it can't happen by accident.
        if (!test && !this.confirmingSend()) {
            this.confirmingSend.set(true);
            this.confirmTimer = setTimeout(() => this.confirmingSend.set(false), 6000);
            return;
        }
        clearTimeout(this.confirmTimer);
        this.confirmingSend.set(false);

        this.sending.set(true);
        const body: Record<string, unknown> = { action: 'send', subject: this.subject, message: this.message };
        if (test) body['testTo'] = testTo;
        else body['ids'] = [...this.selected()];
        this.http.post<{ sent: number }>(this.url, body).subscribe({
            next: res => {
                this.sending.set(false);
                this.notify(true, test ? `Testmail verstuurd naar ${testTo}.` : `Nieuwsbrief verstuurd naar ${res.sent} personen.`);
            },
            error: err => {
                this.sending.set(false);
                this.notify(false, err?.error?.error || 'Versturen mislukt. Probeer het later opnieuw.');
            },
        });
    }
}
