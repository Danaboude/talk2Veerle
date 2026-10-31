const { neon } = require('@neondatabase/serverless');
const { Resend } = require('resend');
const { requireAdmin } = require('./_lib/auth');

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@mail.talk2.be';
const NOTIFY_EMAIL = process.env.CONTACT_NOTIFY_EMAIL || 'veerlefollens@hotmail.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        const sql = neon(process.env.DATABASE_URL);

        await sql`
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id SERIAL PRIMARY KEY,
                naam TEXT NOT NULL,
                email TEXT NOT NULL,
                telefoon TEXT DEFAULT '',
                bericht TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        if (request.method === 'POST') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { naam, email, telefoon, bericht } = body || {};
            if (!naam || !email || !bericht) {
                return response.status(400).json({ error: 'Missing required fields' });
            }
            if (!EMAIL_RE.test(String(email).trim())) {
                return response.status(400).json({ error: 'Invalid email address' });
            }

            await sql`
                INSERT INTO contact_submissions (naam, email, telefoon, bericht)
                VALUES (${naam}, ${email}, ${telefoon || ''}, ${bericht})
            `;

            // Best-effort notification email to Ive  a failure here shouldn't fail the submission.
            try {
                // Created here (not at module load) so a missing RESEND_API_KEY can't crash the whole endpoint.
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: `Talk2 Contactformulier <${FROM_EMAIL}>`,
                    to: [NOTIFY_EMAIL],
                    replyTo: email,
                    subject: `Nieuw bericht via het contactformulier van ${naam}`,
                    text: `Naam: ${naam}\nE-mail: ${email}\nTelefoon: ${telefoon || '-'}\n\n${bericht}`,
                });
            } catch (emailErr) {
                console.error('Contact notification email failed', emailErr);
            }

            return response.status(201).json({ success: true });
        }

        if (request.method === 'GET') {
            if (!requireAdmin(request, response)) return;
            const rows = await sql`SELECT * FROM contact_submissions ORDER BY created_at DESC`;
            return response.status(200).json(rows);
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
