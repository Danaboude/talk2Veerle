const { neon } = require('@neondatabase/serverless');

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        const sql = neon(process.env.DATABASE_URL);

        // Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS email_templates (
                id TEXT PRIMARY KEY,
                label TEXT NOT NULL DEFAULT '',
                subject TEXT DEFAULT '',
                body TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Migrate: add missing columns if table already existed without them
        await sql`ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT ''`;
        await sql`ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT ''`;
        await sql`ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS body TEXT DEFAULT ''`;
        await sql`ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
        await sql`ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;

        if (request.method === 'GET') {
            const templates = await sql`SELECT * FROM email_templates ORDER BY created_at ASC`;
            return response.status(200).json(templates);
        }

        if (request.method === 'PUT') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { id, label, subject, body: tmplBody } = body;

            await sql`
                INSERT INTO email_templates (id, label, subject, body)
                VALUES (${id}, ${label}, ${subject || ''}, ${tmplBody || ''})
                ON CONFLICT (id) DO UPDATE
                SET label = EXCLUDED.label,
                    subject = EXCLUDED.subject,
                    body = EXCLUDED.body,
                    updated_at = CURRENT_TIMESTAMP
            `;
            return response.status(200).json({ success: true });
        }

        if (request.method === 'DELETE') {
            const { id } = request.query;
            if (!id) return response.status(400).json({ error: 'Missing id' });
            await sql`DELETE FROM email_templates WHERE id = ${id}`;
            return response.status(200).json({ success: true });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
