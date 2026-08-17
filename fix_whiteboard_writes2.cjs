const fs = require('fs');
let code = fs.readFileSync('src/components/Whiteboard.tsx', 'utf8');

// 1. changeBgPattern
const oldPattern = `    const changeBgPattern = async (pattern: string) => {
        setBgPattern(pattern);
        localStorage.setItem('whiteboard_bg_pattern', pattern);
        try {
            const boardMetaRef = doc(db, 'whiteboardMeta', courseId);
            await setDoc(boardMetaRef, { bgPattern: pattern }, { merge: true });
        } catch (err) {
            console.error("Error setting whiteboard bgPattern: ", err);
        }
    };`;

const newPattern = `    const changeBgPattern = async (pattern: string) => {
        setBgPattern(pattern);
        localStorage.setItem('whiteboard_bg_pattern', pattern);
        if (user?.role === 'admin') {
            try {
                const boardMetaRef = doc(db, 'whiteboardMeta', courseId);
                await setDoc(boardMetaRef, { bgPattern: pattern }, { merge: true });
            } catch (err) {
                console.error("Error setting whiteboard bgPattern: ", err);
            }
        }
    };`;
code = code.replace(oldPattern, newPattern);

// 2. handleConfirmCloseAndClearBoard
const oldClose = `            if (db && courseId) {
                // Deactivate board in meta
                const docRef = doc(db, 'whiteboardMeta', courseId);
                await setDoc(docRef, {
                    active: false,
                    closedAt: new Date().toISOString(),
                    closedBy: user?.name || 'Profesor'
                }, { merge: true }).catch(() => {});`;

const newClose = `            if (db && courseId) {
                // Deactivate board in meta
                if (user?.role === 'admin') {
                    const docRef = doc(db, 'whiteboardMeta', courseId);
                    await setDoc(docRef, {
                        active: false,
                        closedAt: new Date().toISOString(),
                        closedBy: user?.name || 'Profesor'
                    }, { merge: true }).catch(() => {});
                }`;
code = code.replace(oldClose, newClose);

// 3. toggleActivateBoard
const oldToggle = `        const nextState = true;
        try {
            const docRef = doc(db, 'whiteboardMeta', courseId);
            await setDoc(docRef, { active: nextState, updatedBy: user?.name, updatedAt: new Date().toISOString() }, { merge: true });
            setIsActive(nextState);
            setTool('pencil');
        } catch (e) {
            console.error('Error toggling whiteboard active index: ', e);
        }`;

const newToggle = `        const nextState = true;
        try {
            if (user?.role === 'admin') {
                const docRef = doc(db, 'whiteboardMeta', courseId);
                await setDoc(docRef, { active: nextState, updatedBy: user?.name, updatedAt: new Date().toISOString() }, { merge: true });
            }
            setIsActive(nextState);
            setTool('pencil');
        } catch (e) {
            console.error('Error toggling whiteboard active index: ', e);
        }`;
code = code.replace(oldToggle, newToggle);

fs.writeFileSync('src/components/Whiteboard.tsx', code);
