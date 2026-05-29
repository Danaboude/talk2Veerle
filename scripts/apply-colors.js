const fs = require('fs');
const path = require('path');

function replaceColors(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace hardcoded P41 colors with CSS variables from styles.css
    content = content.replace(/#21559D/g, 'var(--color-sage)'); // p41-teal
    content = content.replace(/#132020/g, 'var(--color-sage-darkest)'); // p41-dark
    content = content.replace(/#f4f7f6/g, 'var(--color-cream)'); // p41-gray
    content = content.replace(/#2d3748/g, 'var(--color-text)'); // p41-text
    content = content.replace(/#e2e8f0/g, 'var(--color-sage-light)'); // p41-border

    // Replace the p41 var variables just in case
    content = content.replace(/var\(--p41-teal\)/g, 'var(--color-sage)');
    content = content.replace(/var\(--p41-dark\)/g, 'var(--color-sage-darkest)');
    content = content.replace(/var\(--p41-gray\)/g, 'var(--color-cream)');
    content = content.replace(/var\(--p41-text\)/g, 'var(--color-text)');
    content = content.replace(/var\(--p41-border\)/g, 'var(--color-sage-light)');

    fs.writeFileSync(filePath, content, 'utf8');
}

replaceColors(path.join(__dirname, '../src/app/dashboard/dashboard.component.css'));
replaceColors(path.join(__dirname, '../src/app/login/login.component.ts'));

console.log('Colors applied.');
