const fs = require('fs');
let lines = fs.readFileSync('firestore.rules', 'utf8').split('\n');

// We know the clean end is around line 599, but let's actually just read the file up to line 599 and close it.
// Actually, let's look at the file where it starts getting corrupt.
let goodLines = [];
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes("}) ||")) {
      break;
   }
   goodLines.push(lines[i]);
}

// Just write the good lines out and close it manually.
let cleanRules = goodLines.join('\n');
const regex = /match \/whatsapp_logs\/\{id\} \{\s*allow read: if isAdmin\(\);\s*allow write: if isAdmin\(\);\s*\}/;

const match = cleanRules.match(regex);
if (match) {
    cleanRules = cleanRules.substring(0, match.index + match[0].length);
    cleanRules += '\n  }\n}\n';
}

fs.writeFileSync('firestore.rules', cleanRules);
