const { neon } = require('@neondatabase/serverless');
const { requireAdmin } = require('./_lib/auth');

const MAX_BYTES = 2_500_000; // the dashboard already shrinks pictures to ~200 KB
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/;

// Newsletter pictures. Mail clients can't load images from inside an email, so they are stored
// in the database and served from a public URL (GET ?id=). Uploading needs the admin token.
export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        const sql = neon(process.env.DATABASE_URL);
        await sql`
            CREATE TABLE IF NOT EXISTS newsletter_images (
                id SERIAL PRIMARY KEY,
                mime TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT now()
            )
        `;

        if (request.method === 'GET') {
            const id = Number(request.query?.id);
            if (!id) return response.status(400).end();
            const rows = await sql`SELECT mime, data FROM newsletter_images WHERE id = ${id}`;
            if (!rows.length) return response.status(404).end();
            response.setHeader('Content-Type', rows[0].mime);
            response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return response.status(200).send(Buffer.from(rows[0].data, 'base64'));
        }

        if (request.method === 'POST') {
            if (!requireAdmin(request, response)) return;
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const match = DATA_URL_RE.exec(String(body?.dataUrl || ''));
            if (!match) return response.status(400).json({ error: 'Alleen jpg, png, webp of gif.' });
            if (match[2].length * 0.75 > MAX_BYTES) return response.status(413).json({ error: 'Afbeelding is te groot.' });
            const [row] = await sql`INSERT INTO newsletter_images (mime, data) VALUES (${match[1]}, ${match[2]}) RETURNING id`;
            return response.status(200).json({ id: row.id, url: `/api/newsletter-image?id=${row.id}` });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
