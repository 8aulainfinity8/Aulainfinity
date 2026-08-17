const fs = require('fs');
let content = fs.readFileSync('src/components/StudentChatPage.tsx', 'utf8');

const regex = /\/\/ Global listener for active whiteboards across all channels[\s\S]*?\}, \[isConvoForUser\]\);/g;

const replacement = `
    // Listen for active whiteboards for the specific courses the student is enrolled in
    useEffect(() => {
        if (!user || user.role !== 'student' || !(user as any).enrolledCourseIds) return;

        let unsubs: (() => void)[] = [];
        let map: Record<string, { active: boolean; updatedBy?: string; updatedAt?: string }> = {};
        
        (user as any).enrolledCourseIds.forEach((courseId: string) => {
            const docRef = doc(db, 'whiteboards', courseId);
            const unsub = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.active === true) {
                        map[docSnap.id] = {
                            active: true,
                            updatedBy: data.updatedBy,
                            updatedAt: data.updatedAt
                        };
                        
                        // Show toast notice if it's new
                        if (isConvoForUser(docSnap.id)) {
                            // In a real app we'd track if we already showed it, but this is simplified
                            // We can rely on RealtimeAlertsBanner to show the actual toast, 
                            // this map is mostly for the UI badges
                        }
                    } else {
                        delete map[docSnap.id];
                    }
                } else {
                    delete map[docSnap.id];
                }
                setActiveWhiteboards({ ...map });
            }, (err) => {
                console.warn("Error subscribing to specific whiteboard:", err.message);
            });
            unsubs.push(unsub);
        });
        
        // Admins use a separate global listener in AdminChatPage, no need here since this is StudentChatPage

        return () => {
            unsubs.forEach(u => u());
        };
    }, [user, isConvoForUser]);
`;

content = content.replace(regex, replacement.trim());
fs.writeFileSync('src/components/StudentChatPage.tsx', content);
console.log('StudentChatPage.tsx updated.');
