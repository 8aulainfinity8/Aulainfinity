const fs = require('fs');
let wbCode = fs.readFileSync('src/components/Whiteboard.tsx', 'utf8');

const badToggle = `const toggleAllowStudentDrawing = async () => {
        if (!isTeacher) return;
        const nextState = !allowStudentDrawing;
        setAllowStudentDrawing(nextState);
        if (user?.role === 'admin') {
            try {
                const boardMetaRef = doc(db, 'whiteboardMeta', courseId);
                await setDoc(boardMetaRef, { allowStudentDrawing: nextState }, { merge: true });
            } catch (err) {
                console.error("Error updating student drawing permission:", err);
            }
        }
        showToast(nextState ? "✍️ Permisos de escritura activados para los alumnos" : "🔒 Alumnos puestos en modo solo lectura");
    // skip the original catch below by commenting it or replacing the whole block            showToast(nextState ? "✏️ Permisos de escritura activados para los alumnos" : "🔒 Alumnos puestos en modo solo lectura");
        } catch (err) {
            console.error("Error updating student drawing permission:", err);
        }
    };`;

const goodToggle = `    const toggleAllowStudentDrawing = async () => {
        if (!isTeacher) return;
        const nextState = !allowStudentDrawing;
        setAllowStudentDrawing(nextState);
        if (user?.role === 'admin') {
            try {
                const boardMetaRef = doc(db, 'whiteboardMeta', courseId);
                await setDoc(boardMetaRef, { allowStudentDrawing: nextState }, { merge: true });
            } catch (err) {
                console.error("Error updating student drawing permission:", err);
            }
        }
        showToast(nextState ? "✏️ Permisos de escritura activados para los alumnos" : "🔒 Alumnos puestos en modo solo lectura");
    };`;

wbCode = wbCode.replace(/const toggleAllowStudentDrawing = async \(\) => \{[\s\S]*?catch \(err\) \{\n\s*console\.error\("Error updating student drawing permission:", err\);\n\s*\}\n\s*\};/, goodToggle);
fs.writeFileSync('src/components/Whiteboard.tsx', wbCode);
