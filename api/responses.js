const { neon } = require('@neondatabase/serverless');

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        const sql = neon(process.env.DATABASE_URL);

        if (request.method === 'POST') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const surveyId = body.surveyId;
            const result = await sql`
                INSERT INTO responses (survey_id, data) 
                VALUES (${surveyId}, ${JSON.stringify(body)}) 
                RETURNING id, created_at
            `;
            return response.status(201).json({ id: result[0].id, success: true });
        }

        if (request.method === 'GET') {
            const { surveyId } = request.query;
            if (surveyId) {
                const results = await sql`SELECT * FROM responses WHERE survey_id = ${surveyId} ORDER BY created_at DESC`;
                const formatted = results.map(r => ({ _id: r.id, surveyId: r.survey_id, ...r.data, emailsSent: r.emails_sent, createdAt: r.created_at }));
                return response.status(200).json(formatted);
            }
            return response.status(400).json({ error: 'surveyId required' });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
