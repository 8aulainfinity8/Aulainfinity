const fs = require('fs');
const text = fs.readFileSync('firestore.rules', 'utf8');

// I just want to match from the beginning up to the end of whatsapp_logs
const endMarker = 'match /whatsapp_logs/{id} {\n      allow read: if isAdmin();\n      allow write: if isAdmin();\n    }\n  }\n}';
const idx = text.indexOf('match /whatsapp_logs/{id}');
if (idx !== -1) {
    const endIdx = text.indexOf('}', idx);
    const finalEndIdx = text.indexOf('}', endIdx + 1);
    const veryFinalEndIdx = text.indexOf('}', finalEndIdx + 1);
    
    let clean = text.substring(0, veryFinalEndIdx + 1);
    fs.writeFileSync('firestore.rules', clean);
}
