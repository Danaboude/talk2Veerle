const { sign, verify } = require('./_lib/auth');

// Long-lived session; every dashboard visit renews it (GET below), so active users never get logged out.
const SESSION_MS = 60 * 24 * 60 * 60 * 1000;

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') return response.status(200).end();
    // Renew: a still-valid token gets swapped for a fresh one (sliding session).
    if (request.method === 'GET') {
        const header = request.headers['authorization'] || '';
        const payload = verify(header.startsWith('Bearer ') ? header.slice(7) : null);
        if (!payload) return response.status(401).json({ error: 'Unauthorized' });
        return response.status(200).json({ success: true, token: sign({ email: payload.email, exp: Date.now() + SESSION_MS }) });
    }
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

    try {
        const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
        const { email, password } = body || {};

        const validAccounts = [
            { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
            { email: process.env.ADMIN2_EMAIL, password: process.env.ADMIN2_PASSWORD }
        ];

        const isValid = validAccounts.some(acc => acc.email && acc.password && email === acc.email && password === acc.password);
        if (!isValid) {
            return response.status(401).json({ error: 'Ongeldige inloggegevens.' });
        }

        const token = sign({ email, exp: Date.now() + SESSION_MS });
        return response.status(200).json({ success: true, token });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
