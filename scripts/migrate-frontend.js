const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src/app');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // CSS Variable replacements to map to ives-wife theme
    content = content.replace(/var\(--p41-teal\)/g, 'var(--color-sage)');
    content = content.replace(/var\(--p41-dark\)/g, 'var(--color-sage-darkest)');
    content = content.replace(/var\(--p41-gray\)/g, 'var(--color-cream)');
    content = content.replace(/var\(--p41-text\)/g, 'var(--color-text)');
    content = content.replace(/var\(--p41-border\)/g, 'var(--color-sage-light)');
    
    // Replace theme classes
    content = content.replace(/\.theme-aeriez/g, ''); // just remove theme-aeriez specific stuff or replace
    
    // Hardcode company to Talk2 in logic
    content = content.replace(/company: 'p41' \| 'aeriez'/g, "company: 'Talk2'");
    content = content.replace(/company\(\) === 'aeriez'/g, "false");
    content = content.replace(/company === 'aeriez'/g, "false");
    content = content.replace(/company === 'p41'/g, "true");
    content = content.replace(/company\(\) === 'p41'/g, "true");
    
    // String replacements
    content = content.replace(/'p41'/g, "'Talk2'");
    content = content.replace(/'aeriez'/g, "'Talk2'");
    content = content.replace(/"p41"/g, '"Talk2"');
    content = content.replace(/"aeriez"/g, '"Talk2"');
    content = content.replace(/Aeriez/g, 'Talk2');
    content = content.replace(/P41/g, 'Talk2');

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (['.ts', '.html', '.css'].includes(path.extname(fullPath))) {
            replaceInFile(fullPath);
        }
    }
}

processDirectory(directoryPath);
console.log('Migration of frontend content completed.');
