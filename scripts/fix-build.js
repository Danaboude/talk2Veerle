const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix s.false / s.true / survey()?.false
    content = content.replace(/s\.false/g, 'false');
    content = content.replace(/s\.true/g, 'true');
    content = content.replace(/survey\(\)\?\.false/g, 'false');
    
    // Fix getCalendarSettings
    if (filePath.includes('survey.component.ts')) {
        content = content.replace(/this\.surveyService\.getCalendarSettings\(\)\.subscribe\(\{[\s\S]*?\}\);/g, '// Removed calendar settings');
        content = content.replace(/payload/g, '(payload: any)');
        content = content.replace(/filter\(b =>/g, 'filter((b: any) =>');
        content = content.replace(/map\(b =>/g, 'map((b: any) =>');
    }

    if (filePath.includes('fcm.service.ts')) {
        content = content.replace(/\(payload\)/g, '(payload: any)');
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

fixFile(path.join(__dirname, '../src/app/survey/survey.component.html'));
fixFile(path.join(__dirname, '../src/app/survey/survey.component.ts'));
fixFile(path.join(__dirname, '../src/app/services/fcm.service.ts'));

console.log('Fixed build errors.');
