const fs = require('fs');

// --- 1. Fix src/services/firestoreSync.ts ---
let code = fs.readFileSync('src/services/firestoreSync.ts', 'utf8');

// Fix 0: deleted_items
const deletedPattern = /\/\/ 0\. Sync deleted items blacklist across browser reloads[\s\S]*?onSnapshot\(deletedRef, \(snapshot: any\) => \{[\s\S]*?\}, \(err: any\) => console\.warn\('\[FirestoreSync\] deleted_items listener warning:', err\.message\)\);/;
const deletedReplacement = `// 0. Sync deleted items blacklist across browser reloads
        if (currentUserObj?.role === 'admin') {
            const deletedRef = collection(db, 'firestore_deleted_items');
            getDocs(deletedRef).then(snapshot => {
                snapshot.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const idVal = data.id || docSnap.id;
                    const type = data.type || 'user';
                    if (idVal) {
                        dbMock.markItemAsDeleted(idVal, type);
                    }
                });
            }).catch(err => console.warn('[FirestoreSync] Initial deleted_items fetch warning:', err.message));

            onSnapshot(deletedRef, (snapshot: any) => {
                snapshot.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const idVal = data.id || docSnap.id;
                    const type = data.type || 'user';
                    if (idVal) {
                        dbMock.markItemAsDeleted(idVal, type);
                    }
                });
            }, (err: any) => console.warn('[FirestoreSync] deleted_items listener warning:', err.message));
        }`;
code = code.replace(deletedPattern, deletedReplacement);

// Fix 4.6b: closed convos
const closedPattern = /\/\/ 4\.6b\. Closed Support Conversations Real-time Sync\n\s*const closedConvosRef = collection\(db, 'firestore_closed_conversations'\);\n\s*onSnapshot\(closedConvosRef, \(snapshot: any\) => \{([\s\S]*?)\}, \(err: any\) => handleSyncError\('Firestore closed convos sync:', err\)\);/;
const closedReplacement = `// 4.6b. Closed Support Conversations Real-time Sync
        if (currentUserObj?.role === 'admin') {
            const closedConvosRef = collection(db, 'firestore_closed_conversations');
            onSnapshot(closedConvosRef, (snapshot: any) => {$1}, (err: any) => handleSyncError('Firestore closed convos sync:', err));
        }`;
code = code.replace(closedPattern, closedReplacement);

// Fix 6: Agenda Events
const agendaPattern = /\/\/ 6\. Agenda Events sync \(firestore_agenda_events\)\n\s*const agendaRef = collection\(db, 'firestore_agenda_events'\);\n\s*onSnapshot\(agendaRef, \(snapshot: any\) => \{([\s\S]*?)\}, \(err: any\) => handleSyncError\('Firestore agenda sync:', err\)\);/;
const agendaReplacement = `// 6. Agenda Events sync (firestore_agenda_events)
        if (currentUserObj?.role === 'admin') {
            const agendaRef = collection(db, 'firestore_agenda_events');
            onSnapshot(agendaRef, (snapshot: any) => {$1}, (err: any) => handleSyncError('Firestore agenda sync:', err));
        }`;
code = code.replace(agendaPattern, agendaReplacement);

// Fix 7: Comments
const commentsPattern = /\/\/ 7\. Comments sync \(firestore_comments\)\n\s*const commentsRef = collection\(db, 'firestore_comments'\);\n\s*onSnapshot\(commentsRef, \(snapshot: any\) => \{([\s\S]*?)\}, \(err: any\) => handleSyncError\('Firestore comments sync:', err\)\);/;
const commentsReplacement = `// 7. Comments sync (firestore_comments)
        if (currentUserObj?.role === 'admin') {
            const commentsRef = collection(db, 'firestore_comments');
            onSnapshot(commentsRef, (snapshot: any) => {$1}, (err: any) => handleSyncError('Firestore comments sync:', err));
        }`;
code = code.replace(commentsPattern, commentsReplacement);

