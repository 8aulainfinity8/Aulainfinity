const fs = require('fs');
let code = fs.readFileSync('src/components/StudentChatPage.tsx', 'utf8');

const badVoice = `            const voiceRef = doc(db, 'voice_group_calls', activeConvoId);
            const unsubVoice = onSnapshot(voiceRef, (snapshot) => {
                const data = snapshot.exists() ? snapshot.data() : null;
                const participants = data?.participants || [];
                const isActive = data?.active === true && Array.isArray(participants) && participants.length > 0;
                setIsVoiceCallActive(isActive);
            });`;

const goodVoice = `            let unsubVoice = () => {};
            if (activeConvoId.includes(studentId)) {
                const voiceRef = doc(db, 'voice_group_calls', activeConvoId);
                unsubVoice = onSnapshot(voiceRef, (snapshot) => {
                    const data = snapshot.exists() ? snapshot.data() : null;
                    const participants = data?.participants || [];
                    const isActive = data?.active === true && Array.isArray(participants) && participants.length > 0;
                    setIsVoiceCallActive(isActive);
                }, () => {});
            }`;

code = code.replace(badVoice, goodVoice);
fs.writeFileSync('src/components/StudentChatPage.tsx', code);
