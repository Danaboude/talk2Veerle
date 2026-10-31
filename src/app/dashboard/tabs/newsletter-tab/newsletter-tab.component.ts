import { Component, ElementRef, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Block, NewsletterDoc, THEMES, Theme, newBlock, newDoc, prepareImage, renderHtml, renderText } from './newsletter-render';

interface Subscriber { id: number; email: string; created_at: string; sent_count: number; last_sent_at: string | null; }
interface Campaign { id: number; subject: string; status: 'draft' | 'sent'; created_at: string; updated_at: string; sent_at: string | null; sent: number; pending: number; failed: number; }
interface Quota { limit: number; reserve: number; cap: number; used: number; remaining: number; resetsAt: string; }
interface Delivery { email: string; status: 'pending' | 'sent' | 'failed'; error: string | null; sent_at: string | null; }
interface SendResult { campaignId?: number; sent: number; failed?: number; queued?: number; error?: string | null; quota?: Quota; }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DRAFT_KEY = 'nl-draft-v2';

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
    private readonly origin = typeof window !== 'undefined' ? window.location.origin : '';

    readonly themes = THEMES;
    readonly blockTypes: { type: Block['type']; label: string }[] = [
        { type: 'heading', label: 'Titel' }, { type: 'text', label: 'Tekst' }, { type: 'image', label: 'Afbeelding' },
        { type: 'imagetext', label: 'Foto + tekst' }, { type: 'button', label: 'Knop' }, { type: 'quote', label: 'Quote' },
        { type: 'divider', label: 'Lijn' }, { type: 'spacer', label: 'Ruimte' },
    ];
    readonly blockLabels: Record<string, string> = Object.fromEntries(this.blockTypes.map(b => [b.type, b.label]));

    // ---- data
    subscribers = signal<Subscriber[]>([]);
    campaigns = signal<Campaign[]>([]);
    quota = signal<Quota | null>(null);
    loading = signal(true);
    search = signal('');
    filtered = computed(() => {
        const q = this.search().trim().toLowerCase();
        return q ? this.subscribers().filter(s => s.email.includes(q)) : this.subscribers();
    });
    selected = signal<Set<number>>(new Set());
    selectedCount = computed(() => this.selected().size);
    allFilteredSelected = computed(() => this.filtered().length > 0 && this.filtered().every(s => this.selected().has(s.id)));

    // ---- the mail being written (plain object edited by ngModel; `rev` tells the preview to redraw)
    doc: NewsletterDoc = newDoc();
    draftId: number | null = null;
    resumeId = signal<number | null>(null);   // set when sending the rest of an earlier mail (content is locked)
    resumeSubject = signal('');
    private rev = signal(0);
    previewMode = signal<'desktop' | 'mobile'>('desktop');
    previewHtml = computed(() => { this.rev(); return renderHtml(this.doc, { preview: true }); });
    @ViewChild('frame') frame?: ElementRef<HTMLIFrameElement>;

    testEmail = '';
    sending = signal(false);
    savingDraft = signal(false);
    confirmingSend = signal(false);
    expanded = signal<number | null>(null);
    deliveries = signal<Delivery[]>([]);
    uploading = signal<string | null>(null);
    toast = signal<{ ok: boolean; text: string } | null>(null);
    private toastTimer?: ReturnType<typeof setTimeout>;
    private confirmTimer?: ReturnType<typeof setTimeout>;

    // How many of the selected people get the mail today, and how many wait for tomorrow.
    sendNow = computed(() => Math.min(this.selectedCount(), this.quota()?.remaining ?? this.selectedCount()));
    sendLater = computed(() => this.selectedCount() - this.sendNow());
    quotaPct = computed(() => { const q = this.quota(); return q && q.cap ? Math.min(100, Math.round((q.used / q.cap) * 100)) : 0; });
    resetLabel = computed(() => {
        const q = this.quota();
        if (!q) return '';
        return new Intl.DateTimeFormat('nl-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' }).format(new Date(q.resetsAt));
    });

    constructor() {
        effect(() => {
            const html = this.previewHtml();
            const mode = this.previewMode(); // redraw when the frame is re-created
            void mode;
            queueMicrotask(() => this.paint(html));
        });
    }

    ngOnInit(): void {
        this.restoreLocalDraft();
        this.load(true);
    }

    // ------------------------------------------------------------ preview + local safety copy
    private paint(html: string): void {
        const d = this.frame?.nativeElement.contentDocument;
        if (!d) return;
        const top = d.scrollingElement?.scrollTop ?? 0;
        d.open(); d.write(html); d.close();
        if (d.scrollingElement) d.scrollingElement.scrollTop = top;
    }

    changed(): void {
        this.rev.update(n => n + 1);
        this.confirmingSend.set(false);
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ doc: this.doc, draftId: this.draftId })); } catch { /* storage may be blocked */ }
    }

    private restoreLocalDraft(): void {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved?.doc?.blocks && saved?.doc?.theme) { this.doc = { ...newDoc(), ...saved.doc }; this.draftId = saved.draftId ?? null; }
        } catch { /* ignore a broken copy */ }
    }

    ngAfterViewInit(): void { setTimeout(() => this.paint(this.previewHtml())); }

    private notify(ok: boolean, text: string): void {
        this.toast.set({ ok, text });
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.toast.set(null), 6000);
    }

    private errText(err: any, fallback: string): string { return err?.error?.error || fallback; }

    // ------------------------------------------------------------ loading
    load(first = false): void {
        this.loading.set(true);
        this.http.get<{ subscribers: Subscriber[]; campaigns: Campaign[]; quota: Quota }>(this.url).subscribe({
            next: res => {
                this.subscribers.set(res.subscribers);
                this.campaigns.set(res.campaigns);
                this.quota.set(res.quota);
                this.selected.update(prev => first
                    ? new Set(res.subscribers.map(s => s.id))
                    : new Set([...prev].filter(id => res.subscribers.some(s => s.id === id))));
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.notify(false, 'Gegevens laden mislukt. Log opnieuw in als dit blijft gebeuren.');
            },
        });
    }

    // ------------------------------------------------------------ recipients
    isSelected(id: number): boolean { return this.selected().has(id); }

    toggle(id: number): void {
        this.selected.update(set => { const n = new Set(set); if (n.has(id)) n.delete(id); else n.add(id); return n; });
        this.confirmingSend.set(false);
    }

    toggleAll(): void {
        const ids = this.filtered().map(s => s.id);
        const all = !this.allFilteredSelected();
        this.selected.update(set => { const n = new Set(set); ids.forEach(id => (all ? n.add(id) : n.delete(id))); return n; });
        this.confirmingSend.set(false);
    }

    // Always applies to the whole list, not just what the search box currently shows.
    selectAll(): void { this.selected.set(new Set(this.subscribers().map(s => s.id))); this.confirmingSend.set(false); }
    selectNone(): void { this.selected.set(new Set()); this.confirmingSend.set(false); }

    selectNeverMailed(): void {
        this.selected.set(new Set(this.subscribers().filter(s => !s.sent_count).map(s => s.id)));
        this.confirmingSend.set(false);
    }

    remove(s: Subscriber): void {
        if (!confirm(`${s.email} verwijderen uit de lijst?`)) return;
        this.http.delete(this.url, { params: { id: s.id } }).subscribe({
            next: () => {
                this.subscribers.update(list => list.filter(x => x.id !== s.id));
                this.selected.update(set => { const n = new Set(set); n.delete(s.id); return n; });
                this.notify(true, `${s.email} is verwijderd.`);
            },
            error: () => this.notify(false, 'Verwijderen mislukt.'),
        });
    }

    // ------------------------------------------------------------ style + blocks
    pickTheme(t: Theme): void {
        if (this.resumeId()) return;
        this.doc.theme = structuredClone(t);
        this.changed();
    }

    resetColors(): void {
        const base = THEMES.find(t => t.id === this.doc.theme.id);
        if (base) { this.doc.theme.colors = { ...base.colors }; this.changed(); }
    }

    addBlock(type: Block['type']): void { this.doc.blocks.push(newBlock(type)); this.changed(); }

    removeBlock(i: number): void { this.doc.blocks.splice(i, 1); this.changed(); }

    moveBlock(i: number, dir: -1 | 1): void {
        const j = i + dir;
        if (j < 0 || j >= this.doc.blocks.length) return;
        [this.doc.blocks[i], this.doc.blocks[j]] = [this.doc.blocks[j], this.doc.blocks[i]];
        this.changed();
    }

    duplicateBlock(i: number): void {
        const copy = { ...structuredClone(this.doc.blocks[i]), id: Math.random().toString(36).slice(2, 9) } as Block;
        this.doc.blocks.splice(i + 1, 0, copy);
        this.changed();
    }

    async pickImage(b: Block, event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file || (b.type !== 'image' && b.type !== 'imagetext')) return;
        this.uploading.set(b.id);
        try {
            const dataUrl = await prepareImage(file, b.shape === 'circle' || b.type === 'imagetext');
            this.http.post<{ url: string }>('/api/newsletter-image', { dataUrl }).subscribe({
                next: res => { b.src = res.url; this.uploading.set(null); this.changed(); },
                error: err => { this.uploading.set(null); this.notify(false, this.errText(err, 'Uploaden mislukt.')); },
            });
        } catch (e: any) {
            this.uploading.set(null);
            this.notify(false, e?.message || 'Uploaden mislukt.');
        }
    }

    // ------------------------------------------------------------ drafts, history
    private payload() {
        return { subject: this.doc.subject.trim(), doc: this.doc, html: renderHtml(this.doc, { origin: this.origin }), text: renderText(this.doc, this.origin) };
    }

    saveDraft(): void {
        this.savingDraft.set(true);
        this.http.post<{ id: number }>(this.url, { action: 'saveDraft', id: this.draftId, subject: this.doc.subject, doc: this.doc }).subscribe({
            next: res => { this.draftId = res.id; this.savingDraft.set(false); this.changed(); this.notify(true, 'Concept opgeslagen.'); this.load(); },
            error: err => { this.savingDraft.set(false); this.notify(false, this.errText(err, 'Opslaan mislukt.')); },
        });
    }

    newMail(): void {
        if (!confirm('Een nieuwe lege mail beginnen? Wat je nu schrijft gaat verloren als het niet is opgeslagen.')) return;
        this.doc = newDoc();
        this.draftId = null;
        this.resumeId.set(null);
        this.changed();
    }

    private loadCampaign(c: Campaign, then: (doc: NewsletterDoc, deliveries: Delivery[]) => void): void {
        this.http.get<{ campaign: { doc: NewsletterDoc; subject: string }; deliveries: Delivery[] }>(this.url, { params: { campaign: c.id } }).subscribe({
            next: res => then({ ...newDoc(), ...res.campaign.doc, subject: res.campaign.subject }, res.deliveries),
            error: () => this.notify(false, 'Mail laden mislukt.'),
        });
    }

    // Opens an earlier mail in the editor as a new mail (or continues a draft).
    reuse(c: Campaign): void {
        this.loadCampaign(c, doc => {
            this.doc = doc;
            this.draftId = c.status === 'draft' ? c.id : null;
            this.resumeId.set(null);
            this.changed();
            this.notify(true, c.status === 'draft' ? 'Concept geladen.' : 'Mail geladen. Pas aan en verstuur opnieuw.');
            document.querySelector('.nl-editor')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Loads an earlier mail unchanged and ticks only the people who have not received it yet.
    selectMissing(c: Campaign): void {
        this.loadCampaign(c, (doc, deliveries) => {
            const got = new Set(deliveries.filter(d => d.status === 'sent').map(d => d.email));
            this.doc = doc;
            this.draftId = null;
            this.resumeId.set(c.id);
            this.resumeSubject.set(c.subject);
            this.selected.set(new Set(this.subscribers().filter(s => !got.has(s.email)).map(s => s.id)));
            this.changed();
            this.notify(true, `${this.selected().size} mensen hebben deze mail nog niet gekregen en zijn aangevinkt.`);
            document.querySelector('.nl-editor')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    editAsNew(): void { this.resumeId.set(null); this.draftId = null; this.changed(); }

    deleteDraft(c: Campaign): void {
        if (!confirm('Dit concept verwijderen?')) return;
        this.http.delete(this.url, { params: { campaign: c.id } }).subscribe({
            next: () => { if (this.draftId === c.id) this.draftId = null; this.load(); },
            error: () => this.notify(false, 'Verwijderen mislukt.'),
        });
    }

    toggleDetails(c: Campaign): void {
        if (this.expanded() === c.id) { this.expanded.set(null); return; }
        this.expanded.set(c.id);
        this.deliveries.set([]);
        this.loadCampaign(c, (_doc, d) => this.deliveries.set(d));
    }

    // Sends what is still waiting (queued or failed) for an earlier mail, as far as today's limit allows.
    sendRest(c: Campaign): void {
        if (this.sending()) return;
        this.sending.set(true);
        this.http.post<SendResult>(this.url, { action: 'resume', campaignId: c.id }).subscribe({
            next: res => this.afterSend(res, false),
            error: err => this.failSend(err),
        });
    }

    // ------------------------------------------------------------ sending
    send(test: boolean): void {
        if (!this.doc.subject.trim()) { this.notify(false, 'Vul een onderwerp in.'); return; }
        if (!this.doc.blocks.length) { this.notify(false, 'Voeg minstens één blok toe.'); return; }
        const testTo = this.testEmail.trim();
        if (test && !EMAIL_RE.test(testTo)) { this.notify(false, 'Vul een geldig e-mailadres in voor de test.'); return; }
        if (!test && this.selectedCount() === 0) { this.notify(false, 'Selecteer eerst minstens één persoon.'); return; }
        if (!test && this.quota() && this.quota()!.remaining < 1) { this.notify(false, 'De daglimiet is bereikt. De selectie wordt morgen verstuurd met "Verstuur rest".'); }
        if (!test && !this.confirmingSend()) {
            this.confirmingSend.set(true);
            this.confirmTimer = setTimeout(() => this.confirmingSend.set(false), 8000);
            return;
        }
        clearTimeout(this.confirmTimer);
        this.confirmingSend.set(false);

        this.sending.set(true);
        const body: Record<string, unknown> = { action: 'send', ...this.payload(), campaignId: this.resumeId() ?? this.draftId };
        if (test) body['testTo'] = testTo; else body['ids'] = [...this.selected()];
        this.http.post<SendResult>(this.url, body).subscribe({
            next: res => this.afterSend(res, test, testTo),
            error: err => this.failSend(err),
        });
    }

    private afterSend(res: SendResult, test: boolean, testTo = ''): void {
        this.sending.set(false);
        if (res.quota) this.quota.set(res.quota);
        if (test) { this.notify(true, `Testmail verstuurd naar ${testTo}.`); return; }
        if (res.campaignId) { this.draftId = null; this.resumeId.set(null); this.changed(); }
        const parts = [`${res.sent} verstuurd`];
        if (res.queued) parts.push(`${res.queued} wachten tot morgen`);
        if (res.failed) parts.push(`${res.failed} mislukt${res.error ? ` (${res.error})` : ''}`);
        this.notify(!res.failed, parts.join(', ') + '.');
        this.load();
    }

    private failSend(err: any): void {
        this.sending.set(false);
        if (err?.error?.quota) this.quota.set(err.error.quota);
        this.notify(false, this.errText(err, 'Versturen mislukt. Probeer het later opnieuw.'));
    }
}
