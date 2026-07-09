const { neon } = require('@neondatabase/serverless');
const { requireAdmin } = require('./_lib/auth');

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
            const email = (body?.email || '').trim().toLowerCase();
            if (!email) return response.status(400).json({ error: 'Missing email' });

            await sql`
                INSERT INTO newsletter_signups (email)
                VALUES (${email})
                ON CONFLICT (email) DO NOTHING
            `;
            return response.status(200).json({ success: true });
        }

        if (request.method === 'GET') {
            if (!requireAdmin(request, response)) return;
            const rows = await sql`SELECT * FROM newsletter_signups ORDER BY created_at DESC`;
            return response.status(200).json(rows);
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
