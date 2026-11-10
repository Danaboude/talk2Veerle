const { neon } = require('@neondatabase/serverless');
const { requireAdmin } = require('./_lib/auth');

// One endpoint, two audiences:
//   POST            public  - the website reports "someone is on page X" and "they spent N seconds there"
//   GET / DELETE    admin   - the visitors dashboard (needs the admin token, like every other admin API)

const MAX_SECONDS_PER_EVENT = 60 * 60;   // a single page stay is never credited with more than an hour
const MAX_PAGES_PER_SESSION = 100;       // stops a script from filling the database with fake pages
const MAX_VISITORS_LISTED = 1000;
const SESSION_ID = /^[a-zA-Z0-9-]{8,64}$/;
const PAGE_PATH = /^\/[^\s?#]{0,199}$/;
const BOT_AGENT = /bot|crawler|spider|crawling|headless|lighthouse|preview|facebookexternalhit|curl|wget|python-requests/i;
const PRIVATE_IP = /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|fc|fd|fe80)/i;

let schemaReady;
function ensureSchema(sql) {
    schemaReady ??= (async () => {
        await sql`
            CREATE TABLE IF NOT EXISTS visitors (
                session_id TEXT PRIMARY KEY,
                ip TEXT NOT NULL DEFAULT '',
                user_agent TEXT NOT NULL DEFAULT '',
                location JSONB,
                first_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                last_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                total_seconds INTEGER NOT NULL DEFAULT 0
            )
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS visitor_pages (
                session_id TEXT NOT NULL REFERENCES visitors(session_id) ON DELETE CASCADE,
                path TEXT NOT NULL,
                visits INTEGER NOT NULL DEFAULT 0,
                seconds INTEGER NOT NULL DEFAULT 0,
                first_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                last_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (session_id, path)
            )
        `;
        await sql`CREATE INDEX IF NOT EXISTS visitors_last_visit_idx ON visitors (last_visit DESC)`;
    })().catch(err => {
        schemaReady = undefined; // retry on the next request instead of caching a failure
        throw err;
    });
    return schemaReady;
}

function clientIp(request) {
    const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return String(request.headers['x-real-ip'] || forwarded || '').trim();
}

// Looks up who is behind an IP (company, ISP, country, coordinates). The result is
// reused for later visits from the same IP so the API quota is only spent once per address.
async function lookupLocation(sql, ip) {
    if (!ip || PRIVATE_IP.test(ip)) return null;

    const cached = await sql`SELECT location FROM visitors WHERE ip = ${ip} AND location IS NOT NULL LIMIT 1`;
    if (cached[0]) return cached[0].location;

    const apiKey = process.env.IPLOCATE_API_KEY;
    if (!apiKey) return null;
    try {
        const res = await fetch(`https://www.iplocate.io/api/lookup/${encodeURIComponent(ip)}`, {
            headers: { 'X-API-Key': apiKey },
            signal: AbortSignal.timeout(4000),
        });
        return res.ok ? await res.json() : null;
    } catch (err) {
        console.error('IP lookup failed:', err.message);
        return null;
    }
}

async function recordVisit(sql, request, response) {
    const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : request.body || {};
    const { sessionId, path, view } = body;
    const seconds = Math.min(Math.max(Math.round(Number(body.seconds) || 0), 0), MAX_SECONDS_PER_EVENT);

    if (!SESSION_ID.test(sessionId || '') || !PAGE_PATH.test(path || '')) {
        return response.status(400).json({ error: 'Invalid payload' });
    }
    const userAgent = String(request.headers['user-agent'] || '').slice(0, 300);
    if (BOT_AGENT.test(userAgent)) return response.status(204).end();

    const existing = await sql`SELECT 1 FROM visitors WHERE session_id = ${sessionId}`;
    if (!existing.length) {
        const ip = clientIp(request);
        const location = await lookupLocation(sql, ip);
        await sql`
            INSERT INTO visitors (session_id, ip, user_agent, location)
            VALUES (${sessionId}, ${ip}, ${userAgent}, ${location ? JSON.stringify(location) : null}::jsonb)
            ON CONFLICT (session_id) DO NOTHING
        `;
    }

    const known = await sql`SELECT COUNT(*)::int AS n, BOOL_OR(path = ${path}) AS has_path FROM visitor_pages WHERE session_id = ${sessionId}`;
    if (!known[0].has_path && known[0].n >= MAX_PAGES_PER_SESSION) return response.status(204).end();

    const addedVisits = view ? 1 : 0;
    await sql`
        INSERT INTO visitor_pages (session_id, path, visits, seconds)
        VALUES (${sessionId}, ${path}, ${addedVisits}, ${seconds})
        ON CONFLICT (session_id, path) DO UPDATE
        SET visits = visitor_pages.visits + ${addedVisits},
            seconds = visitor_pages.seconds + ${seconds},
            last_visit = NOW()
    `;
    await sql`
        UPDATE visitors SET last_visit = NOW(), total_seconds = total_seconds + ${seconds}
        WHERE session_id = ${sessionId}
    `;
    return response.status(204).end();
}

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Cache-Control', 'no-store');

    if (request.method === 'OPTIONS') return response.status(200).end();
    if (!['GET', 'POST', 'DELETE'].includes(request.method)) {
        return response.status(405).json({ error: 'Method not allowed' });
    }
    if (request.method !== 'POST' && !requireAdmin(request, response)) return;

    try {
        const sql = neon(process.env.DATABASE_URL);
        await ensureSchema(sql);

        if (request.method === 'POST') return await recordVisit(sql, request, response);

        if (request.method === 'GET') {
            const rows = await sql`
                SELECT v.session_id AS id, v.ip, v.user_agent AS "userAgent", v.location,
                       v.first_visit AS "firstVisit", v.last_visit AS "lastVisit",
                       v.total_seconds AS "totalDurationSeconds",
                       COALESCE(
                           json_agg(json_build_object(
                               'url', p.path, 'visits', p.visits, 'duration', p.seconds,
                               'firstVisit', p.first_visit, 'lastVisit', p.last_visit
                           ) ORDER BY p.first_visit) FILTER (WHERE p.path IS NOT NULL),
                           '[]'::json
                       ) AS "pagesViewed"
                FROM visitors v
                LEFT JOIN visitor_pages p ON p.session_id = v.session_id
                GROUP BY v.session_id
                ORDER BY v.last_visit DESC
                LIMIT ${MAX_VISITORS_LISTED}
            `;
            return response.status(200).json(rows);
        }

        // DELETE ?id=<sessionId>  or  DELETE ?all=true
        const { id, all } = request.query;
        if (all === 'true') {
            await sql`DELETE FROM visitors`;
        } else if (id) {
            await sql`DELETE FROM visitors WHERE session_id = ${id}`;
        } else {
            return response.status(400).json({ error: 'Missing id' });
        }
        return response.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        // Tracking must never surface internals to the public; admins get the message like other APIs.
        return response.status(500).json({ error: request.method === 'POST' ? 'Server error' : err.message });
    }
}
