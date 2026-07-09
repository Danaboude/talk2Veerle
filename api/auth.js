const { sign } = require('./_lib/auth');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') return response.status(200).end();
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

    try {
        const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
        const { email, password } = body || {};

        if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
            return response.status(401).json({ error: 'Ongeldige inloggegevens.' });
        }

        const token = sign({ email, exp: Date.now() + SEVEN_DAYS_MS });
        return response.status(200).json({ success: true, token });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
