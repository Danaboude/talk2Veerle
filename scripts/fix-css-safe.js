const fs = require('fs');
const path = require('path');

function replaceCssVars(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // CSS Variable replacements to map to ives-wife theme
    content = content.replace(/var\(--p41-teal\)/g, 'var(--color-sage)');
    content = content.replace(/var\(--p41-dark\)/g, 'var(--color-sage-darkest)');
    content = content.replace(/var\(--p41-gray\)/g, 'var(--color-cream)');
    content = content.replace(/var\(--p41-text\)/g, 'var(--color-text)');
    content = content.replace(/var\(--p41-border\)/g, 'var(--color-sage-light)');

    fs.writeFileSync(filePath, content, 'utf8');
}

replaceCssVars(path.join(__dirname, '../src/app/creator/creator.component.css'));
replaceCssVars(path.join(__dirname, '../src/app/survey/survey.component.css'));

console.log('Fixed CSS correctly.');
