// Enkel de individuele intake heeft een eigen link; alle andere sessies lopen via de centrale
// Cal.com-pagina https://cal.com/talk2, waar cliënten zelf hun sessietype kiezen. Zie GUIDE.md voor een nieuw aanbod toevoegen.
const CAL_BASE = 'https://cal.com/talk2';

// Het e-mailadres voor alle "Neem contact op"-knoppen.
export const CONTACT_EMAIL = 'veerle@talk2.be';

export const BOOKING_LINKS = {
    // Hoofdknop "Eerste intake 60 minuten": individuele intake (header, home, contact, aanbod).
    firstSession: `${CAL_BASE}/therapie-coaching-60-min-intake`,
    // Algemene knop voor alle andere sessies: de Cal.com-pagina waar alle diensten staan.
    allSessions: CAL_BASE,
    // Oude losse links: niet meer gebruikt in knoppen, enkel bewaard voor bestaande data/dashboard.
    followUp: `${CAL_BASE}/therapie-coaching-60-min`,
    nature60: `${CAL_BASE}/therapie-coaching-in-de-natuur-60-min`,
    nature90: `${CAL_BASE}/therapie-coaching-in-de-natuur-90-min`,
    freeDiscoveryCall: `${CAL_BASE}/kennismaking-online-voor-trainingen-en-groepsbegeleidingen`,
    coupleIntake: `${CAL_BASE}/koppeltherapie-90-min-intake`,
    couple90: `${CAL_BASE}/koppeltherapie-90-min`,
} as const;
