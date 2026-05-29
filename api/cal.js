export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') return response.status(200).end();

    const apiKey = 'cal_live_7e8d1a0fabf805980cd6c09e5527aa45';
    const baseUrl = 'https://api.cal.com/v1';

    try {
        if (request.method === 'GET') {
            // Get event types
            if (request.query.endpoint === 'event-types') {
                const res = await fetch(`${baseUrl}/event-types?apiKey=${apiKey}`);
                const data = await res.json();
                return response.status(200).json(data);
            }
            
            // Get bookings
            if (request.query.endpoint === 'bookings') {
                const res = await fetch(`${baseUrl}/bookings?apiKey=${apiKey}`);
                const data = await res.json();
                return response.status(200).json(data);
            }
        }

        if (request.method === 'POST') {
            // Create booking
            const res = await fetch(`${baseUrl}/bookings?apiKey=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request.body)
            });
            const data = await res.json();
            return response.status(200).json(data);
        }

        if (request.method === 'DELETE') {
            const { id } = request.query;
            const res = await fetch(`${baseUrl}/bookings/${id}?apiKey=${apiKey}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            return response.status(200).json(data);
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
