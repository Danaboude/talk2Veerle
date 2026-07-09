// Cal.com event types created by scripts/setup-cal-event-types.js (2026-07-08).
// Base profile: https://cal.com/abdulkareem-hasan-dandal-krtrk4
const CAL_BASE = 'https://cal.com/abdulkareem-hasan-dandal-krtrk4';

export const BOOKING_LINKS = {
    firstSession: `${CAL_BASE}/individueel-intake`,
    followUp: `${CAL_BASE}/individueel-vervolg-1u`,
    followUp90: `${CAL_BASE}/individueel-vervolg-1u5`,
    freeDiscoveryCall: `${CAL_BASE}/gratis-kennismaking`,
    onlineFollowUp: `${CAL_BASE}/online-opvolging`,
    coupleIntake: `${CAL_BASE}/koppel-intake`,
    couple90: `${CAL_BASE}/koppel-1u5`,
    duoIntake: `${CAL_BASE}/duo-intake`,
    duo90: `${CAL_BASE}/duo-1u5`,
    // Generic profile link, kept for any CTA that shouldn't pre-select a specific session type.
    general: CAL_BASE,
} as const;
