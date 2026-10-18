// Base profile: https://cal.com/talk2
const CAL_BASE = 'https://cal.com/talk2';

export const BOOKING_LINKS = {
    firstSession: `${CAL_BASE}/therapie-coaching-60-min-intake`,
    followUp: `${CAL_BASE}/therapie-coaching-60-min`,
    nature60: `${CAL_BASE}/therapie-coaching-in-de-natuur-60-min`,
    nature90: `${CAL_BASE}/therapie-coaching-in-de-natuur-90-min`,
    // No standalone 90-min follow-up event on the talk2 profile; closest equivalent is the nature-based 90-min session.
    followUp90: `${CAL_BASE}/therapie-coaching-in-de-natuur-90-min`,
    freeDiscoveryCall: `${CAL_BASE}/kennismaking-online-voor-trainingen-en-groepsbegeleidingen`,
    // Not wired into any current CTA; kept for parity with the plain 60-min session.
    onlineFollowUp: `${CAL_BASE}/therapie-coaching-60-min`,
    coupleIntake: `${CAL_BASE}/koppeltherapie-90-min-intake`,
    couple90: `${CAL_BASE}/koppeltherapie-90-min`,
    // No separate "duo" event on the talk2 profile; duo's & koppels share the koppeltherapie event types.
    duoIntake: `${CAL_BASE}/koppeltherapie-90-min-intake`,
    duo90: `${CAL_BASE}/koppeltherapie-90-min`,
} as const;
