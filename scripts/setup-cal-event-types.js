// One-time setup script: creates the Cal.com event types described in t.md.
// Cal.com API v1 is decommissioned — this uses API v2 (Bearer auth + cal-api-version header).
// Usage:
//   node scripts/setup-cal-event-types.js            (dry run — prints what would be created)
//   node scripts/setup-cal-event-types.js --confirm  (actually creates them on Cal.com)
//
// Requires CAL_API_KEY in the environment (see .env.local).
// Note: v2 event-type creation has no built-in "price" field (that requires a payment
// app like Stripe connected in the Cal.com account) — price is included in the
// description text instead, matching the FAQ pricing shown on the site.

const API_KEY = process.env.CAL_API_KEY;
const BASE_URL = 'https://api.cal.com/v2';
const CONFIRM = process.argv.includes('--confirm');

const WARM_INTRO = 'Een rustige, gedragen sessie waarin we samen bewegen van bescherming naar verbinding — tijd om te landen, te ademen en te voelen wat er mag ontstaan.';

const EVENT_TYPES = [
    {
        title: 'Individuele coaching of therapie – Intake',
        slug: 'individueel-intake',
        lengthInMinutes: 60,
        priceLabel: '€90',
        description: `${WARM_INTRO} Eerste gesprek: we verkennen samen je vragen, verlangens en patronen, in een zachte, veilige start. Locatie: binnen. Prijs: €90.`,
    },
    {
        title: 'Individuele coaching of therapie – Vervolggesprek',
        slug: 'individueel-vervolg-1u',
        lengthInMinutes: 60,
        priceLabel: '€80',
        description: `${WARM_INTRO} Vervolggesprek waarin we verder verkennen wat er speelt. Locatie: binnen of buiten (wandeling mogelijk). Prijs: €80.`,
    },
    {
        title: 'Individuele coaching of therapie – 1,5 uur',
        slug: 'individueel-vervolg-1u5',
        lengthInMinutes: 90,
        priceLabel: '€120',
        description: `${WARM_INTRO} Verdiepend vervolggesprek met extra ruimte om te vertragen. Locatie: binnen of buiten (wandeling mogelijk). Prijs: €120.`,
    },
    {
        title: 'Online opvolging individueel',
        slug: 'online-opvolging',
        lengthInMinutes: 30,
        priceLabel: '€40',
        description: 'Een kort moment van opvolging voor coaching of therapie, voor een kleinere vraag. Locatie: online of telefoon. Beschikbaar dinsdag & donderdag 16:30–17:00. Prijs: €40.',
    },
    {
        title: 'Intake kennismaking (gratis)',
        slug: 'gratis-kennismaking',
        lengthInMinutes: 30,
        priceLabel: 'gratis',
        description: 'Een vrijblijvend kennismakingsgesprek voor het groepsaanbod of om te voelen of mijn begeleiding bij je past. Locatie: online of telefoon. Beschikbaar dinsdag & donderdag 16:30–17:00. Gratis.',
    },
    {
        title: 'Koppeltherapie – Intake',
        slug: 'koppel-intake',
        lengthInMinutes: 60,
        priceLabel: '€95',
        description: `${WARM_INTRO} Eerste gesprek waarin we samen verkennen welke vragen, verlangens en patronen er spelen tussen jullie. Zachte, veilige start. Locatie: binnen. Prijs: €95.`,
    },
    {
        title: 'Koppeltherapie – 1,5 uur',
        slug: 'koppel-1u5',
        lengthInMinutes: 90,
        priceLabel: '€142,50',
        description: `${WARM_INTRO} Verdiepend koppelgesprek met focus op bescherming, verbinding en patronen. Locatie: binnen of buiten (wandeling mogelijk). Prijs: €142,50.`,
    },
    {
        title: 'Duo-wandelsessies – Intake',
        slug: 'duo-intake',
        lengthInMinutes: 60,
        priceLabel: '€80',
        description: `${WARM_INTRO} Voor duo's — vrienden, familie, collega's of partners. Locatie: binnen. Prijs: €80.`,
    },
    {
        title: 'Duo – 1,5 uur',
        slug: 'duo-1u5',
        lengthInMinutes: 90,
        priceLabel: '€120',
        description: `${WARM_INTRO} Onderzoek van patronen en dynamieken tussen jullie als duo. Locatie: buiten. Prijs: €120.`,
    },
];

async function createEventType(evt) {
    const { priceLabel, ...body } = evt;
    const res = await fetch(`${BASE_URL}/event-types`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
            'cal-api-version': '2024-06-14',
        },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`${evt.slug}: ${JSON.stringify(data)}`);
    return data;
}

async function main() {
    if (!API_KEY) {
        console.error('CAL_API_KEY is not set. Load .env.local first.');
        process.exit(1);
    }

    console.log(`${CONFIRM ? 'CREATING' : 'DRY RUN — would create'} ${EVENT_TYPES.length} Cal.com event types (API v2):\n`);
    for (const evt of EVENT_TYPES) {
        console.log(`- ${evt.title}  [/${evt.slug}]  ${evt.lengthInMinutes}min  ${evt.priceLabel}`);
    }

    if (!CONFIRM) {
        console.log('\nRe-run with --confirm to actually create these on Cal.com.');
        return;
    }

    console.log('');
    for (const evt of EVENT_TYPES) {
        try {
            const result = await createEventType(evt);
            const created = result?.data;
            console.log(`Created: ${evt.slug} -> id=${created?.id} url=${created?.bookingUrl ?? created?.link ?? '(check dashboard)'}`);
        } catch (err) {
            console.error(`Failed: ${evt.slug} ->`, err.message);
        }
    }
}

main();
