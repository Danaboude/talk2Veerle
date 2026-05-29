const fs = require('fs');
const path = require('path');

let p = path.join(__dirname, '../src/app/dashboard/dashboard.component.ts');
let content = fs.readFileSync(p, 'utf8');

// 1. Theme and branding replacements
content = content.replace(/company: 'p41' \| 'aeriez'/g, "company: 'Talk2'");
content = content.replace(/company === 'aeriez'/g, "false");
content = content.replace(/company === 'p41'/g, "true");
content = content.replace(/'p41'/g, "'Talk2'");
content = content.replace(/'aeriez'/g, "'Talk2'");
content = content.replace(/Aeriez/g, 'Talk2');
content = content.replace(/P41/g, 'Talk2');

// 2. Remove tabs from union to match HTML
content = content.replace(/'surveys' \| 'calendar' \| 'bookings' \| 'email-templates'/g, "'surveys' | 'bookings' | 'email-templates'");

// 3. Prevent auto-loading bookings and calendar in init and setTab
content = content.replace(/this\.loadCalendarSettings\(\);/g, '// this.loadCalendarSettings();');
content = content.replace(/if \(tab === 'bookings'\) this\.loadBookings\(\);/g, '// tab bookings handled externally');
content = content.replace(/this\.loadBookings\(\);/g, '// this.loadBookings();');

// 4. In surveyStats booked logic, prevent error if bookings is undefined or we changed things
content = content.replace(/const booked = this\.bookings\(\)\.filter\(b => b\.surveyId === survey\._id\)\.length;/g, 'const booked = 0;');

fs.writeFileSync(p, content, 'utf8');
console.log('Safely patched dashboard.ts');
