const { neon } = require('@neondatabase/serverless');
const { requireAdmin } = require('./_lib/auth');

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') return response.status(200).end();
    if (request.method !== 'GET' && !requireAdmin(request, response)) return;

    try {
        const sql = neon(process.env.DATABASE_URL);

        await sql`
            CREATE TABLE IF NOT EXISTS site_content (
                key TEXT PRIMARY KEY,
                value TEXT DEFAULT '',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        if (request.method === 'GET') {
            const { key } = request.query;
            if (!key) return response.status(400).json({ error: 'Missing key' });
            const rows = await sql`SELECT * FROM site_content WHERE key = ${key}`;
            return response.status(200).json(rows[0] || null);
        }

        if (request.method === 'PUT') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { key, value } = body;
            if (!key) return response.status(400).json({ error: 'Missing key' });

            await sql`
                INSERT INTO site_content (key, value)
                VALUES (${key}, ${value || ''})
                ON CONFLICT (key) DO UPDATE
                SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
            `;
            return response.status(200).json({ success: true });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
