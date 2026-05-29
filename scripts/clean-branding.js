const fs = require('fs');
const path = require('path');

function replaceAll(filePath, replacements, customLogic) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    
    for (const [find, replace] of replacements) {
        content = content.split(find).join(replace);
    }
    
    if (customLogic) {
        content = customLogic(content);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
}

// 1. creator.component.html
replaceAll(path.join(__dirname, '../src/app/creator/creator.component.html'), [
    ['[class]="false"', ''],
    ["false ? '/aeriez.png' : '/logo.jpg'", "'/logo.jpg'"],
    ["false ? '/aeriez1.png' : '/logo.jpg'", "'/logo.jpg'"],
    ["(false ? '#2563eb' : 'var(--color-sage)')", "'var(--color-sage)'"],
    ["false ? 'Talk2' : 'Talk2'", "'Talk2'"]
], (content) => {
    // Remove the Branding section completely
    const start = content.indexOf('<!-- Branding Variant -->');
    const end = content.indexOf('<!-- Hero Section -->');
    if (start !== -1 && end !== -1) {
        content = content.substring(0, start) + content.substring(end);
    }
    return content;
});

// 2. creator.component.ts
replaceAll(path.join(__dirname, '../src/app/creator/creator.component.ts'), [
    ["company = signal<'Talk2' | 'Talk2'>('Talk2');", "company = signal('Talk2');"]
]);

// 3. survey.component.html
replaceAll(path.join(__dirname, '../src/app/survey/survey.component.html'), [
    ['[class]="false"', ''],
    ["false ? '/aeriez.png' : '/logo.jpg'", "'/logo.jpg'"],
    ["false ? '/aeriez1.png' : '/logo.jpg'", "'/logo.jpg'"],
    ["false ? 'Talk2' : 'Talk2'", "'Talk2'"],
    ["false || true ? 'Download Brochure' : (s.ctaText ||", "s.ctaText || 'Download Brochure' || (s.ctaText ||"]
], (content) => {
    // Fix messy CTA text condition if it breaks
    content = content.replace(/s\.ctaText \|\| 'Download Brochure' \|\| \(s\.ctaText \|\|/g, "s.ctaText || 'Download Brochure' || ('' ||");
    return content;
});

// 4. survey.component.ts
replaceAll(path.join(__dirname, '../src/app/survey/survey.component.ts'), [], (content) => {
    // Simplify ngOnInit hostname checking
    const badLogic = `
            if (hostname.includes('Talk2')) {
                this.loadSurveyByCompany('Talk2', mode, respondentId);
            } else if (hostname.includes('Talk2')) {
                this.loadSurveyByCompany('Talk2', mode, respondentId);
            } else {
                // Not a survey subdomain and no ID, go to login
                this.router.navigate(['/login']);
            }
`;
    const goodLogic = `
            if (hostname.includes('survey')) {
                this.loadSurveyByCompany('Talk2', mode, respondentId);
            } else {
                this.router.navigate(['/login']);
            }
`;
    return content.replace(badLogic, goodLogic);
});

// 5. dashboard.component.html
replaceAll(path.join(__dirname, '../src/app/dashboard/dashboard.component.html'), [
    ["[class.aeriez]=\"false\"", ""],
    ["{{ false ? 'Talk2' : 'Talk2' }}", "Talk2"]
]);

console.log('Branding cleanup completed successfully!');
