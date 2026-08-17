const fs = require('fs');

// --- 1. firestore_deleted_items ---
let syncCode = fs.readFileSync('src/services/firestoreSync.ts', 'utf8');
syncCode = syncCode.replace(
    /const deletedRef = collection\(db, 'firestore_deleted_items'\);\n\s*getDocs\(deletedRef\)\.then\(\(snapshot: any\) => \{[\s\S]*?\}\)\.catch\(err => console\.warn\('\[FirestoreSync\] Initial deleted_items fetch warning:', err\.message\)\);\n\s*onSnapshot\(deletedRef, \(snapshot: any\) => \{[\s\S]*?\}, \(err: any\) => handleSyncError\('Firestore deleted items sync:', err\)\);/,
    `if (currentUserObj?.role === 'admin') {
            const deletedRef = collection(db, 'firestore_deleted_items');
            getDocs(deletedRef).then((snapshot: any) => {
                snapshot.docs.forEach((docSnap: any) => {
                    const data = docSnap.data();
                    const idVal = data.id || docSnap.id;
                    const type = data.type || 'user';
                    if (idVal) {
                        dbMock.markItemAsDeleted(idVal, type);
                    }
                });
            }).catch(err => console.warn('[FirestoreSync] Initial deleted_items fetch warning:', err.message));
            onSnapshot(deletedRef, (snapshot: any) => {
                snapshot.docs.forEach((docSnap: any) => {
                    const data = docSnap.data();
                    const idVal = data.id || docSnap.id;
                    const type = data.type || 'user';
                    if (idVal) {
                        dbMock.markItemAsDeleted(idVal, type);
                    }
                });
                eventEmitter.emit('deleted-items-updated');
            }, (err: any) => handleSyncError('Firestore deleted items sync:', err));
        }`
);

// --- 2. whiteboardMeta ---
// The user noted that if we just wrap whiteboardMeta in admin it breaks the whiteboard.
// Since the rules don't define whiteboardMeta, the fallback denies it. But whiteboards/{id} IS allowed.
// Let's replace 'whiteboardMeta' with 'whiteboards' wherever we refer to a doc: doc(db, 'whiteboardMeta', id) -> doc(db, 'whiteboards', id)
// However, collection(db, 'whiteboardMeta') is used for global active boards tracking. 
