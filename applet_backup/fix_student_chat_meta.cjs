const fs = require('fs');
let code = fs.readFileSync('src/components/StudentChatPage.tsx', 'utf8');

const badBlock = `    // Global listener for active whiteboards across all channels
    useEffect(() => {
        if (!user || user.role !== 'admin') return;
        const q = collection(db, 'whiteboards');
        let initialLoadDone = false;
        const unsub = onSnapshot(q, (snapshot) => {
            const map: Record<string, { active: boolean; updatedBy?: string; updatedAt?: string }> = {};
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.active === true) {
                    map[docSnap.id] = {
                        active: true,
                        updatedBy: data.updatedBy,
                        updatedAt: data.updatedAt
                    };
                }
            });
            if (initialLoadDone) {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        const data = change.doc.data();
                        if (data.active === true) {
                            const boardConvoId = change.doc.id;
                            if (isConvoForUser(boardConvoId)) {
                                setGlobalToastNotice({
                                    id: \`\${boardConvoId}_\${Date.now()}\`,
                                    title: \`¡El profesor ha iniciado la Pizarra Digital en vivo!\`,
                                    convoId: boardConvoId
                                });
                            }
                        }
                    }
                });
            } else {
                initialLoadDone = true;
            }
            setActiveWhiteboards(map);
        }, (err) => {
            console.error("Error subscribing to whiteboards:", err);
        });
        return () => unsub();
    }, [isConvoForUser]);`;

const goodBlock = `    // Targeted listeners for active whiteboards across user's channels
    useEffect(() => {
        if (!user || !studentId) return;

        const relevantIds = Array.from(new Set([
            ...conversations.map(c => c.id),
            ...groupConversations.map(g => g.id),
            studentId
        ]));

        if (relevantIds.length === 0) return;

        const unsubs: (() => void)[] = [];
        const currentMap = { ...activeWhiteboards };
        let hasChanges = false;

        relevantIds.forEach(boardId => {
            const docRef = doc(db, 'whiteboards', boardId);
            const unsub = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.active === true) {
                        if (!currentMap[boardId]?.active) {
                            setGlobalToastNotice({
                                id: \`\${boardId}_\${Date.now()}\`,
                                title: '¡El profesor ha iniciado la Pizarra Digital en vivo!',
                                convoId: boardId
                            });
                        }
                        currentMap[boardId] = {
                            active: true,
                            updatedBy: data.updatedBy,
                            updatedAt: data.updatedAt
                        };
                        setActiveWhiteboards({ ...currentMap });
                    } else if (currentMap[boardId]) {
                        delete currentMap[boardId];
                        setActiveWhiteboards({ ...currentMap });
                    }
                } else if (currentMap[boardId]) {
                    delete currentMap[boardId];
                    setActiveWhiteboards({ ...currentMap });
                }
            }, (err) => {
                // Silently ignore permissions for ids we don't own
            });
            unsubs.push(unsub);
        });

        return () => unsubs.forEach(u => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId, conversations, groupConversations]);`;

code = code.replace(badBlock, goodBlock);

// Also remove the `user?.role === 'admin'` check for single whiteboard in StudentChatPage:
const badSingleBoard = `    useEffect(() => {
        if (activeConvoId && user?.role === 'admin') {
            const boardMetaRef = doc(db, 'whiteboards', activeConvoId);
            const unsubBoard = onSnapshot(boardMetaRef, (snapshot) => {`;

const goodSingleBoard = `    useEffect(() => {
        if (activeConvoId) {
            const boardMetaRef = doc(db, 'whiteboards', activeConvoId);
            const unsubBoard = onSnapshot(boardMetaRef, (snapshot) => {`;

code = code.replace(badSingleBoard, goodSingleBoard);

fs.writeFileSync('src/components/StudentChatPage.tsx', code);
