import type { CourseLevel, Subject, TeacherUser } from '../types';

/**
 * Normalizes a string for comparison by lowercasing, trimming, and stripping accents and punctuation.
 */
function cleanString(str: string): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9\s]/g, ' ') // replace symbols with spaces
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Checks if an assigned level string matches a CourseLevel (by ID or Name).
 */
export function doesCourseLevelMatch(assignedStr: string, courseId?: string, courseName?: string): boolean {
    if (!assignedStr) return false;
    const item = cleanString(assignedStr);
    if (!item) return false;
    if (item === 'all' || item === 'todas' || item === 'todos' || item === 'general') return true;

    const cId = cleanString(courseId || '');
    const cName = cleanString(courseName || '');

    // Exact or substring match
    if (cId && (cId === item || cId.includes(item) || item.includes(cId))) return true;
    if (cName && (cName === item || cName.includes(item) || item.includes(cName))) return true;

    // Fuzzy / Generic category level matches:
    if ((item.includes('eso') || cName.includes('eso')) && (
        (item.includes('3') && (cId.includes('3') || cName.includes('3'))) ||
        (item.includes('4') && (cId.includes('4') || cName.includes('4'))) ||
        (item.includes('1') && (cId.includes('1') || cName.includes('1'))) ||
        (item.includes('2') && (cId.includes('2') || cName.includes('2')))
    )) {
        return true;
    }

    // "bachillerato" generic
    if (item.includes('bachillerato') || item.includes('bach')) {
        if (cId.includes('bach') || cName.includes('bachillerato')) {
            if (item.includes('1') && !(cId.includes('1') || cName.includes('1'))) return false;
            if (item.includes('2') && !(cId.includes('2') || cName.includes('2'))) return false;
            return true;
        }
    }

    // "ebau" / "selectividad"
    if ((item.includes('ebau') || item.includes('selectividad')) && (cId.includes('ebau') || cName.includes('ebau') || cName.includes('selectividad'))) {
        return true;
    }

    return false;
}

/**
 * Checks if a subject string matches a target Subject (by ID or Name).
 */
export function doesSubjectMatch(subjectQuery: string, subjectId?: string, subjectName?: string): boolean {
    if (!subjectQuery) return false;
    const item = cleanString(subjectQuery);
    if (!item) return false;
    if (item === 'all' || item === 'todas' || item === 'todos' || item === 'general') return true;

    const sId = cleanString(subjectId || '');
    const sName = cleanString(subjectName || '');

    // Direct match
    if (sId && (sId === item || sId.includes(item) || item.includes(sId))) return true;
    if (sName && (sName === item || sName.includes(item) || item.includes(sName))) return true;

    // Keyword matching for subjects:
    // "fisica y quimica" or "fisica" or "quimica" or "fyq"
    const itemHasFisica = item.includes('fisica') || item.includes('fyq');
    const itemHasQuimica = item.includes('quimica') || item.includes('fyq');
    const subjHasFisica = sId.includes('fisica') || sName.includes('fisica') || sId.includes('fyq') || sName.includes('fyq');
    const subjHasQuimica = sId.includes('quimica') || sName.includes('quimica') || sId.includes('fyq') || sName.includes('fyq');

    if ((itemHasFisica && subjHasFisica) || (itemHasQuimica && subjHasQuimica)) return true;

    // "matematicas" or "mates" or "math"
    const itemHasMates = item.includes('matematica') || item.includes('mates') || item.includes('math');
    const subjHasMates = sId.includes('matematica') || sName.includes('matematica') || sId.includes('mates') || sName.includes('math');
    if (itemHasMates && subjHasMates) return true;

    // "biologia" / "geologia" / "naturales"
    const itemHasBio = item.includes('biologia') || item.includes('geologia') || item.includes('natural');
    const subjHasBio = sId.includes('biologia') || sName.includes('biologia') || sId.includes('geologia') || sName.includes('geologia') || sName.includes('natural');
    if (itemHasBio && subjHasBio) return true;

    // "lengua" / "literatura"
    const itemHasLengua = item.includes('lengua') || item.includes('literatura');
    const subjHasLengua = sId.includes('lengua') || sName.includes('lengua') || sId.includes('literatura') || sName.includes('literatura');
    if (itemHasLengua && subjHasLengua) return true;

    // "ingles" / "english"
    const itemHasIngles = item.includes('ingles') || item.includes('english');
    const subjHasIngles = sId.includes('ingles') || sName.includes('ingles') || sId.includes('english') || sName.includes('english');
    if (itemHasIngles && subjHasIngles) return true;

    // "historia"
    if (item.includes('historia') && (sId.includes('historia') || sName.includes('historia'))) return true;

    // "filosofia"
    if (item.includes('filosofia') && (sId.includes('filosofia') || sName.includes('filosofia'))) return true;

    // "economia"
    if (item.includes('economia') && (sId.includes('economia') || sName.includes('economia'))) return true;

    // "dibujo" / "tecnico"
    if ((item.includes('dibujo') || item.includes('tecnico')) && (sId.includes('dibujo') || sName.includes('dibujo') || sName.includes('tecnico'))) return true;

    return false;
}

