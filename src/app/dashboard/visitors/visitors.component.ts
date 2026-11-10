import {
    ChangeDetectionStrategy, Component, DestroyRef, ViewEncapsulation,
    afterNextRender, computed, effect, inject, signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import type * as Leaflet from 'leaflet';
import { VisitorsService } from '../../services/visitors.service';
import { AuthService } from '../../services/auth.service';
import { Visitor, VisitorRow, formatDuration, pageLabel, toRows } from '../../models/visitor.model';

@Component({
    selector: 'app-visitors',
    standalone: true,
    imports: [RouterLink, FormsModule, DatePipe],
    templateUrl: './visitors.component.html',
    styleUrl: './visitors.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None, // Leaflet builds its own DOM, which scoped styles cannot reach
})
export class VisitorsComponent {
    private readonly visitorsApi = inject(VisitorsService);
    private readonly auth = inject(AuthService);
    private readonly destroyRef = inject(DestroyRef);

    readonly formatDuration = formatDuration;
    readonly pageLabel = pageLabel;

    readonly rows = signal<VisitorRow[]>([]);
    readonly loading = signal(true);
    readonly loadFailed = signal(false);
    readonly dayFilter = signal('all');
    readonly selectedId = signal<string | null>(null);
    readonly toast = signal<string | null>(null);

    readonly days = computed(() => [...new Set(this.rows().map(r => r.lastVisitDay))].sort().reverse());
    readonly filtered = computed(() => {
        const day = this.dayFilter();
        return day === 'all' ? this.rows() : this.rows().filter(r => r.lastVisitDay === day);
    });
    readonly selected = computed(() => this.filtered().find(r => r.id === this.selectedId()) ?? null);

    readonly stats = computed(() => {
        const list = this.filtered();
        const totalSeconds = list.reduce((sum, r) => sum + r.totalDurationSeconds, 0);
        const views = new Map<string, number>();
        for (const r of list) for (const p of r.pagesViewed) views.set(p.url, (views.get(p.url) ?? 0) + p.visits);
        const topPage = [...views.entries()].sort((a, b) => b[1] - a[1])[0];
        return {
            visits: list.length,
            returning: list.filter(r => r.isReturning).length,
            averageTime: list.length ? formatDuration(totalSeconds / list.length) : '-',
            topPage: topPage ? pageLabel(topPage[0]) : '-',
        };
    });

    private leaflet?: typeof Leaflet;
    private map?: Leaflet.Map;
    private markerLayer?: Leaflet.LayerGroup;
    private readonly mapReady = signal(false);
    private toastTimer?: ReturnType<typeof setTimeout>;

    constructor() {
        this.auth.renew(); // keep the session alive while this page is in use
        this.load();

        afterNextRender(() => void this.initMap());
        effect(() => this.drawMarkers(this.mapReady(), this.filtered(), this.selectedId()));

        this.destroyRef.onDestroy(() => {
            clearTimeout(this.toastTimer);
            this.map?.remove();
        });
    }

    load(): void {
        this.loading.set(true);
        this.loadFailed.set(false);
        this.visitorsApi.getAll().subscribe({
            next: (visitors: Visitor[]) => {
                this.rows.set(toRows(visitors));
                this.loading.set(false);
            },
            error: () => {
                this.loadFailed.set(true);
                this.loading.set(false);
            },
        });
    }

    select(row: VisitorRow, flyTo = false): void {
        this.selectedId.set(row.id);
        if (flyTo) this.flyTo(row);
    }

    closeDetails(): void {
        this.selectedId.set(null);
    }

    hasPosition(row: VisitorRow): boolean {
        return typeof row.location?.latitude === 'number' && typeof row.location?.longitude === 'number';
    }

    delete(row: VisitorRow): void {
        if (!confirm(`Bezoek van ${row.name} verwijderen?`)) return;
        this.visitorsApi.delete(row.id).subscribe({
            next: () => {
                this.rows.update(rows => rows.filter(r => r.id !== row.id));
                this.selectedId.set(null);
                this.notify('Bezoek verwijderd.');
            },
            error: () => this.notify('Verwijderen mislukt.'),
        });
    }

    clearAll(): void {
        if (!confirm('ALLE bezoeken verwijderen? Dit kan niet ongedaan gemaakt worden.')) return;
        this.visitorsApi.deleteAll().subscribe({
            next: () => {
                this.rows.set([]);
                this.selectedId.set(null);
                this.dayFilter.set('all');
                this.notify('Alle bezoeken verwijderd.');
            },
            error: () => this.notify('Verwijderen mislukt.'),
        });
    }

    logout(): void {
        this.auth.logout();
    }

    private notify(text: string): void {
        this.toast.set(text);
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
    }

    // ===== MAP =====

    // Leaflet touches `window`, so it is only loaded in the browser, after the view exists.
    private async initMap(): Promise<void> {
        // Leaflet is CommonJS: depending on the build, its API sits on the module or on `.default`.
        const module = (await import('leaflet')) as unknown as typeof Leaflet & { default?: typeof Leaflet };
        const L = (this.leaflet = module.default ?? module);

        this.map = L.map('visitors-map', { center: [50.85, 4.35], zoom: 4, zoomControl: false });
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(this.map);
        this.markerLayer = L.layerGroup().addTo(this.map);
        this.mapReady.set(true);
    }

    private drawMarkers(ready: boolean, rows: VisitorRow[], selectedId: string | null): void {
        if (!ready || !this.leaflet || !this.map || !this.markerLayer) return;
        const L = this.leaflet;

        this.markerLayer.clearLayers();
        const located = rows.filter(r => this.hasPosition(r));
        for (const row of located) {
            const active = row.id === selectedId;
            const icon = L.divIcon({
                className: '',
                html: `<span class="vis-pin${active ? ' vis-pin--active' : ''}"></span>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            });
            L.marker([row.location!.latitude!, row.location!.longitude!], { icon })
                .on('click', () => this.select(row))
                .addTo(this.markerLayer);
        }

        if (located.length && selectedId === null) {
            const bounds = L.latLngBounds(located.map(r => [r.location!.latitude!, r.location!.longitude!] as [number, number]));
            this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        }
    }

    private flyTo(row: VisitorRow): void {
        if (!this.map || !this.hasPosition(row)) return;
        this.map.flyTo([row.location!.latitude!, row.location!.longitude!], 10, { duration: 1.2 });
    }
}
