const fs = require('fs');
let code = fs.readFileSync('src/components/ChatPage.tsx', 'utf8');

const badBlock = `            let boardUnsub = () => {};
            if (user?.role === 'admin') {
                const boardRef = doc(db, 'whiteboardMeta', rId);
                boardUnsub = onSnapshot(boardRef, (snap) => {
                    activeBoardMap[rId] = snap.exists() && snap.data()?.active === true;
                    setIsWhiteboardActive(Object.values(activeBoardMap).some(Boolean));
                });
            }
                activeBoardMap[rId] = snap.exists() && snap.data()?.active === true;
                setIsWhiteboardActive(Object.values(activeBoardMap).some(Boolean));
            });`;

const goodBlock = `            let boardUnsub = () => {};
            if (user?.role === 'admin') {
                const boardRef = doc(db, 'whiteboardMeta', rId);
                boardUnsub = onSnapshot(boardRef, (snap) => {
                    activeBoardMap[rId] = snap.exists() && snap.data()?.active === true;
                    setIsWhiteboardActive(Object.values(activeBoardMap).some(Boolean));
                });
            }`;

code = code.replace(badBlock, goodBlock);
fs.writeFileSync('src/components/ChatPage.tsx', code);
