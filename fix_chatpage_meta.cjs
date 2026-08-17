const fs = require('fs');
let code = fs.readFileSync('src/components/ChatPage.tsx', 'utf8');

const badBlock = `            let boardUnsub = () => {};
            if (user?.role === 'admin') {
                const boardRef = doc(db, 'whiteboards', rId);
                boardUnsub = onSnapshot(boardRef, (snap) => {
                    activeBoardMap[rId] = snap.exists() && snap.data()?.active === true;
                    setIsWhiteboardActive(Object.values(activeBoardMap).some(Boolean));
                });
            }`;

const goodBlock = `            const boardRef = doc(db, 'whiteboards', rId);
            const boardUnsub = onSnapshot(boardRef, (snap) => {
                activeBoardMap[rId] = snap.exists() && snap.data()?.active === true;
                setIsWhiteboardActive(Object.values(activeBoardMap).some(Boolean));
            }, () => {});`;

code = code.replace(badBlock, goodBlock);
fs.writeFileSync('src/components/ChatPage.tsx', code);
