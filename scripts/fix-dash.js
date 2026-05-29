const fs = require('fs');
const path = require('path');

let p = path.join(__dirname, '../src/app/dashboard/dashboard.component.ts');
let content = fs.readFileSync(p, 'utf8');

// 1. Remove company='aeriez' logic (which was in migrate-frontend.js)
content = content.replace(/company: 'p41' \| 'aeriez'/g, "company: 'Talk2'");
content = content.replace(/company === 'aeriez'/g, "false");
content = content.replace(/company === 'p41'/g, "true");
content = content.replace(/'p41'/g, "'Talk2'");
content = content.replace(/'aeriez'/g, "'Talk2'");
content = content.replace(/Aeriez/g, 'Talk2');
content = content.replace(/P41/g, 'Talk2');

// 2. Remove calendar Settings types
content = content.replace(/, CalendarSettings, Booking/g, '');

// 3. Tab replacement
content = content.replace(/'surveys' \| 'calendar' \| 'bookings' \| 'email-templates'/g, "'surveys' | 'bookings' | 'email-templates'");

// 4. In setTab, don't loadBookings
content = content.replace(/if \(tab === 'bookings'\) this\.loadBookings\(\);/g, '');
content = content.replace(/this\.loadBookings\(\);/g, '');

// 5. In surveyStats booked logic
content = content.replace(/const booked = this\.bookings\(\)\.filter\(b => b\.surveyId === survey\._id\)\.length;/g, 'const booked = 0;');

// 6. Delete all calendar logic manually via regex matching the exact functions
content = content.replace(/loadCalendarSettings\(\): void \{[\s\S]*?\}/g, 'loadCalendarSettings(): void {}');
content = content.replace(/saveCalendarSettings\(\): void \{[\s\S]*?\}/g, 'saveCalendarSettings(): void {}');
content = content.replace(/generateCalendar\(\): void \{[\s\S]*?\}/g, 'generateCalendar(): void {}');
content = content.replace(/prevMonth\(\): void \{[\s\S]*?\}/g, 'prevMonth(): void {}');
content = content.replace(/nextMonth\(\): void \{[\s\S]*?\}/g, 'nextMonth(): void {}');
content = content.replace(/selectCalendarDate\(date: Date \| null\): void \{[\s\S]*?\}/g, 'selectCalendarDate(date: Date | null): void {}');
content = content.replace(/addSpecificDate\(\): void \{[\s\S]*?\}/g, 'addSpecificDate(): void {}');
content = content.replace(/removeSpecificDate\(index: number, dateStr\?: string\): void \{[\s\S]*?\}/g, 'removeSpecificDate(index: number, dateStr?: string): void {}');
content = content.replace(/copyToEveryWeek\(\): void \{[\s\S]*?\}/g, 'copyToEveryWeek(): void {}');
content = content.replace(/loadBookings\(\): void \{[\s\S]*?\}/g, 'loadBookings(): void {}');
content = content.replace(/deleteBooking\(booking: any\): void \{[\s\S]*?\}/g, 'deleteBooking(booking: any): void {}');

fs.writeFileSync(p, content, 'utf8');
console.log('Restored and cleanly patched dashboard.ts');
