const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove empty brackets from css
    if (filePath.endsWith('.css')) {
        content = content.replace(/^\s*\{\s*$/gm, '');
    }

    if (filePath.includes('dashboard.component.html')) {
        content = content.replace(/s\.false/g, 'false');
    }

    if (filePath.includes('dashboard.component.ts')) {
        // Comment out calendar settings logic since we use cal.com
        content = content.replace(/this\.surveyService\.getCalendarSettings\(\)\.subscribe\(\{[\s\S]*?\}\);/g, '// Removed calendar settings');
        content = content.replace(/this\.surveyService\.updateCalendarSettings\(settings\)\.subscribe\(\{[\s\S]*?\}\);/g, '// Removed calendar settings');
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

fixFile(path.join(__dirname, '../src/app/creator/creator.component.css'));
fixFile(path.join(__dirname, '../src/app/survey/survey.component.css'));
fixFile(path.join(__dirname, '../src/app/dashboard/dashboard.component.html'));
fixFile(path.join(__dirname, '../src/app/dashboard/dashboard.component.ts'));

console.log('Fixed build errors round 2.');
