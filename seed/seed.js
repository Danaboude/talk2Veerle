/**
 * Talk2 Seed Script
 * ------------------
 * Creates the Talk2 survey and all email templates in the database.
 *
 * Usage (run from project root):
 *   node seed/seed.js
 *
 * Or against production:
 *   BASE_URL=https://your-domain.vercel.app node seed/seed.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function post(endpoint, data) {
    const res = await fetch(`${BASE_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST /api/${endpoint} failed (${res.status}): ${text}`);
    }
    return res.json();
}

async function put(endpoint, data) {
    const res = await fetch(`${BASE_URL}/api/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PUT /api/${endpoint} failed (${res.status}): ${text}`);
    }
    return res.json();
}

async function seed() {
    console.log(`\n🌿  Talk2 Seed Script`);
    console.log(`    Target: ${BASE_URL}\n`);

    // ── 1. Create survey ──────────────────────────────────────
    const survey = JSON.parse(fs.readFileSync(path.join(__dirname, 'talk2-survey.json'), 'utf-8'));
    console.log('📋  Creating survey...');
    try {
        const created = await post('surveys', survey);
        console.log(`    ✓ Survey created with ID: ${created._id}`);
    } catch (err) {
        console.error(`    ✗ Survey creation failed: ${err.message}`);
    }

    // ── 2. Seed email templates ───────────────────────────────
    const templates = JSON.parse(fs.readFileSync(path.join(__dirname, 'talk2-email-templates.json'), 'utf-8'));
    console.log(`\n📧  Seeding ${templates.length} email templates...`);
    for (const tmpl of templates) {
        try {
            await put('email-templates-api', tmpl);
            console.log(`    ✓ ${tmpl.id} — ${tmpl.label}`);
        } catch (err) {
            console.error(`    ✗ ${tmpl.id} failed: ${err.message}`);
        }
    }

    console.log('\n✅  Seed complete!\n');
}

seed().catch(err => {
    console.error('\n❌  Seed script crashed:', err.message);
    process.exit(1);
});
