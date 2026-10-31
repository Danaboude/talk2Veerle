const { neon } = require('@neondatabase/serverless');
const { requireAdmin } = require('./_lib/auth');

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@talk2.be';
const REPLY_TO = process.env.CONTACT_REPLY_TO || 'veerle@talk2.be';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const escapeHtml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildHtml(subject, message) {
    const paragraphs = String(message).split(/\n\n+/).map(p => p.trim()).filter(Boolean)
        .map(p => `<p style="margin:0 0 18px;color:#5a6e5c;font-size:16px;line-height:1.7;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
    return `<!DOCTYPE html><html lang="nl"><body style="margin:0;padding:24px 12px;background:#f7f3ec;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="100%" style="max-width:600px;background:#fefdfb;border:1px solid #cce3cc;">
<tr><td style="background:#1e3520;padding:24px 36px;"><p style="margin:0;font-family:Georgia,serif;font-size:22px;color:#fff;">Talk2</p>
<p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(subject)}</p></td></tr>
<tr><td style="padding:36px;">${paragraphs}</td></tr>
<tr><td style="padding:18px 36px;border-top:1px solid #cce3cc;font-size:12px;color:#8a9a8c;">Je ontvangt deze mail omdat je je inschreef voor nieuws van Talk2. Wil je geen mails meer? Antwoord gewoon op deze mail.</td></tr>
</table></td></tr></table></body></html>`;
}

// Created lazily so a missing RESEND_API_KEY only affects sending, never signing up.
function getResend() {
    if (!process.env.RESEND_API_KEY) return null;
    const { Resend } = require('resend');
    return new Resend(process.env.RESEND_API_KEY);
}

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        const sql = neon(process.env.DATABASE_URL);

        await sql`
            CREATE TABLE IF NOT EXISTS newsletter_signups (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        if (request.method === 'POST') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;

            // Admin action: send a newsletter to everyone (or a test to one address).
            if (body?.action === 'send') {
                if (!requireAdmin(request, response)) return;
                const subject = (body.subject || '').trim();
                const message = (body.message || '').trim();
                if (!subject || !message) return response.status(400).json({ error: 'Onderwerp en bericht zijn verplicht.' });

                const resend = getResend();
                if (!resend) return response.status(500).json({ error: 'RESEND_API_KEY is nog niet ingesteld in Vercel.' });

                let recipients;
                if (body.testTo) {
                    if (!EMAIL_RE.test(String(body.testTo).trim())) return response.status(400).json({ error: 'Ongeldig test-e-mailadres.' });
                    recipients = [String(body.testTo).trim()];
                } else {
                    recipients = (await sql`SELECT email FROM newsletter_signups`).map(r => r.email);
                }
                if (!recipients.length) return response.status(400).json({ error: 'Er zijn nog geen inschrijvingen.' });

                const html = buildHtml(subject, message);
                let sent = 0;
                // One separate mail per person (nobody sees the other addresses), max 100 per batch.
                for (let i = 0; i < recipients.length; i += 100) {
                    const chunk = recipients.slice(i, i + 100).map(to => ({
                        from: `Talk2 <${FROM_EMAIL}>`, to: [to], replyTo: REPLY_TO, subject, html, text: message,
                    }));
                    const { error } = await resend.batch.send(chunk);
                    if (error) return response.status(502).json({ error: error.message || 'Versturen mislukt.', sent });
                    sent += chunk.length;
                }
                return response.status(200).json({ success: true, sent });
            }

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
            const rows = await sql`SELECT * FROM newsletter_signups ORDER BY created_at DESC`;
            return response.status(200).json(rows);
        }

        if (request.method === 'DELETE') {
            if (!requireAdmin(request, response)) return;
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
