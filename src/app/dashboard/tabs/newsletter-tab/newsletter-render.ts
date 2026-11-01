// Turns the newsletter document (style + blocks) into email-safe HTML and a plain-text version.
// Used for the live preview and for the final send, so what you see is what people receive.

export type Shape = 'square' | 'rounded' | 'circle';
export type Align = 'left' | 'center' | 'right';

export interface ThemeColors {
    outer: string;   // page background behind the card
    card: string;    // the mail itself
    header: string;  // top band
    accent: string;  // buttons, lines, quote bar
    text: string;    // body text and headings
}

export interface Theme {
    id: string;
    label: string;
    font: 'serif' | 'sans';
    header: 'band' | 'center' | 'none';
    radius: number;  // corner radius of the card
    colors: ThemeColors;
}

export type Block =
    | { id: string; type: 'heading'; text: string; align: Align; size: 'm' | 'l' }
    | { id: string; type: 'text'; text: string; align: Align }
    | { id: string; type: 'image'; src: string; alt: string; caption: string; link: string; widthPct: number; heightPx: number; width?: string; shape: Shape; shadow: boolean; border: boolean; align: Align }
    | { id: string; type: 'imagetext'; src: string; alt: string; heading: string; text: string; side: 'left' | 'right'; size: number; shape: Shape; shadow: boolean; border: boolean }
    | { id: string; type: 'button'; label: string; url: string; align: Align; shape: Shape }
    | { id: string; type: 'quote'; text: string; author: string }
    | { id: string; type: 'divider' }
    | { id: string; type: 'spacer'; height: number };

export interface NewsletterDoc {
    subject: string;
    preheader: string;
    brand: string;
    theme: Theme;
    blocks: Block[];
}

// Shared footer: one setting used under every mail (saved in the dashboard, not per mail).
export interface Footer { text: string; email: string; phone: string; address: string; }

export const DEFAULT_FOOTER: Footer = {
    text: 'Je ontvangt deze mail omdat je je inschreef voor nieuws van Talk2.',
    email: 'veerle@talk2.be',
    phone: '+32 473 564 186',
    address: 'Frans Blocklaan 14, 2620 Hemiksem',
};

export const THEMES: Theme[] = [
    { id: 'klassiek', label: 'Klassiek', font: 'serif', header: 'band', radius: 0,
      colors: { outer: '#f7f3ec', card: '#fefdfb', header: '#1e3520', accent: '#4a7550', text: '#33473a' } },
    { id: 'modern', label: 'Modern', font: 'sans', header: 'none', radius: 14,
      colors: { outer: '#eef2f0', card: '#ffffff', header: '#ffffff', accent: '#2f7d5b', text: '#1f2a24' } },
    { id: 'warm', label: 'Warm', font: 'serif', header: 'center', radius: 18,
      colors: { outer: '#f6e9df', card: '#fffaf5', header: '#fffaf5', accent: '#c4673e', text: '#4a3328' } },
    { id: 'minimaal', label: 'Minimaal', font: 'sans', header: 'center', radius: 0,
      colors: { outer: '#ffffff', card: '#ffffff', header: '#ffffff', accent: '#111111', text: '#222222' } },
    { id: 'elegant', label: 'Elegant', font: 'serif', header: 'band', radius: 6,
      colors: { outer: '#17201a', card: '#fbf8f1', header: '#0f1a13', accent: '#b8924a', text: '#2b2f2a' } },
];

const uid = () => Math.random().toString(36).slice(2, 9);

export function newBlock(type: Block['type']): Block {
    const id = uid();
    switch (type) {
        case 'heading': return { id, type, text: 'Nieuwe titel', align: 'left', size: 'm' };
        case 'text': return { id, type, text: 'Schrijf hier je tekst. Een lege regel maakt een nieuwe alinea.', align: 'left' };
        case 'image': return { id, type, src: '', alt: '', caption: '', link: '', widthPct: 100, heightPx: 0, shape: 'rounded', shadow: false, border: false, align: 'center' };
        case 'imagetext': return { id, type, src: '', alt: '', heading: 'Titel', text: 'Korte tekst naast de foto.', side: 'left', size: 160, shape: 'circle', shadow: true, border: false };
        case 'button': return { id, type, label: 'Lees meer', url: 'https://', align: 'center', shape: 'rounded' };
        case 'quote': return { id, type, text: 'Een mooie quote of ervaring.', author: '' };
        case 'divider': return { id, type };
        case 'spacer': return { id, type, height: 24 };
    }
}

