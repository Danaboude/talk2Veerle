const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
const { requireAdmin } = require('./_lib/auth');

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@mail.talk2.be';
const REPLY_TO = process.env.CONTACT_REPLY_TO || 'veerle@talk2.be';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Resend free plan: 100 mails per day (resets at 00:00 UTC). A few are kept back for the
// contact form and booking mails, which use the same Resend account.
const DAILY_LIMIT = Number(process.env.NEWSLETTER_DAILY_LIMIT) || 100;
const RESERVE = process.env.NEWSLETTER_RESERVE !== undefined && process.env.NEWSLETTER_RESERVE !== ''
    ? Math.max(0, Number(process.env.NEWSLETTER_RESERVE) || 0)
    : 10;
const BATCH_SIZE = 100;

// Created lazily so a missing RESEND_API_KEY only affects sending, never signing up.
function getResend() {
    if (!process.env.RESEND_API_KEY) return null;
    const { Resend } = require('resend');
    return new Resend(process.env.RESEND_API_KEY);
}

let tablesReady = false;
async function ensureTables(sql) {
    if (tablesReady) return;
    await sql`
        CREATE TABLE IF NOT EXISTS newsletter_signups (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS newsletter_campaigns (
            id SERIAL PRIMARY KEY,
            subject TEXT NOT NULL DEFAULT '',
            doc JSONB NOT NULL DEFAULT '{}'::jsonb,
            html TEXT NOT NULL DEFAULT '',
            text_body TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'draft',
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            sent_at TIMESTAMPTZ
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS newsletter_deliveries (
            id SERIAL PRIMARY KEY,
            campaign_id INTEGER,
            email TEXT NOT NULL,
            kind TEXT NOT NULL DEFAULT 'campaign',
            status TEXT NOT NULL DEFAULT 'pending',
            error TEXT,
            resend_id TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            sent_at TIMESTAMPTZ
        )
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS newsletter_deliveries_campaign_email ON newsletter_deliveries (campaign_id, email) WHERE campaign_id IS NOT NULL`;
    await sql`CREATE INDEX IF NOT EXISTS newsletter_deliveries_sent_at ON newsletter_deliveries (sent_at) WHERE status = 'sent'`;
    tablesReady = true;
}

async function getQuota(sql) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM newsletter_deliveries WHERE status = 'sent' AND sent_at >= ${start.toISOString()}`;
    const cap = Math.max(0, DAILY_LIMIT - RESERVE);
    return {
        limit: DAILY_LIMIT,
        reserve: RESERVE,
        cap,
        used: n,
        remaining: Math.max(0, cap - n),
        resetsAt: new Date(start.getTime() + 86400000).toISOString(),
    };
}

const siteUrl = (request) =>
    (process.env.SITE_URL || `https://${request.headers['x-forwarded-host'] || request.headers.host}`).replace(/\/$/, '');

function unsubToken(email) {
    return crypto.createHmac('sha256', process.env.ADMIN_JWT_SECRET || '').update(email.toLowerCase()).digest('base64url');
}
const unsubUrl = (base, email) => `${base}/api/newsletter-api?unsubscribe=${encodeURIComponent(email)}&t=${unsubToken(email)}`;

const stripScripts = (html) => String(html).replace(/<script[\s\S]*?<\/script>/gi, '');

