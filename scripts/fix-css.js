const fs = require('fs');

function fixCss(filePath) {
    let lines = fs.readFileSync(filePath, 'utf8').split('\n');
    let newLines = [];
    let insideOrphanedBrace = false;

    // We know there are orphaned } at the end. The previous regex `.theme-aeriez { ...` removal left `.theme-aeriez .mockup-cta-badge {` as `{` or removed the selector leaving just `{` and `}`.
    // Let's just remove any lines containing only `}` or `{` at the end of the file or near the end where the themes were.
    
    // Easier: Just delete the last 50 lines of those files which contain all the theme overrides that are now useless.
    if (lines.length > 50) {
        let trimmed = lines.slice(0, lines.length - 30).join('\n');
        // Let's ensure all `{` and `}` are balanced. It's safer to just run a regex that removes empty blocks `{[ \n\r]*}`
        let content = fs.readFileSync(filePath, 'utf8');
        for(let i = 0; i < 10; i++) {
           content = content.replace(/\{\s*\}/g, '');
        }
        // remove orphaned } at start of line
        content = content.replace(/^\s*\}\s*$/gm, '');
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

fixCss('d:/example/porjects/aeriez/newwebsite/ives-wife/src/app/creator/creator.component.css');
fixCss('d:/example/porjects/aeriez/newwebsite/ives-wife/src/app/survey/survey.component.css');
console.log('Fixed CSS.');
