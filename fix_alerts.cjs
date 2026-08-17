const fs = require('fs');
let content = fs.readFileSync('src/components/RealtimeAlertsBanner.tsx', 'utf8');

// The voice_group_calls effect
const voiceGroupEffectRegex = /\/\/ Escuchar salas de voz activas en tiempo real desde Firebase Firestore[\s\S]*?useEffect\(\(\) => \{[\s\S]*?const voice_group_callsRef = collection\(db, 'voice_group_calls'\);[\s\S]*?return \(\) => unsub\(\);\n    \}, \[hasFirebaseClaims\]\);/g;

const newVoiceGroupEffect = `
    // Escuchar salas de voz activas en tiempo real desde Firebase Firestore
    useEffect(() => {
        if (!user) return;

        let unsubs: (() => void)[] = [];

        const handleVoiceSnapshot = (activeRooms: ActiveVoiceRoom[], docSnap: any) => {
            const data = docSnap.data() as any;
            if (!data) return;
            const participants = data.participants || [];
            const now = Date.now();
            
            let isStale = false;
            if (data.updatedAt) {
                const updatedMs = typeof data.updatedAt?.toMillis === 'function' ? data.updatedAt.toMillis() : new Date(data.updatedAt).getTime();
                if (!isNaN(updatedMs) && (now - updatedMs > 5 * 60 * 1000)) {
                    isStale = true;
                }
            }
            if (data.active === true && Array.isArray(participants) && participants.length > 0 && !isStale) {
                activeRooms.push({
                    id: docSnap.id,
                    courseId: data.courseId || docSnap.id,
                    active: true,
                    participants,
                    updatedAt: data.updatedAt
                });
            }
        };

        if (hasFirebaseClaims) {
            // Admins and approved teachers can listen to the entire collection
            const voice_group_callsRef = collection(db, 'voice_group_calls');
            const unsub = onSnapshot(voice_group_callsRef, (snapshot) => {
                const activeRooms: ActiveVoiceRoom[] = [];
                snapshot.forEach((docSnap) => {
                    handleVoiceSnapshot(activeRooms, docSnap);
                });
                setActiveVoiceRooms(activeRooms);
                
                setCurrentAlert(prev => {
                    if (prev?.type === 'call') {
                        const isStillActive = activeRooms.some(r => (r.courseId || r.id) === prev.courseId);
                        if (!isStillActive) return null;
                    }
                    return prev;
                });
            }, (err) => console.warn('Firestore active voice rooms listener:', err.message));
            unsubs.push(unsub);
        } else if (user.role === 'student' && (user as any).enrolledCourseIds?.length > 0) {
            // Students listen to their specific enrolled courses
            const activeRoomsMap = new Map<string, ActiveVoiceRoom>();
            (user as any).enrolledCourseIds.forEach((courseId: string) => {
                const docRef = doc(db, 'voice_group_calls', courseId);
                const unsub = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const tempRooms: ActiveVoiceRoom[] = [];
                        handleVoiceSnapshot(tempRooms, docSnap);
                        if (tempRooms.length > 0) {
                            activeRoomsMap.set(docSnap.id, tempRooms[0]);
                        } else {
                            activeRoomsMap.delete(docSnap.id);
                        }
                    } else {
                        activeRoomsMap.delete(docSnap.id);
                    }
                    
                    const activeRooms = Array.from(activeRoomsMap.values());
                    setActiveVoiceRooms(activeRooms);
                    
                    setCurrentAlert(prev => {
                        if (prev?.type === 'call') {
                            const isStillActive = activeRooms.some(r => (r.courseId || r.id) === prev.courseId);
                            if (!isStillActive) return null;
                        }
                        return prev;
                    });
                }, (err) => {
                    // Ignore missing permissions for specific docs
                });
                unsubs.push(unsub);
            });
        }

        return () => {
            unsubs.forEach(u => u());
        };
    }, [hasFirebaseClaims, user]);
`;

content = content.replace(voiceGroupEffectRegex, newVoiceGroupEffect.trim());

// The whiteboard effect
const whiteboardEffectRegex = /\/\/ Escuchar pizarras digitales activas en tiempo real desde Firebase Firestore[\s\S]*?useEffect\(\(\) => \{[\s\S]*?const boardMetaRef = collection\(db, 'whiteboards'\);[\s\S]*?const unsub = onSnapshot\(boardMetaRef, \(snapshot\) => \{[\s\S]*?return \(\) => unsub\(\);\n    \}, \[hasFirebaseClaims\]\);/g;

const newWhiteboardEffect = `
    // Escuchar pizarras digitales activas en tiempo real desde Firebase Firestore
    useEffect(() => {
        if (!user) return;

        let unsubs: (() => void)[] = [];
        let initialLoadDone = false;
        setTimeout(() => { initialLoadDone = true; }, 1500);

        const handleDocSnapshot = (docSnap: any) => {
            if (!initialLoadDone) return;
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.active === true) {
                    const boardId = docSnap.id;
                    if (isRoomForUser(boardId)) {
                        if (data.updatedBy && user?.name && data.updatedBy.includes(user.name)) {
                            return;
                        }
                        const teacherName = data.updatedBy || 'Profesor';
                        const newAlert: RealtimeAlert = {
                            id: \`board_\${boardId}_\${Date.now()}\`,
                            type: 'whiteboard',
                            title: \`🎨 ¡El profesor \${teacherName} ha abierto la Pizarra Digital!\`,
                            body: \`El profesor ha activado la Pizarra Digital en directo. Toca para unirte y ver el contenido.\`,
                            courseId: boardId,
                            conversationId: boardId,
                            timestamp: Date.now()
                        };

                        playNotificationChime();
                        setCurrentAlert(newAlert);
                        if (timerRef.current) clearTimeout(timerRef.current);
                        timerRef.current = setTimeout(() => {
                            setCurrentAlert(null);
                        }, 5000);
                    }
                }
            }
        };

        if (hasFirebaseClaims) {
            const boardMetaRef = collection(db, 'whiteboards');
            const unsub = onSnapshot(boardMetaRef, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        handleDocSnapshot(change.doc);
                    }
                });
            }, (err) => console.warn('Whiteboard global listener error:', err.message));
            unsubs.push(unsub);
        } else if (user.role === 'student' && (user as any).enrolledCourseIds?.length > 0) {
            (user as any).enrolledCourseIds.forEach((id: string) => {
                const docRef = doc(db, 'whiteboards', id);
                const unsub = onSnapshot(docRef, (docSnap) => {
                    handleDocSnapshot(docSnap);
                }, (err) => {
                    // Ignore missing permissions for specific docs
                });
                unsubs.push(unsub);
            });
        }

        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, [hasFirebaseClaims, user, isRoomForUser, playNotificationChime]);
`;

content = content.replace(whiteboardEffectRegex, newWhiteboardEffect.trim());

fs.writeFileSync('src/components/RealtimeAlertsBanner.tsx', content);
console.log('RealtimeAlertsBanner.tsx updated.');
