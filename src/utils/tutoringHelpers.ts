/**
 * Helper to check if a teacher matches a tutoring request subject based on their category or subjects list.
 */
function normalizeStr(str: string): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export const isTeacherMatchForSubject = (teacherCategory?: string, subjectName?: string, teacherSubjects?: string[]): boolean => {
    if (!subjectName) return true;
    const sub = normalizeStr(subjectName);
    if (!sub) return true;

    // Wildcard check helper
    const isWildcard = (val: string) => {
        const clean = normalizeStr(val);
        return clean === 'all' || clean === 'todas' || clean === 'todos' || clean === 'general' || clean.includes('todas las materias');
    };

    if (Array.isArray(teacherSubjects) && teacherSubjects.length > 0) {
        if (teacherSubjects.some(s => {
            if (!s) return false;
            if (isWildcard(s)) return true;
            const sNorm = normalizeStr(s);
            return sNorm === sub || sub.includes(sNorm) || sNorm.includes(sub);
        })) {
            return true;
        }
    }

    if (!teacherCategory && (!teacherSubjects || teacherSubjects.length === 0)) {
        return true; // No restrictions specified
    }

    if (teacherCategory) {
        if (isWildcard(teacherCategory)) return true;
        const cat = normalizeStr(teacherCategory);
        
        // Check direct substring matches
        if (sub.includes(cat) || cat.includes(sub)) return true;
        
        // Subject specific rules
        if (cat.includes('matematica') || cat.includes('mate')) {
            if (
                sub.includes('mate') || 
                sub.includes('algebra') || 
                sub.includes('calculo') || 
                sub.includes('geometria') ||
                sub.includes('numero') ||
                sub.includes('ecuacion')
            ) {
                return true;
            }
        }
        
        if (cat.includes('fisica') || cat.includes('quimica') || cat.includes('fyq')) {
            if (
                sub.includes('fis') || 
                sub.includes('quim') || 
                sub.includes('termodinamica') ||
                sub.includes('cinematica') ||
                sub.includes('dinamica') ||
                sub.includes('materia') ||
                sub.includes('atomo') ||
                sub.includes('gravedad')
            ) {
                return true;
            }
        }

        if (cat.includes('programacion') || cat.includes('informatica') || cat.includes('software')) {
            if (
                sub.includes('prog') ||
                sub.includes('python') ||
                sub.includes('javascript') ||
                sub.includes('c++') ||
                sub.includes('codigo') ||
                sub.includes('software') ||
                sub.includes('web')
            ) {
                return true;
            }
        }

        if (cat.includes('ingles') || cat.includes('english')) {
            if (sub.includes('ingl') || sub.includes('english')) return true;
        }

        if (cat.includes('lengua') || cat.includes('literatura')) {
            if (sub.includes('lengua') || sub.includes('literat')) return true;
        }

        if (cat.includes('biologia') || cat.includes('geologia')) {
            if (sub.includes('bio') || sub.includes('geo') || sub.includes('natural')) return true;
        }

        if (cat.includes('historia')) {
            if (sub.includes('histor')) return true;
        }

        if (cat.includes('filosofia')) {
            if (sub.includes('filoso')) return true;
        }
    }

    return false;
};

export const isTutoringRequestForTeacher = (
    req: { teacherId?: string; teacherName?: string; subject?: string } | null | undefined,
    user: any,
    teachersList?: any[]
): boolean => {
    if (!req || !user) return false;
    if (user.role === 'admin') return true;
    if (user.role !== 'teacher') return false;

    const teacherId = user.id ? String(user.id) : '';
    const teacherUid = user.uid || user.firebaseUid ? String(user.uid || user.firebaseUid) : '';
    const teacherEmail = user.email ? String(user.email).toLowerCase().trim() : '';
    const teacherName = user.name ? String(user.name).toLowerCase().trim() : '';

    // 1. Direct ID / UID / Firebase UID / Email match
    if (req.teacherId) {
        const reqTid = String(req.teacherId).trim();
        const reqTidLower = reqTid.toLowerCase();

        if (
            reqTid === teacherId ||
            (teacherUid && reqTid === teacherUid) ||
            (teacherEmail && reqTidLower === teacherEmail)
        ) {
            return true;
        }

        // 2. Teacher Name match
        if (req.teacherName && teacherName && String(req.teacherName).toLowerCase().trim() === teacherName) {
            return true;
        }

        // 3. Alias / default teacher list match
        if (Array.isArray(teachersList) && teachersList.length > 0) {
            const matchedTeacher = teachersList.find(t => 
                t && (
                    String(t.id) === reqTid || 
                    String(t.uid) === reqTid || 
                    String(t.firebaseUid) === reqTid
                )
            );
            if (matchedTeacher) {
                if (
                    String(matchedTeacher.id) === teacherId ||
                    (teacherUid && String(matchedTeacher.id) === teacherUid) ||
                    (teacherEmail && String(matchedTeacher.email || '').toLowerCase().trim() === teacherEmail) ||
                    (teacherName && String(matchedTeacher.name || '').toLowerCase().trim() === teacherName)
                ) {
                    return true;
                }
            }
        }
    }

    // 4. "first_available", empty teacherId, or unassigned request
    if (!req.teacherId || req.teacherId === 'first_available' || req.teacherId === 'unassigned') {
        return isTeacherMatchForSubject(user.category, req.subject, user.subjects);
    }

    // 5. Subject match fallback: if the teacher teaches this subject
    if (isTeacherMatchForSubject(user.category, req.subject, user.subjects)) {
        return true;
    }

    return false;
};

/**
 * Helper to check if a tutoring session can be cancelled by student (at least 24h prior).
 */
export const isCancellableSession = (dateStr?: string, timeStr?: string): { cancellable: boolean; hoursRemaining: number } => {
    if (!dateStr) return { cancellable: true, hoursRemaining: 999 };
    try {
        let cleanDate = dateStr;
        if (cleanDate.includes('T')) {
            cleanDate = cleanDate.split('T')[0];
        }
        let year = 0, month = 0, day = 0;
        if (cleanDate.includes('-')) {
            const parts = cleanDate.split('-').map(Number);
            year = parts[0];
            month = parts[1];
            day = parts[2];
        } else if (cleanDate.includes('/')) {
            const parts = cleanDate.split('/').map(Number);
            if (parts[2] > 1000) {
                day = parts[0];
                month = parts[1];
                year = parts[2];
            } else {
                year = parts[0];
                month = parts[1];
                day = parts[2];
            }
        } else {
            return { cancellable: true, hoursRemaining: 999 };
        }

        let hours = 12, minutes = 0;
        if (timeStr && timeStr.includes(':')) {
            const tParts = timeStr.split(':').map(Number);
            hours = tParts[0] || 0;
            minutes = tParts[1] || 0;
        }

        const sessionDate = new Date(year, month - 1, day, hours, minutes, 0);
        const now = new Date();
        const diffMs = sessionDate.getTime() - now.getTime();
        const hoursRemaining = diffMs / (1000 * 60 * 60);
        return {
            cancellable: hoursRemaining >= 24,
            hoursRemaining
        };
    } catch (e) {
        return { cancellable: true, hoursRemaining: 999 };
    }
};