// Fix 8: Topic Requests
const topicPattern = /\/\/ 8\. Topic Requests sync \(firestore_topic_requests\)\n\s*const topicRequestsRef = collection\(db, 'firestore_topic_requests'\);\n\s*onSnapshot\(topicRequestsRef, \(snapshot: any\) => \{([\s\S]*?)\}, \(err: any\) => handleSyncError\('Firestore topic requests sync:', err\)\);/;
const topicReplacement = `// 8. Topic Requests sync (firestore_topic_requests)
        let topicRequestsQuery: any = null;
        if (isStudentRole && currentAuth) {
            topicRequestsQuery = query(collection(db, 'firestore_topic_requests'), where('studentId', '==', currentAuth.uid));
        } else if (currentUserObj?.role === 'admin' || isTeacherRole) {
            topicRequestsQuery = collection(db, 'firestore_topic_requests');
        }
        if (topicRequestsQuery) {
            onSnapshot(topicRequestsQuery, (snapshot: any) => {$1}, (err: any) => handleSyncError('Firestore topic requests sync:', err));
        }`;
code = code.replace(topicPattern, topicReplacement);

// Fix 9: Student Answers
const answersPattern = /\/\/ 9\. Student Answers sync \(quiz_answers\)\n\s*const answersRef = collection\(db, 'quiz_answers'\);\n\s*let answersQuery = answersRef as any;\n\s*if \(isStudentRole && currentAuth\) answersQuery = query\(answersRef, where\('studentId', '==', currentAuth\.uid\)\);\n\s*onSnapshot\(answersQuery, \(snapshot: any\) => \{([\s\S]*?)\}, \(err: any\) => handleSyncError\('Firestore student answers sync:', err\)\);/;
const answersReplacement = `// 9. Student Answers sync (quiz_answers)
        let answersQuery: any = null;
        if (isStudentRole && currentAuth) {
            answersQuery = query(collection(db, 'quiz_answers'), where('studentId', '==', currentAuth.uid));
        } else if (currentUserObj?.role === 'admin' || isTeacherRole) {
            answersQuery = collection(db, 'quiz_answers');
        }
        if (answersQuery) {
            onSnapshot(answersQuery, (snapshot: any) => {$1}, (err: any) => handleSyncError('Firestore student answers sync:', err));
        }`;
code = code.replace(answersPattern, answersReplacement);

// Fix 10: Infinity Transactions
const txPattern = /\/\/ 10\. Infinity Transactions sync \(infinity_transactions\)\n\s*const txRef = collection\(db, 'infinity_transactions'\);\n\s*onSnapshot\(txRef, \(snapshot: any\) => \{([\s\S]*?)\}, \(err: any\) => handleSyncError\('Firestore infinity transactions sync:', err\)\);/;
const txReplacement = `// 10. Infinity Transactions sync (infinity_transactions)
        if (currentUserObj?.role === 'admin') {
            const txRef = collection(db, 'infinity_transactions');
            onSnapshot(txRef, (snapshot: any) => {$1}, (err: any) => handleSyncError('Firestore infinity transactions sync:', err));
        }`;
code = code.replace(txPattern, txReplacement);

// Fix 13: Student Payments
const paymentsPattern = /\/\/ 13\. Student Payments sync\n\s*const studentPaymentsRef = collection\(db, 'student_payments'\);\n\s*const studentPaymentsQuery = isStudentRole && currentAuth\n\s*\? query\(studentPaymentsRef, where\('studentId', '==', currentAuth\.uid\)\)\n\s*: studentPaymentsRef;\n\s*onSnapshot\(studentPaymentsQuery, \(snapshot: any\) => \{([\s\S]*?)\}, \(err: any\) => handleSyncError\('Firestore student payments sync:', err\)\);/;
const paymentsReplacement = `// 13. Student Payments sync
        let studentPaymentsQuery: any = null;
        if (isStudentRole && currentAuth) {
            studentPaymentsQuery = query(collection(db, 'student_payments'), where('studentId', '==', currentAuth.uid));
        } else if (currentUserObj?.role === 'admin') {
            studentPaymentsQuery = collection(db, 'student_payments');
        }
        if (studentPaymentsQuery) {
            onSnapshot(studentPaymentsQuery, (snapshot: any) => {$1}, (err: any) => handleSyncError('Firestore student payments sync:', err));
        }`;
