const { neon } = require('@neondatabase/serverless');

export default async function handler(request, response) {
    // CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        const sql = neon(process.env.DATABASE_URL);

        if (request.method === 'GET') {
            const { id, company } = request.query;

            if (id) {
                const results = await sql`SELECT * FROM surveys WHERE id = ${id}`;
                if (results.length === 0) return response.status(404).json({ error: 'Survey not found' });
                
                const survey = results[0];
                const resCount = await sql`SELECT COUNT(*) FROM responses WHERE survey_id = ${id}`;
                return response.status(200).json({ ...survey, data: survey.data, responseCount: parseInt(resCount[0].count) });
            }

            if (company) {
                const results = await sql`SELECT * FROM surveys WHERE company = ${company} ORDER BY created_at DESC LIMIT 1`;
                if (results.length === 0) return response.status(404).json({ error: `No survey found for company: ${company}` });
                return response.status(200).json(results[0].data);
            }

            const surveys = await sql`SELECT * FROM surveys ORDER BY created_at DESC`;
            // Simplified for now
            const enrichedSurveys = [];
            for(let s of surveys) {
               const resCount = await sql`SELECT COUNT(*) FROM responses WHERE survey_id = ${s.id}`;
               enrichedSurveys.push({
                   _id: s.id,
                   company: s.company,
                   ...s.data,
                   createdAt: s.created_at,
                   responseCount: parseInt(resCount[0].count)
               });
            }

            return response.status(200).json(enrichedSurveys);
        }

        if (request.method === 'POST') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const company = body.company || 'Talk2';
            
            const result = await sql`
                INSERT INTO surveys (company, data) 
                VALUES (${company}, ${JSON.stringify(body)}) 
                RETURNING id, created_at
            `;
            
            return response.status(201).json({ _id: result[0].id, ...body, createdAt: result[0].created_at });
        }

        if (request.method === 'PUT') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { _id, ...update } = body;
            
            await sql`
                UPDATE surveys 
                SET data = ${JSON.stringify(update)}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${_id}
            `;
            
            return response.status(200).json({ success: true });
        }

        if (request.method === 'DELETE') {
            const { id } = request.query;
            await sql`DELETE FROM surveys WHERE id = ${id}`;
            return response.status(200).json({ success: true });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