function page(title, text) {
    return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f7f3ec;font-family:'Helvetica Neue',Arial,sans-serif;color:#1e2c20;display:flex;min-height:100vh;align-items:center;justify-content:center;">
<div style="max-width:420px;padding:32px;text-align:center;"><h1 style="font-family:Georgia,serif;font-weight:400;">${title}</h1><p style="color:#5a6e5c;line-height:1.6;">${text}</p></div></body></html>`;
}

// Sends the given delivery rows ({ id, email }) of a campaign, in batches of 100.
// Rows that are not sent (limit reached, Resend error) stay pending / become failed.
async function deliver(sql, resend, base, campaign, rows) {
    let sent = 0;
    let failed = 0;
    let lastError = null;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const chunk = rows.slice(i, i + BATCH_SIZE);
        const payload = chunk.map(r => {
            const url = unsubUrl(base, r.email);
            return {
                from: `Talk2 <${FROM_EMAIL}>`,
                to: [r.email],
                replyTo: REPLY_TO,
                subject: campaign.subject,
                html: campaign.html.split('{{unsubscribe_url}}').join(url),
                text: campaign.text_body.split('{{unsubscribe_url}}').join(url),
                headers: { 'List-Unsubscribe': `<${url}>` },
            };
        });
        const ids = chunk.map(r => r.id);
        let result;
        try {
            result = await resend.batch.send(payload);
        } catch (e) {
            result = { error: { message: e.message } };
        }
        if (result.error) {
            lastError = result.error.message || 'Versturen mislukt.';
            await sql`UPDATE newsletter_deliveries SET status = 'failed', error = ${lastError} WHERE id = ANY(${ids})`;
            failed += chunk.length;
            break; // keep the rest pending so it can be retried
        }
        const out = result.data?.data || result.data || [];
        const resendIds = chunk.map((_, idx) => out[idx]?.id || '');
        await sql`
            UPDATE newsletter_deliveries d
            SET status = 'sent', sent_at = now(), error = NULL, resend_id = NULLIF(u.rid, '')
            FROM unnest(${ids}::int[], ${resendIds}::text[]) AS u(id, rid)
            WHERE d.id = u.id
        `;
        sent += chunk.length;
    }
    return { sent, failed, error: lastError };
}

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        const sql = neon(process.env.DATABASE_URL);
        await ensureTables(sql);

        // Public: one-click unsubscribe link from the mail footer.
        if (request.method === 'GET' && request.query?.unsubscribe) {
            const email = String(request.query.unsubscribe).trim().toLowerCase();
            const token = String(request.query.t || '');
            const expected = unsubToken(email);
            const ok = token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            if (!ok) return response.status(400).send(page('Ongeldige link', 'Deze uitschrijflink is niet geldig. Antwoord gerust op de mail, dan verwijderen we je handmatig.'));
            await sql`DELETE FROM newsletter_signups WHERE email = ${email}`;
            return response.status(200).send(page('Je bent uitgeschreven', 'Je ontvangt geen nieuwsbrieven meer van Talk2. Bedankt voor je interesse!'));
        }

        if (request.method === 'POST') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;

            // ---- Admin actions -------------------------------------------------
            if (body?.action) {
                if (!requireAdmin(request, response)) return;

                if (body.action === 'saveDraft') {
                    const subject = String(body.subject || '').trim();
                    const doc = JSON.stringify(body.doc || {});
                    const id = Number(body.id) || null;
                    if (id) {
                        const rows = await sql`
                            UPDATE newsletter_campaigns SET subject = ${subject}, doc = ${doc}::jsonb, updated_at = now()
                            WHERE id = ${id} AND status = 'draft' RETURNING id`;
                        if (!rows.length) return response.status(409).json({ error: 'Dit concept bestaat niet meer of is al verstuurd.' });
                        return response.status(200).json({ id });
                    }
                    const [row] = await sql`INSERT INTO newsletter_campaigns (subject, doc) VALUES (${subject}, ${doc}::jsonb) RETURNING id`;
                    return response.status(200).json({ id: row.id });
                }

                if (body.action === 'send' || body.action === 'resume') {
                    const resend = getResend();
                    if (!resend) return response.status(500).json({ error: 'RESEND_API_KEY is nog niet ingesteld in Vercel.' });
                    const base = siteUrl(request);
                    const quota = await getQuota(sql);

                    // --- Test mail to one address (also counts for the daily limit)
                    if (body.action === 'send' && body.testTo) {
                        const to = String(body.testTo).trim().toLowerCase();
                        if (!EMAIL_RE.test(to)) return response.status(400).json({ error: 'Ongeldig test-e-mailadres.' });
                        const subject = String(body.subject || '').trim();
                        if (!subject || !body.html) return response.status(400).json({ error: 'Onderwerp en bericht zijn verplicht.' });
                        if (quota.remaining < 1) return response.status(429).json({ error: 'Daglimiet bereikt. Probeer het morgen opnieuw.', quota });
                        const [d] = await sql`INSERT INTO newsletter_deliveries (email, kind) VALUES (${to}, 'test') RETURNING id`;
                        const res = await deliver(sql, resend, base,
                            { subject: `[TEST] ${subject}`, html: stripScripts(body.html), text_body: String(body.text || '') }, [{ id: d.id, email: to }]);
                        if (res.failed) return response.status(502).json({ error: res.error, quota: await getQuota(sql) });
                        return response.status(200).json({ success: true, sent: 1, quota: await getQuota(sql) });
                    }

                    // --- Resolve (or create) the campaign
                    let campaign;
                    let targetEmails = null; // null = every pending/failed row of the campaign (resume)
                    if (body.action === 'resume') {
                        const id = Number(body.campaignId);
                        const rows = await sql`SELECT * FROM newsletter_campaigns WHERE id = ${id}`;
                        if (!rows.length) return response.status(404).json({ error: 'Campagne niet gevonden.' });
                        campaign = rows[0];
                    } else {
                        const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Number.isInteger) : [];
                        if (!ids.length) return response.status(400).json({ error: 'Selecteer eerst minstens één persoon.' });
                        const subs = await sql`SELECT email FROM newsletter_signups WHERE id = ANY(${ids})`;
                        targetEmails = subs.map(s => s.email);
                        if (!targetEmails.length) return response.status(400).json({ error: 'Geen geldige ontvangers gevonden.' });

                        const existingId = Number(body.campaignId) || null;
                        let existing = null;
                        if (existingId) {
                            const rows = await sql`SELECT * FROM newsletter_campaigns WHERE id = ${existingId}`;
                            existing = rows[0] || null;
                        }
                        if (existing && existing.status !== 'draft') {
                            campaign = existing; // already sent before: content stays exactly as it was
                        } else {
                            const subject = String(body.subject || '').trim();
                            if (!subject || !body.html) return response.status(400).json({ error: 'Onderwerp en bericht zijn verplicht.' });
                            const doc = JSON.stringify(body.doc || {});
                            const html = stripScripts(body.html);
                            const text = String(body.text || '');
                            if (existing) {
                                [campaign] = await sql`
                                    UPDATE newsletter_campaigns SET subject = ${subject}, doc = ${doc}::jsonb, html = ${html}, text_body = ${text},
                                        status = 'sent', updated_at = now() WHERE id = ${existing.id} RETURNING *`;
                            } else {
                                [campaign] = await sql`
                                    INSERT INTO newsletter_campaigns (subject, doc, html, text_body, status)
                                    VALUES (${subject}, ${doc}::jsonb, ${html}, ${text}, 'sent') RETURNING *`;
                            }
                        }

                        // Register everybody as pending first, so what does not fit today waits for tomorrow.
                        await sql`
                            INSERT INTO newsletter_deliveries (campaign_id, email, kind)
                            SELECT ${campaign.id}, e, 'campaign' FROM unnest(${targetEmails}::text[]) AS e
                            ON CONFLICT (campaign_id, email) WHERE campaign_id IS NOT NULL DO NOTHING`;
                    }

                    const todo = targetEmails
                        ? await sql`SELECT id, email FROM newsletter_deliveries WHERE campaign_id = ${campaign.id} AND status IN ('pending','failed') AND email = ANY(${targetEmails}) ORDER BY id`
                        : await sql`SELECT id, email FROM newsletter_deliveries WHERE campaign_id = ${campaign.id} AND status IN ('pending','failed') ORDER BY id`;

                    const now = todo.slice(0, quota.remaining);
                    const res = now.length ? await deliver(sql, resend, base, campaign, now) : { sent: 0, failed: 0, error: null };
                    if (res.sent) await sql`UPDATE newsletter_campaigns SET sent_at = COALESCE(sent_at, now()), updated_at = now() WHERE id = ${campaign.id}`;

                    return response.status(200).json({
                        success: !res.failed,
                        campaignId: campaign.id,
                        sent: res.sent,
                        failed: res.failed,
                        queued: todo.length - res.sent - res.failed,
                        error: res.error,
                        quota: await getQuota(sql),
                    });
                }

                return response.status(400).json({ error: 'Onbekende actie.' });
            }

            // ---- Public sign-up -------------------------------------------------
            const email = (body?.email || '').trim().toLowerCase();
            if (!email || !EMAIL_RE.test(email)) return response.status(400).json({ error: 'Invalid email' });

            const inserted = await sql`
                INSERT INTO newsletter_signups (email)
                VALUES (${email})
                ON CONFLICT (email) DO NOTHING
                RETURNING id
            `;
            return response.status(200).json({ success: true, alreadySubscribed: inserted.length === 0 });
        }

        if (request.method === 'GET') {
            if (!requireAdmin(request, response)) return;

            // One campaign with its content and per-recipient history.
            if (request.query?.campaign) {
                const id = Number(request.query.campaign);
                const rows = await sql`SELECT id, subject, doc, status, created_at, sent_at FROM newsletter_campaigns WHERE id = ${id}`;
                if (!rows.length) return response.status(404).json({ error: 'Niet gevonden.' });
                const deliveries = await sql`
                    SELECT email, status, error, sent_at FROM newsletter_deliveries
                    WHERE campaign_id = ${id} ORDER BY id`;
                return response.status(200).json({ campaign: rows[0], deliveries });
            }

            const subscribers = await sql`
                SELECT s.id, s.email, s.created_at,
                    COUNT(d.id) FILTER (WHERE d.status = 'sent')::int AS sent_count,
                    MAX(d.sent_at) FILTER (WHERE d.status = 'sent') AS last_sent_at
                FROM newsletter_signups s
                LEFT JOIN newsletter_deliveries d ON d.email = s.email AND d.kind = 'campaign'
                GROUP BY s.id ORDER BY s.created_at DESC`;
            const campaigns = await sql`
                SELECT c.id, c.subject, c.status, c.created_at, c.updated_at, c.sent_at,
                    COUNT(d.id) FILTER (WHERE d.status = 'sent')::int AS sent,
                    COUNT(d.id) FILTER (WHERE d.status = 'pending')::int AS pending,
                    COUNT(d.id) FILTER (WHERE d.status = 'failed')::int AS failed
                FROM newsletter_campaigns c
                LEFT JOIN newsletter_deliveries d ON d.campaign_id = c.id
                GROUP BY c.id ORDER BY c.updated_at DESC LIMIT 100`;
            return response.status(200).json({ subscribers, campaigns, quota: await getQuota(sql) });
        }

        if (request.method === 'DELETE') {
            if (!requireAdmin(request, response)) return;
            if (request.query?.campaign) {
                // Only drafts can be removed; sent campaigns stay as history (and count for the daily limit).
                const id = Number(request.query.campaign);
                await sql`DELETE FROM newsletter_campaigns WHERE id = ${id} AND status = 'draft'`;
                return response.status(200).json({ success: true });
            }
            const id = Number(request.query?.id);
            if (!id) return response.status(400).json({ error: 'Missing id' });
            await sql`DELETE FROM newsletter_signups WHERE id = ${id}`;
            return response.status(200).json({ success: true });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
