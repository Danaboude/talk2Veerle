const { neon } = require('@neondatabase/serverless');
const { requireAdmin } = require('./_lib/auth');

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') return response.status(200).end();

    // Public reads are limited to "published offerings for one audience" (what the
    // aanbod page needs); anything broader (the dashboard's full list) is admin-only.
    const isPublicFilteredRead = request.method === 'GET' && request.query.audience && request.query.published === 'true';
    if (!isPublicFilteredRead && !requireAdmin(request, response)) return;

    try {
        const sql = neon(process.env.DATABASE_URL);

        await sql`
            CREATE TABLE IF NOT EXISTS offerings (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT '',
                intro TEXT DEFAULT '',
                description TEXT DEFAULT '',
                event_date TEXT DEFAULT '',
                location TEXT DEFAULT '',
                price TEXT DEFAULT '',
                contact_link TEXT DEFAULT '',
                audience TEXT NOT NULL DEFAULT 'individuen',
                published BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        if (request.method === 'GET') {
            const { audience, published } = request.query;

            if (audience && published === 'true') {
                const rows = await sql`
                    SELECT * FROM offerings
                    WHERE audience = ${audience} AND published = true
                    ORDER BY created_at DESC
                `;
                return response.status(200).json(rows);
            }

            const rows = await sql`SELECT * FROM offerings ORDER BY created_at DESC`;
            return response.status(200).json(rows);
        }

        if (request.method === 'PUT') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const {
                id, title, intro, description, eventDate, location,
                price, contactLink, audience, published,
            } = body;

            await sql`
                INSERT INTO offerings (
                    id, title, intro, description, event_date, location,
                    price, contact_link, audience, published
                )
                VALUES (
                    ${id}, ${title || ''}, ${intro || ''}, ${description || ''},
                    ${eventDate || ''}, ${location || ''}, ${price || ''},
                    ${contactLink || ''}, ${audience || 'individuen'}, ${!!published}
                )
                ON CONFLICT (id) DO UPDATE
                SET title = EXCLUDED.title,
                    intro = EXCLUDED.intro,
                    description = EXCLUDED.description,
                    event_date = EXCLUDED.event_date,
                    location = EXCLUDED.location,
                    price = EXCLUDED.price,
                    contact_link = EXCLUDED.contact_link,
                    audience = EXCLUDED.audience,
                    published = EXCLUDED.published,
                    updated_at = CURRENT_TIMESTAMP
            `;
            return response.status(200).json({ success: true });
        }

        if (request.method === 'DELETE') {
            const { id } = request.query;
            if (!id) return response.status(400).json({ error: 'Missing id' });
            await sql`DELETE FROM offerings WHERE id = ${id}`;
            return response.status(200).json({ success: true });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
