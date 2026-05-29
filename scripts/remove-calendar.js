const fs = require('fs');
const path = require('path');

function processHtml(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove calendar tab
    content = content.replace(/<button class="dash-tab" \[class\.active\]="activeTab\(\) === 'calendar'".*?Kalender\s*Instellingen<\/button>/s, '');

    // Replace Bookings tab
    const newBookings = `
        <!-- BOOKINGS TAB -->
        @if (activeTab() === 'bookings') {
        <main class="dash-full-main" style="flex: 1; padding: 32px; overflow-y: auto;">
            <div class="dash-header"
                style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h1 class="dash-title-main" style="margin: 0; font-size: 24px;">Afspraken (Cal.com)</h1>
            </div>

            <div class="settings-card" style="background: white; border-radius: 12px; border: 1px solid var(--color-sage-light); padding: 48px; text-align: center; max-width: 600px; margin: 40px auto;">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--color-sage); margin: 0 auto 16px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--color-sage-darkest); margin-bottom: 12px;">Afspraken en Beschikbaarheid</h2>
                <p style="color: var(--color-text-muted); margin-bottom: 32px; line-height: 1.6;">
                    Al je afspraken, agenda-koppelingen (Google Calendar, Outlook) en beschikbaarheidsinstellingen worden nu volledig beheerd via Cal.com. Dit zorgt voor automatische synchronisatie zonder dubbele boekingen.
                </p>
                <a href="https://app.cal.com/bookings" target="_blank" style="display: inline-block; padding: 12px 24px; background: var(--color-sage); color: white; border-radius: 6px; font-weight: 600; text-decoration: none; transition: opacity 0.2s;">
                    Beheer afspraken op Cal.com &rarr;
                </a>
            </div>
        </main>
        }
`;

    // Strip everything from BOOKINGS TAB to EMAIL TEMPLATES TAB
    const startBookings = content.indexOf('<!-- BOOKINGS TAB -->');
    const startEmail = content.indexOf('<!-- EMAIL TEMPLATES TAB -->');
    
    if (startBookings !== -1 && startEmail !== -1) {
        content = content.substring(0, startBookings) + newBookings + content.substring(startEmail);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

function processTs(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove imports related to booking/calendar
    content = content.replace(/CalendarSettings, Booking/g, '');
    
    // Change active tab union
    content = content.replace(/'surveys' \| 'calendar' \| 'bookings' \| 'email-templates'/g, "'surveys' | 'bookings' | 'email-templates'");
    
    // We will do a simple string manipulation for the TS file since it's large and complex.
    // Let's replace loadBookings() inside setTab
    content = content.replace(/if \(tab === 'bookings'\) this\.loadBookings\(\);/g, '');
    content = content.replace(/this\.loadBookings\(\);/g, '');

    // Now delete all the calendar and bookings logic. It's safer to just let the compiler complain and fix those, or just regex it out.
    // It's mostly from `// Calendar & Bookings State` down to `loadSurveys()`
    const startCalState = content.indexOf('// Calendar & Bookings State');
    const startLoadSurveys = content.indexOf('getTemplateLabel(type: string): string {');
    
    if (startCalState !== -1 && startLoadSurveys !== -1) {
        content = content.substring(0, startCalState) + content.substring(startLoadSurveys);
    }

    // Fix the `const booked = this.bookings().filter...` inside surveyStats computed
    content = content.replace(/const booked = this\.bookings\(\)\.filter.*?\.length;/g, 'const booked = 0;');

    fs.writeFileSync(filePath, content, 'utf8');
}

processHtml(path.join(__dirname, '../src/app/dashboard/dashboard.component.html'));
processTs(path.join(__dirname, '../src/app/dashboard/dashboard.component.ts'));

console.log('Removed obsolete calendar and bookings code.');