export function startBlocks(themeId: string): Block[] {
    const b = (type: Block['type'], patch: Partial<Block> = {}) => ({ ...newBlock(type), ...patch }) as Block;
    const hello = b('text', { text: 'Hallo,\n\nSchrijf hier je nieuws. Een lege regel maakt een nieuwe alinea.' });
    switch (themeId) {
        case 'modern': return [b('heading', { text: 'Wat is er nieuw?', size: 'l' }), hello, b('image'), b('button')];
        case 'warm': return [b('heading', { text: 'Een warme groet', align: 'center', size: 'l' }), hello, b('imagetext'), b('button')];
        case 'minimaal': return [hello, b('button', { shape: 'square', align: 'left' })];
        case 'elegant': return [b('heading', { text: 'Nieuws van Talk2', align: 'center', size: 'l' }), b('divider'), hello, b('quote'), b('button')];
        default: return [b('heading', { text: 'Nieuws van Talk2' }), hello, b('image'), b('button')];
    }
}

export function newDoc(themeId = 'klassiek'): NewsletterDoc {
    const theme = structuredClone(THEMES.find(t => t.id === themeId) ?? THEMES[0]);
    return { subject: '', preheader: '', brand: 'Talk2', theme, blocks: startBlocks(theme.id) };
}

// ---------------------------------------------------------------- helpers

const esc = (t: string) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nl2br = (t: string) => esc(t).replace(/\n/g, '<br>');

