/** What the IP lookup (iplocate.io) tells us about a visitor. Every field can be missing. */
export interface VisitorLocation {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    company?: { name?: string; domain?: string };
    asn?: { name?: string; domain?: string; type?: string };
    privacy?: {
        is_vpn?: boolean;
        is_proxy?: boolean;
        is_tor?: boolean;
        is_hosting?: boolean;
        is_abuser?: boolean;
    };
}

export interface VisitedPage {
    url: string;
    visits: number;
    duration: number; // seconds
    firstVisit: string;
    lastVisit: string;
}

/** One visit (browser session) exactly as the API returns it. */
export interface Visitor {
    id: string;
    ip: string;
    userAgent: string;
    location: VisitorLocation | null;
    firstVisit: string;
    lastVisit: string;
    totalDurationSeconds: number;
    pagesViewed: VisitedPage[];
}

export type DeviceType = 'Mobiel' | 'Tablet' | 'Computer';

/** A visit plus the values the dashboard derives from it. */
export interface VisitorRow extends Visitor {
    name: string;
    deviceType: DeviceType;
    lastVisitDay: string;   // YYYY-MM-DD in local time, used by the date filter
    activeDays: number;     // distinct days this visitor (company or IP) was seen
    isReturning: boolean;
}

export function detectDevice(userAgent: string): DeviceType {
    const ua = (userAgent || '').toLowerCase();
    if (/ipad|tablet|playbook|silk|android(?!.*mobi)/.test(ua)) return 'Tablet';
    if (/mobi|iphone|ipod|android|blackberry|iemobile/.test(ua)) return 'Mobiel';
    return 'Computer';
}

/** Best label for who is behind a visit: the company, else the network owner, else the IP. */
export function visitorName(v: Pick<Visitor, 'ip' | 'location'>): string {
    return v.location?.company?.name || v.location?.asn?.name || v.ip || 'Onbekend';
}

/**
 * Key that decides when two visits count as "the same visitor coming back".
 * A company (or business network) is one visitor; a consumer ISP is not, so those fall back to the IP.
 */
function identityKey(v: Pick<Visitor, 'ip' | 'location'>): string {
    const loc = v.location;
    if (loc?.company?.name) return `company:${loc.company.name}`;
    if (loc?.asn?.name && loc.asn.type === 'business') return `asn:${loc.asn.name}`;
    return `ip:${v.ip}`;
}

export function dayKey(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toRows(visitors: Visitor[]): VisitorRow[] {
    const daysByIdentity = new Map<string, Set<string>>();
    for (const v of visitors) {
        const key = identityKey(v);
        const days = daysByIdentity.get(key) ?? new Set<string>();
        days.add(dayKey(v.firstVisit));
        days.add(dayKey(v.lastVisit));
        daysByIdentity.set(key, days);
    }

    return visitors.map(v => {
        const activeDays = daysByIdentity.get(identityKey(v))?.size ?? 1;
        return {
            ...v,
            name: visitorName(v),
            deviceType: detectDevice(v.userAgent),
            lastVisitDay: dayKey(v.lastVisit),
            activeDays,
            isReturning: activeDays > 1,
        };
    });
}

export function formatDuration(seconds: number): string {
    const total = Math.max(0, Math.round(seconds || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function pageLabel(path: string): string {
    return path === '/' ? 'Homepage' : path;
}
