const crypto = require('crypto');

function sign(payload) {
    const secret = process.env.ADMIN_JWT_SECRET;
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    return `${body}.${sig}`;
}

function verify(token) {
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!token || !secret) return null;
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;

    const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
}

// Returns true if the request carries a valid admin token; otherwise writes a 401 and returns false.
function requireAdmin(request, response) {
    const header = request.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const payload = verify(token);
    if (!payload) {
        response.status(401).json({ error: 'Unauthorized' });
        return false;
    }
    return true;
}

module.exports = { sign, verify, requireAdmin };
