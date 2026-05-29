const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@talk2.be';
const FROM_NAME = 'Talk2';

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') return response.status(200).end();
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

    try {
        const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
        const { email, name, subject, html, text } = body;

        if (!email || (!html && !text)) {
            return response.status(400).json({ error: 'Missing required fields' });
        }

        const data = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [email],
            subject: subject || 'Nieuw bericht van Talk2',
            html: html || text,
            text: text
        });

        return response.status(200).json(data);
    } catch (err) {
        console.error(err);
        return response.status(500).json({ error: err.message });
    }
}
