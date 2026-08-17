const fs = require('fs');
let code = fs.readFileSync('src/services/firestoreSync.ts', 'utf8');

const bad18 = `        // 18. Student Friends sync
        const friendsRef = collection(db, 'student_friends');
        const friendsQuery = isStudentRole && currentAuth
            ? query(friendsRef, where('studentId', '==', currentAuth.uid))
            : friendsRef;
        onSnapshot(friendsQuery, (snapshot: any) => {`;

const good18 = `        // 18. Student Friends sync
        if (currentUserObj?.role === 'admin') {
            const friendsRef = collection(db, 'student_friends');
            const friendsQuery = isStudentRole && currentAuth
                ? query(friendsRef, where('studentId', '==', currentAuth.uid))
                : friendsRef;
            onSnapshot(friendsQuery, (snapshot: any) => {`;

code = code.replace(bad18, good18).replace(/eventEmitter\.emit\('student-friends-updated'\);\n\s*\}\n\s*\}\);\n\s*\}, \(err: any\) => handleSyncError\('Firestore student friends sync:', err\)\);/, `eventEmitter.emit('student-friends-updated');
                }
            });
        }, (err: any) => handleSyncError('Firestore student friends sync:', err));
        }`);


const bad19 = `        // 19. AI Query Logs sync
        const aiLogsRef = collection(db, 'ai_query_logs');
        const aiLogsQuery = currentAuth && (!currentUserObj || currentUserObj.role !== 'admin')
            ? query(aiLogsRef, where('userId', '==', currentAuth.uid))
            : aiLogsRef;
        onSnapshot(aiLogsQuery, (snapshot: any) => {`;

const good19 = `        // 19. AI Query Logs sync
        if (currentUserObj?.role === 'admin') {
            const aiLogsRef = collection(db, 'ai_query_logs');
            const aiLogsQuery = currentAuth && (!currentUserObj || currentUserObj.role !== 'admin')
                ? query(aiLogsRef, where('userId', '==', currentAuth.uid))
                : aiLogsRef;
            onSnapshot(aiLogsQuery, (snapshot: any) => {`;

code = code.replace(bad19, good19).replace(/eventEmitter\.emit\('ai-logs-updated'\);\n\s*\}\n\s*\}\);\n\s*\}, \(err: any\) => handleSyncError\('Firestore ai logs sync:', err\)\);/, `eventEmitter.emit('ai-logs-updated');
                }
            });
        }, (err: any) => handleSyncError('Firestore ai logs sync:', err));
        }`);


const bad20 = `        // 20. User Seen States sync
        const userSeenStatesRef = doc(db, 'firestore_user_seen_states', 'main');
        onSnapshot(userSeenStatesRef, (docSnap) => {`;

const good20 = `        // 20. User Seen States sync
        if (currentUserObj?.role === 'admin') {
            const userSeenStatesRef = doc(db, 'firestore_user_seen_states', 'main');
            onSnapshot(userSeenStatesRef, (docSnap) => {`;

code = code.replace(bad20, good20).replace(/eventEmitter\.emit\('user-seen-states-updated', dbMock\.userSeenStates\);\n\s*\}\n\s*\}, \(err: any\) => handleSyncError\('Firestore user seen states sync:', err\)\);/, `eventEmitter.emit('user-seen-states-updated', dbMock.userSeenStates);
            }
        }, (err: any) => handleSyncError('Firestore user seen states sync:', err));
        }`);

fs.writeFileSync('src/services/firestoreSync.ts', code);