/**
 * Returns all assigned level/course strings for a teacher.
 */
export function getTeacherAssignedLevels(tUser: TeacherUser): string[] {
    const raw: string[] = [
        ...(Array.isArray(tUser.taughtCourseIds) ? tUser.taughtCourseIds : []),
        ...(Array.isArray(tUser.coursesTaughtIds) ? tUser.coursesTaughtIds : []),
        ...(Array.isArray(tUser.levels) ? tUser.levels : [])
    ];
    return Array.from(new Set(raw.filter(Boolean)));
}

/**
 * Returns all assigned subject/specialty strings for a teacher.
 */
export function getTeacherAssignedSubjects(tUser: TeacherUser): string[] {
    const raw: string[] = [
        ...(Array.isArray(tUser.subjects) ? tUser.subjects : []),
        ...(tUser.category && tUser.category.toLowerCase().trim() !== 'general' ? [tUser.category] : [])
    ];
    return Array.from(new Set(raw.filter(Boolean)));
}

/**
 * Checks if a user (teacher or admin) is allowed to access a given course level.
 */
export function isTeacherCourseAssigned(user: any, courseLevelId?: string, courseLevelName?: string): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role !== 'teacher') return true;

    const tUser = user as TeacherUser;
    const assignedLevels = getTeacherAssignedLevels(tUser);
    const assignedSubjects = getTeacherAssignedSubjects(tUser);

    // 1. If explicit levels/courses are assigned to teacher:
    if (assignedLevels.length > 0) {
        return assignedLevels.some(lvl => doesCourseLevelMatch(lvl, courseLevelId, courseLevelName));
    }

    // 2. If NO explicit levels are assigned, check if teacher's assigned subjects/category match
    if (assignedSubjects.length > 0) {
        if (assignedSubjects.some(s => {
            const clean = cleanString(s);
            return clean === 'all' || clean === 'todas' || clean === 'todos' || clean === 'general';
        })) {
            return true;
        }
        return true;
    }

    // 3. If teacher has no restrictions at all, allow full access
    return true;
}

/**
 * Checks if a teacher is allowed to access a given subject or specialty.
 */
export function isTeacherSubjectAssigned(user: any, subjectId?: string, subjectName?: string): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role !== 'teacher') return true;

    const tUser = user as TeacherUser;
    const assignedSubjects = getTeacherAssignedSubjects(tUser);

    // If teacher has no specific subjects/specialties specified or assignedSubjects is empty, allow all subjects!
    if (assignedSubjects.length === 0) {
        return true;
    }

    return assignedSubjects.some(subj => doesSubjectMatch(subj, subjectId, subjectName));
}

/**
 * Filters an array of CourseLevels and their inner Subjects so a teacher only sees 
 * the educational levels and subjects/specialties they are assigned to impart.
 */
export function filterCoursesForTeacher(courses: CourseLevel[], user: any): CourseLevel[] {
    if (!courses) return [];
    if (!user || user.role !== 'teacher') return courses;

    const tUser = user as TeacherUser;
    const assignedSubjects = getTeacherAssignedSubjects(tUser);

    // Filter levels
    const matchedLevels = courses.filter(c => isTeacherCourseAssigned(user, c.id, c.name));

    // Filter inner subjects inside each level
    return matchedLevels.map(c => {
        if (!c.subjects || c.subjects.length === 0) return c;
        
        // If teacher has specific subject restrictions (and not 'general'/'all'), filter subjects
        if (assignedSubjects.length > 0 && !assignedSubjects.some(s => ['all', 'todas', 'todos', 'general'].includes(cleanString(s)))) {
            const filteredSubjects = c.subjects.filter(s => isTeacherSubjectAssigned(user, s.id, s.name));
            return {
                ...c,
                subjects: filteredSubjects
            };
        }
        
        return c;
    });
}
