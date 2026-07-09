const { requireAdmin } = require('./_lib/auth');

// Cal.com API v1 was decommissioned — this proxies API v2, which uses Bearer auth
// plus a per-endpoint cal-api-version header instead of an ?apiKey= query param.
const baseUrl = 'https://api.cal.com/v2';

function calHeaders(apiVersion, extra) {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CAL_API_KEY}`,
        'cal-api-version': apiVersion,
        ...extra,
    };
}

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') return response.status(200).end();
    if (!requireAdmin(request, response)) return;

    try {
        if (request.method === 'GET') {
            if (request.query.endpoint === 'event-types') {
                const res = await fetch(`${baseUrl}/event-types`, { headers: calHeaders('2024-06-14') });
                const data = await res.json();
                return response.status(res.status).json(data);
            }

            if (request.query.endpoint === 'bookings') {
                const res = await fetch(`${baseUrl}/bookings`, { headers: calHeaders('2026-05-01') });
                const data = await res.json();
                return response.status(res.status).json(data);
            }

            return response.status(400).json({ error: 'Unknown endpoint' });
        }

        if (request.method === 'POST') {
            // Create booking
            const res = await fetch(`${baseUrl}/bookings`, {
                method: 'POST',
                headers: calHeaders('2026-02-25'),
                body: JSON.stringify(request.body),
            });
            const data = await res.json();
            return response.status(res.status).json(data);
        }

        if (request.method === 'DELETE') {
            const { id } = request.query;
            if (!id) return response.status(400).json({ error: 'Missing id (booking uid)' });
            const res = await fetch(`${baseUrl}/bookings/${id}/cancel`, {
                method: 'POST',
                headers: calHeaders('2026-02-25'),
                body: JSON.stringify({ cancellationReason: request.body?.cancellationReason || 'Cancelled via dashboard' }),
            });
            const data = await res.json();
            return response.status(res.status).json(data);
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
