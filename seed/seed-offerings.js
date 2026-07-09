/**
 * Talk2 Offerings Seed Script
 * ----------------------------
 * Upserts the offerings in seed/offerings.json directly into the database.
 * (Goes straight to Postgres rather than the /api/offerings-api endpoint,
 * since that endpoint requires an admin token for writes.)
 *
 * Usage (run from project root, DATABASE_URL must be set):
 *   node --env-file=.env.local seed/seed-offerings.js
 */

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

async function seed() {
    console.log('\n🌿  Talk2 Offerings Seed Script\n');

    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set. Run with: node --env-file=.env.local seed/seed-offerings.js');
    }

    const sql = neon(process.env.DATABASE_URL);
    const offerings = JSON.parse(fs.readFileSync(path.join(__dirname, 'offerings.json'), 'utf-8'));

    await sql`
        CREATE TABLE IF NOT EXISTS offerings (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL DEFAULT '',
            intro TEXT DEFAULT '',
            description TEXT DEFAULT '',
            event_date TEXT DEFAULT '',
            location TEXT DEFAULT '',
            price TEXT DEFAULT '',
            contact_link TEXT DEFAULT '',
            audience TEXT NOT NULL DEFAULT 'individuen',
            published BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    console.log(`📋  Seeding ${offerings.length} offerings...`);
    for (const o of offerings) {
        try {
            await sql`
                INSERT INTO offerings (
                    id, title, intro, description, event_date, location,
                    price, contact_link, audience, published
                )
                VALUES (
                    ${o.id}, ${o.title || ''}, ${o.intro || ''}, ${o.description || ''},
                    ${o.eventDate || ''}, ${o.location || ''}, ${o.price || ''},
                    ${o.contactLink || ''}, ${o.audience || 'individuen'}, ${!!o.published}
                )
                ON CONFLICT (id) DO UPDATE
                SET title = EXCLUDED.title,
                    intro = EXCLUDED.intro,
                    description = EXCLUDED.description,
                    event_date = EXCLUDED.event_date,
                    location = EXCLUDED.location,
                    price = EXCLUDED.price,
                    contact_link = EXCLUDED.contact_link,
                    audience = EXCLUDED.audience,
                    published = EXCLUDED.published,
                    updated_at = CURRENT_TIMESTAMP
            `;
            console.log(`    ✓ ${o.id}  ${o.title}`);
        } catch (err) {
            console.error(`    ✗ ${o.id} failed: ${err.message}`);
        }
    }

    console.log('\n✅  Seed complete!\n');
}

seed().catch(err => {
    console.error('\n❌  Seed script crashed:', err.message);
    process.exit(1);
});
