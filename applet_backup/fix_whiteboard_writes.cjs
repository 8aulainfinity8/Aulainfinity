const fs = require('fs');
let code = fs.readFileSync('src/components/Whiteboard.tsx', 'utf8');

// 1. toggleAllowStudentDrawing
code = code.replace(
    /if \(user\?\.role === 'admin'\) \{\n\s*try \{\n\s*const boardMetaRef = doc\(db, 'whiteboards', courseId\);\n\s*await setDoc\(boardMetaRef, \{ allowStudentDrawing: nextState \}, \{ merge: true \}\);\n\s*\} catch \(err\) \{\n\s*console\.error\("Error updating student drawing permission:", err\);\n\s*\}\n\s*\}/,
    `try {
            const boardMetaRef = doc(db, 'whiteboards', courseId);
            await setDoc(boardMetaRef, { allowStudentDrawing: nextState }, { merge: true });
        } catch (err) {
            console.error("Error updating student drawing permission:", err);
        }`
);

// 2. changeBgPattern
code = code.replace(
    /if \(user\?\.role === 'admin'\) \{\n\s*try \{\n\s*const boardMetaRef = doc\(db, 'whiteboards', courseId\);\n\s*await setDoc\(boardMetaRef, \{ bgPattern: pattern \}, \{ merge: true \}\);\n\s*\} catch \(err\) \{\n\s*console\.error\("Error setting whiteboard bgPattern: ", err\);\n\s*\}\n\s*\}/,
    `try {
            const boardMetaRef = doc(db, 'whiteboards', courseId);
            await setDoc(boardMetaRef, { bgPattern: pattern }, { merge: true });
        } catch (err) {
            console.error("Error setting whiteboard bgPattern: ", err);
        }`
);

// 3. handleConfirmCloseAndClearBoard
code = code.replace(
    /if \(user\?\.role === 'admin'\) \{\n\s*const docRef = doc\(db, 'whiteboards', courseId\);\n\s*await setDoc\(docRef, \{\n\s*active: false,\n\s*closedAt: new Date\(\)\.toISOString\(\),\n\s*closedBy: user\?\.name \|\| 'Profesor'\n\s*\}, \{ merge: true \}\)\.catch\(\(\) => \{\}\);\n\s*\}/,
    `const docRef = doc(db, 'whiteboards', courseId);
                await setDoc(docRef, {
                    active: false,
                    closedAt: new Date().toISOString(),
                    closedBy: user?.name || 'Profesor'
                }, { merge: true }).catch(() => {});`
);

// 4. toggleActivateBoard
code = code.replace(
    /if \(user\?\.role === 'admin'\) \{\n\s*const docRef = doc\(db, 'whiteboards', courseId\);\n\s*await setDoc\(docRef, \{ active: nextState, updatedBy: user\?\.name, updatedAt: new Date\(\)\.toISOString\(\) \}, \{ merge: true \}\);\n\s*\}/,
    `const docRef = doc(db, 'whiteboards', courseId);
            await setDoc(docRef, { active: nextState, updatedBy: user?.name, updatedAt: new Date().toISOString() }, { merge: true });`
);

// 5. canInitiate auto-activate
code = code.replace(
    /const canInitiate = \(isTeacher \|\| \(user as any\)\?\.canInitiateWhiteboard === true\) && user\?\.role === 'admin';/,
    `const canInitiate = isTeacher || (user as any)?.canInitiateWhiteboard === true;`
);

// 6. let unsubMeta block
code = code.replace(
    /let unsubMeta = \(\) => \{\};\n\s*if \(user\?\.role === 'admin'\) \{\n\s*unsubMeta = onSnapshot\(boardMetaRef, \(snapshot\) => \{([\s\S]*?)\}, \(err\) => console\.warn\('Firestore whiteboardMeta listener:', err\.message\)\);\n\s*\}/,
    `const unsubMeta = onSnapshot(boardMetaRef, (snapshot) => {$1}, (err) => console.warn('Firestore whiteboard listener:', err.message));`
);

fs.writeFileSync('src/components/Whiteboard.tsx', code);
