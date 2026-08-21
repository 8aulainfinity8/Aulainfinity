const fs = require('fs');

// 1. src/services/firestoreSync.ts
let syncCode = fs.readFileSync('src/services/firestoreSync.ts', 'utf8');
syncCode = syncCode.replace(
    /\/\/ 5b\. Student Course Progress sync \(filtered by studentId\)[\s\S]*?\/\/ 6\. Agenda Events sync \(firestore_agenda_events\)/,
    `// 5b. Student Course Progress sync
        if (currentUserObj?.role === 'admin') {
            const progressRef = collection(db, 'student_course_progress');
            onSnapshot(progressRef, (snapshot: any) => {
                snapshot.docChanges().forEach((change: any) => {
                    const data = change.doc.data() || {};
                    eventEmitter.emit('student-progress-updated', data);
                });
            }, (err: any) => handleSyncError('Firestore student progress sync:', err));
        }

        // 6. Agenda Events sync (firestore_agenda_events)`
);
fs.writeFileSync('src/services/firestoreSync.ts', syncCode);

// 2. src/components/RealtimeAlertsBanner.tsx
let bannerCode = fs.readFileSync('src/components/RealtimeAlertsBanner.tsx', 'utf8');
bannerCode = bannerCode.replace(
    /useEffect\(\(\) => \{\n\s*if \(\!user\) return;\n\s*const boardMetaRef = collection\(db, 'whiteboardMeta'\);/,
    `useEffect(() => {\n        if (!user || user.role !== 'admin') return;\n        const boardMetaRef = collection(db, 'whiteboardMeta');`
);
fs.writeFileSync('src/components/RealtimeAlertsBanner.tsx', bannerCode);

// 3. src/components/StudentChatPage.tsx
let studentChatCode = fs.readFileSync('src/components/StudentChatPage.tsx', 'utf8');
studentChatCode = studentChatCode.replace(
    /useEffect\(\(\) => \{\n\s*const q = collection\(db, 'whiteboardMeta'\);/,
    `useEffect(() => {\n        if (!user || user.role !== 'admin') return;\n        const q = collection(db, 'whiteboardMeta');`
);
// Also for activeConvoId boardMeta
studentChatCode = studentChatCode.replace(
    /if \(activeConvoId\) \{\n\s*const boardMetaRef = doc\(db, 'whiteboardMeta', activeConvoId\);/,
    `if (activeConvoId && user?.role === 'admin') {\n            const boardMetaRef = doc(db, 'whiteboardMeta', activeConvoId);`
);
fs.writeFileSync('src/components/StudentChatPage.tsx', studentChatCode);

// 4. src/components/ChatPage.tsx
let chatCode = fs.readFileSync('src/components/ChatPage.tsx', 'utf8');
chatCode = chatCode.replace(
    /const boardRef = doc\(db, 'whiteboardMeta', rId\);\n\s*const boardUnsub = onSnapshot\(boardRef, \(snap\) => \{/,
    `let boardUnsub = () => {};\n            if (user?.role === 'admin') {\n                const boardRef = doc(db, 'whiteboardMeta', rId);\n                boardUnsub = onSnapshot(boardRef, (snap) => {\n                    activeBoardMap[rId] = snap.exists() && snap.data()?.active === true;\n                    setIsWhiteboardActive(Object.values(activeBoardMap).some(Boolean));\n                });\n            }`
);
fs.writeFileSync('src/components/ChatPage.tsx', chatCode);

// 5. src/components/Whiteboard.tsx
let whiteboardCode = fs.readFileSync('src/components/Whiteboard.tsx', 'utf8');
// For Whiteboard.tsx, we need to check if we can prevent the onSnapshot on whiteboardMeta if not admin.
// Wait, the teacher sets it active. If they can't set it active, we shouldn't fail the whole whiteboard.
// It's probably better to just catch the error or not read it if not admin.
// Actually, let's just leave Whiteboard.tsx alone for now unless it has an onSnapshot warning.
// Wait, the user said "AppWarning Firestore whiteboardMeta listener: Missing or insufficient permissions."
// Let's check Whiteboard.tsx for onSnapshot on whiteboardMeta.
