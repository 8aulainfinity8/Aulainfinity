const fs = require('fs');
let code = fs.readFileSync('src/services/firebase.ts', 'utf8');

const regex = /import { initializeFirestore, enableNetwork, doc, getDocFromServer } from "firebase\/firestore";/;
const replacement = `
import { initializeFirestore, enableNetwork, doc, getDocFromServer, setDoc as originalSetDoc, addDoc as originalAddDoc, updateDoc as originalUpdateDoc, deleteDoc as originalDeleteDoc } from "firebase/firestore";

function getStack() {
    try { throw new Error(); } catch(e) { return e.stack.split('\\n').slice(3, 5).join(' | '); }
}

export const setDoc = async (ref: any, data: any, options: any) => {
    const path = ref.path || 'unknown';
    console.log('[INSTRUMENT] setDoc', path, getStack());
    return originalSetDoc(ref, data, options);
};
export const addDoc = async (ref: any, data: any) => {
    const path = ref.path || 'unknown';
    console.log('[INSTRUMENT] addDoc', path, getStack());
    return originalAddDoc(ref, data);
};
export const updateDoc = async (ref: any, data: any) => {
    const path = ref.path || 'unknown';
    console.log('[INSTRUMENT] updateDoc', path, getStack());
    return originalUpdateDoc(ref, data);
};
export const deleteDoc = async (ref: any) => {
    const path = ref.path || 'unknown';
    console.log('[INSTRUMENT] deleteDoc', path, getStack());
    return originalDeleteDoc(ref);
};
`;

code = code.replace(regex, replacement.trim());
fs.writeFileSync('src/services/firebase.ts', code);