function lum(hex: string): number {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return 0;
    const n = parseInt(m[1], 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}
const onColor = (bg: string) => (lum(bg) > 0.62 ? '#1e2c20' : '#ffffff');

function mix(a: string, b: string, t: number): string {
    const p = (h: string) => { const n = parseInt(h.replace('#', ''), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
    const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
    return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

const safeUrl = (u: string, origin: string) => {
    const v = (u || '').trim();
    if (/^\/api\//.test(v)) return origin + v; // pictures we host ourselves
    return /^(https?:|mailto:)/i.test(v) ? v : '';
};

const CONTENT_W = 528; // 600px card minus 2 x 36px padding
const WIDTHS = { full: 1, large: 0.75, medium: 0.5, small: 0.3 } as const;
const radiusOf = (s: Shape, circle = '50%') => (s === 'circle' ? circle : s === 'rounded' ? '14px' : '0');

function imgStyle(shape: Shape, shadow: boolean, border: boolean, accent: string): string {
    return [
        'display:block', 'border:0', 'outline:none',
        `border-radius:${radiusOf(shape)}`,
        shadow ? 'box-shadow:0 8px 22px rgba(0,0,0,0.22)' : '',
        border ? `border:4px solid ${accent}` : '',
    ].filter(Boolean).join(';');
}

// ---------------------------------------------------------------- HTML

export function renderHtml(doc: NewsletterDoc, opts: { origin?: string; preview?: boolean; footer?: Footer } = {}): string {
    const origin = opts.origin ?? '';
    const t = doc.theme;
    const c = t.colors;
    const font = t.font === 'serif' ? "Georgia,'Times New Roman',serif" : "'Helvetica Neue',Helvetica,Arial,sans-serif";
    const body = "'Helvetica Neue',Helvetica,Arial,sans-serif";
    const muted = mix(c.text, c.card, 0.45);
    const line = mix(c.text, c.card, 0.82);
    const headerText = onColor(c.header);
    const accentText = onColor(c.accent);

    const blocks = doc.blocks.map(b => {
        switch (b.type) {
            case 'heading':
                return `<tr><td style="padding:0 36px 14px;text-align:${b.align};font-family:${font};font-size:${b.size === 'l' ? 32 : 24}px;line-height:1.25;font-weight:normal;color:${c.text};">${nl2br(b.text)}</td></tr>`;
            case 'text': {
                const ps = b.text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
                    .map(p => `<p style="margin:0 0 16px;font-family:${body};font-size:16px;line-height:1.7;color:${c.text};text-align:${b.align};">${nl2br(p)}</p>`).join('');
                return `<tr><td style="padding:0 36px;">${ps}</td></tr>`;
            }
            case 'image': {
                const src = safeUrl(b.src, origin);
                if (!src) return opts.preview ? `<tr><td style="padding:0 36px 16px;"><div style="border:2px dashed ${line};padding:28px;text-align:center;color:${muted};font:14px ${body};">Kies een afbeelding</div></td></tr>` : '';
                const pct = b.widthPct ?? Math.round((WIDTHS[b.width as keyof typeof WIDTHS] ?? 1) * 100);
                const px = Math.max(40, Math.round(CONTENT_W * pct / 100));
                const h = b.heightPx > 0 ? b.heightPx : (b.shape === 'circle' ? px : 0);
                const dims = h ? `width="${px}" height="${h}" style="${imgStyle(b.shape, b.shadow, b.border, c.accent)};width:100%;max-width:${px}px;height:${h}px;object-fit:cover;"`
                    : `width="${px}" style="${imgStyle(b.shape, b.shadow, b.border, c.accent)};width:100%;max-width:${px}px;height:auto;"`;
                let img = `<img src="${esc(src)}" alt="${esc(b.alt)}" ${dims}>`;
                const link = safeUrl(b.link, origin);
                if (link) img = `<a href="${esc(link)}" style="text-decoration:none;">${img}</a>`;
                const cap = b.caption ? `<p style="margin:10px 0 0;font-family:${body};font-size:13px;color:${muted};text-align:${b.align};">${esc(b.caption)}</p>` : '';
                const margin = b.align === 'center' ? '0 auto' : b.align === 'right' ? '0 0 0 auto' : '0';
                return `<tr><td style="padding:0 36px 18px;overflow:hidden;"><div style="width:100%;max-width:${px}px;margin:${margin};">${img}${cap}</div></td></tr>`;
            }
            case 'imagetext': {
                const src = safeUrl(b.src, origin);
                const px = Math.max(60, Math.min(300, b.size || 160));
                if (!src && !opts.preview) return `<tr><td style="padding:0 36px 20px;font-family:${body};font-size:16px;line-height:1.7;color:${c.text};">${b.heading ? `<p style="margin:0 0 8px;font-family:${font};font-size:22px;">${esc(b.heading)}</p>` : ''}<p style="margin:0;">${nl2br(b.text)}</p></td></tr>`;
                const pic = src
                    ? `<img src="${esc(src)}" alt="${esc(b.alt)}" width="${px}" height="${px}" style="${imgStyle(b.shape, b.shadow, b.border, c.accent)};width:${px}px;height:${px}px;object-fit:cover;">`
                    : `<div style="width:${px}px;height:${px}px;border:2px dashed ${line};border-radius:${radiusOf(b.shape)};color:${muted};font:13px ${body};text-align:center;line-height:${px}px;">Foto</div>`;
                const copy = `${b.heading ? `<p style="margin:0 0 8px;font-family:${font};font-size:22px;line-height:1.3;color:${c.text};">${esc(b.heading)}</p>` : ''}<p style="margin:0;font-family:${body};font-size:16px;line-height:1.7;color:${c.text};">${nl2br(b.text)}</p>`;
                const picCell = `<td class="nl-stack" width="${px}" valign="top" style="padding:${b.side === 'left' ? '0 22px 0 0' : '0 0 0 22px'};">${pic}</td>`;
                const textCell = `<td class="nl-stack" valign="middle">${copy}</td>`;
                return `<tr><td style="padding:0 36px 20px;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>${b.side === 'left' ? picCell + textCell : textCell + picCell}</tr></table></td></tr>`;
            }
            case 'button': {
                const url = safeUrl(b.url, origin) || '#';
                const r = radiusOf(b.shape, '999px');
                return `<tr><td align="${b.align}" style="padding:6px 36px 22px;"><a href="${esc(url)}" style="display:inline-block;background:${c.accent};color:${accentText};font-family:${body};font-size:15px;font-weight:bold;text-decoration:none;padding:14px 30px;border-radius:${r};">${esc(b.label)}</a></td></tr>`;
            }
            case 'quote':
                return `<tr><td style="padding:4px 36px 22px;"><div style="border-left:4px solid ${c.accent};padding:4px 0 4px 18px;"><p style="margin:0;font-family:${font};font-size:20px;line-height:1.5;font-style:italic;color:${c.text};">${nl2br(b.text)}</p>${b.author ? `<p style="margin:8px 0 0;font-family:${body};font-size:13px;color:${muted};">${esc(b.author)}</p>` : ''}</div></td></tr>`;
            case 'divider':
                return `<tr><td style="padding:8px 36px 22px;"><div style="height:2px;background:${c.accent};opacity:0.35;width:100%;line-height:2px;font-size:2px;">&nbsp;</div></td></tr>`;
            case 'spacer':
                return `<tr><td style="height:${Math.max(4, Math.min(120, b.height))}px;line-height:${b.height}px;font-size:1px;">&nbsp;</td></tr>`;
        }
    }).join('');

    const brand = esc(doc.brand);
    const f = opts.footer ?? DEFAULT_FOOTER;
    const contact = [
        f.email.trim() && `<a href="mailto:${esc(f.email.trim())}" style="color:${muted};text-decoration:none;">${esc(f.email.trim())}</a>`,
        f.phone.trim() && `<a href="tel:${esc(f.phone.replace(/[^+\d]/g, ''))}" style="color:${muted};text-decoration:none;">${esc(f.phone.trim())}</a>`,
        f.address.trim() && esc(f.address.trim()),
    ].filter(Boolean);
    const footerLines = (f.text.trim() ? `${nl2br(f.text.trim())}<br>` : '') + (contact.length ? `${contact.join('<br>')}<br>` : '');
    const header = t.header === 'band'
        ? `<tr><td style="background:${c.header};padding:26px 36px;border-radius:${t.radius}px ${t.radius}px 0 0;"><p style="margin:0;font-family:${font};font-size:24px;color:${headerText};">${brand}</p></td></tr>`
        : t.header === 'center'
            ? `<tr><td align="center" style="padding:32px 36px 8px;"><p style="margin:0;font-family:${font};font-size:24px;letter-spacing:0.04em;color:${c.text};">${brand}</p><div style="width:40px;height:3px;background:${c.accent};margin:14px auto 0;line-height:3px;font-size:3px;">&nbsp;</div></td></tr>`
            : '';

    const pre = doc.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(doc.preheader)}</div>` : '';

    return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(doc.subject)}</title>
<style>img{max-width:100%;}@media (max-width:620px){.nl-stack{display:block!important;width:100%!important;padding:0 0 14px!important;}.nl-stack img{margin:0 auto;}}${opts.preview ? 'a{pointer-events:none}' : ''}</style></head>
<body style="margin:0;padding:0;background:${c.outer};">${pre}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${c.outer};"><tr><td align="center" style="padding:28px 12px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;table-layout:fixed;background:${c.card};border-radius:${t.radius}px;">
${header}
<tr><td style="height:${t.header === 'none' ? 36 : 28}px;line-height:1px;font-size:1px;">&nbsp;</td></tr>
${blocks}
<tr><td style="padding:14px 36px 28px;"><div style="border-top:1px solid ${line};padding-top:16px;font-family:${body};font-size:12px;line-height:1.7;color:${muted};text-align:center;">${footerLines}<a href="${opts.preview ? '#' : '{{unsubscribe_url}}'}" style="color:${muted};">Uitschrijven</a></div></td></tr>
</table></td></tr></table></body></html>`;
}

// ---------------------------------------------------------------- plain text

export function renderText(doc: NewsletterDoc, origin = '', footer: Footer = DEFAULT_FOOTER): string {
    const parts = doc.blocks.map(b => {
        switch (b.type) {
            case 'heading': return b.text.toUpperCase();
            case 'text': return b.text.trim();
            case 'image': return b.caption || '';
            case 'imagetext': return [b.heading, b.text].filter(Boolean).join('\n');
            case 'button': return `${b.label}: ${safeUrl(b.url, origin)}`;
            case 'quote': return `"${b.text}"${b.author ? ` - ${b.author}` : ''}`;
            default: return '';
        }
    }).filter(Boolean);
    const foot = [footer.text.trim(), footer.email.trim(), footer.phone.trim(), footer.address.trim()].filter(Boolean);
    return `${parts.join('\n\n')}\n\n--\n${foot.length ? foot.join('\n') + '\n' : ''}Uitschrijven: {{unsubscribe_url}}`;
}

// ---------------------------------------------------------------- images

// Shrinks a picked picture in the browser (max 1200px, JPEG) so it uploads fast and loads fast in a mail.
// For circles the picture is cropped to a centred square so it isn't squashed.
export function prepareImage(file: File, square: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const max = 1200;
            let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
            if (square) {
                const s = Math.min(sw, sh);
                sx = (sw - s) / 2; sy = (sh - s) / 2; sw = sh = s;
            }
            const scale = Math.min(1, max / Math.max(sw, sh));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(sw * scale);
            canvas.height = Math.round(sh * scale);
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Afbeelding kan niet gelezen worden.')); };
        img.src = url;
    });
}

// Older saved mails miss newer fields; fill them in so the editor sliders work.
export function fixDoc(doc: NewsletterDoc): NewsletterDoc {
    for (const b of doc.blocks) {
        if (b.type === 'image') {
            if (b.widthPct == null) b.widthPct = Math.round((WIDTHS[b.width as keyof typeof WIDTHS] ?? 1) * 100);
            if (b.heightPx == null) b.heightPx = 0;
        }
        if (b.type === 'imagetext' && !b.size) b.size = 160;
    }
    return doc;
}