code = code.replace(paymentsPattern, paymentsReplacement);

// Fix 14: Student Expenses
const expensesPattern = /\/\/ 14\. Student Expenses sync\n\s*const studentExpensesRef = collection\(db, 'student_expenses'\);\n\s*const studentExpensesQuery = isStudentRole && currentAuth\n\s*\? query\(studentExpensesRef, where\('studentId', '==', currentAuth\.uid\)\)\n\s*: studentExpensesRef;\n\s*onSnapshot\(studentExpensesQuery, \(snapshot: any\) => \{([\s\S]*?)\}, \(err: any\) => handleSyncError\('Firestore student expenses sync:', err\)\);/;
const expensesReplacement = `// 14. Student Expenses sync
        let studentExpensesQuery: any = null;
        if (isStudentRole && currentAuth) {
            studentExpensesQuery = query(collection(db, 'student_expenses'), where('studentId', '==', currentAuth.uid));
        } else if (currentUserObj?.role === 'admin') {
            studentExpensesQuery = collection(db, 'student_expenses');
        }
        if (studentExpensesQuery) {
            onSnapshot(studentExpensesQuery, (snapshot: any) => {$1}, (err: any) => handleSyncError('Firestore student expenses sync:', err));
        }`;
code = code.replace(expensesPattern, expensesReplacement);

// Fix 15: Teacher Payments
const tPaymentsPattern = /\/\/ 15\. Teacher Payments sync\n\s*const teacherPaymentsRef = collection\(db, 'teacher_payments'\);\n\s*onSnapshot\(teacherPaymentsRef, \(snapshot: any\) => \{([\s\S]*?)\}, \(err: any\) => handleSyncError\('Firestore teacher payments sync:', err\)\);/;
const tPaymentsReplacement = `// 15. Teacher Payments sync
        let teacherPaymentsQuery: any = null;
        if (isTeacherRole && currentAuth) {
            teacherPaymentsQuery = query(collection(db, 'teacher_payments'), where('teacherId', '==', currentAuth.uid));
        } else if (currentUserObj?.role === 'admin') {
            teacherPaymentsQuery = collection(db, 'teacher_payments');
        }
        if (teacherPaymentsQuery) {
            onSnapshot(teacherPaymentsQuery, (snapshot: any) => {$1}, (err: any) => handleSyncError('Firestore teacher payments sync:', err));
        }`;
code = code.replace(tPaymentsPattern, tPaymentsReplacement);

// Fix 16: Quizzes
const quizzesPattern = /\/\/ 16\. Quizzes sync\n\s*const quizzesRef = collection\(db, 'firestore_quizzes'\);\n\s*onSnapshot\(quizzesRef, \(snapshot: any\) => \{([\s\S]*?)\}, \(err: any\) => handleSyncError\('Firestore quizzes sync:', err\)\);/;
const quizzesReplacement = `// 16. Quizzes sync
        if (currentUserObj?.role === 'admin') {
            const quizzesRef = collection(db, 'firestore_quizzes');
            onSnapshot(quizzesRef, (snapshot: any) => {$1}, (err: any) => handleSyncError('Firestore quizzes sync:', err));
        }`;
code = code.replace(quizzesPattern, quizzesReplacement);

fs.writeFileSync('src/services/firestoreSync.ts', code);
console.log('Successfully updated src/services/firestoreSync.ts');

// --- 2. Fix src/components/RealtimeAlertsBanner.tsx ---
let bannerCode = fs.readFileSync('src/components/RealtimeAlertsBanner.tsx', 'utf8');
bannerCode = bannerCode.replace(
    /useEffect\(\(\) => \{\s*if \(!user\) return;\s*const voice_group_callsRef = collection\(db, 'voice_group_calls'\);/,
    `useEffect(() => {\n        if (!user) return;\n        if (user.role !== 'teacher' && user.role !== 'admin') return;\n        const voice_group_callsRef = collection(db, 'voice_group_calls');`
);
fs.writeFileSync('src/components/RealtimeAlertsBanner.tsx', bannerCode);
console.log('Successfully updated src/components/RealtimeAlertsBanner.tsx');
