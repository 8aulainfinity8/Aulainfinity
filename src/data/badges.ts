import type { Badge, StudentUser, CourseLevel, StudentAnswer } from '../types';

export const badgesData: Badge[] = [
  {
    id: 'pioneer',
    name: 'Pionero',
    description: 'Completaste tu primer vídeo. ¡El primer paso de un gran viaje!',
    icon: 'AcademicCapIcon',
    criteria: (user: StudentUser) => (user.watchedVideos || []).length >= 1,
  },
  {
    id: 'curious',
    name: 'Curioso',
    description: 'Viste 5 vídeos. ¡Sigue así!',
    icon: 'LightBulbIcon',
    criteria: (user: StudentUser) => (user.watchedVideos || []).length >= 5,
  },
  {
    id: 'scholar',
    name: 'Erudito',
    description: 'Viste 20 vídeos. ¡Estás demostrando un gran compromiso!',
    icon: 'BookOpenIcon',
    criteria: (user: StudentUser) => (user.watchedVideos || []).length >= 20,
  },
  {
    id: 'quiz-master',
    name: 'Maestro del Quiz',
    description: 'Completaste tu primer quiz con una puntuación perfecta.',
    icon: 'TrophyIcon',
    criteria: (user: StudentUser, allCourses: CourseLevel[], studentAnswers: StudentAnswer[]) =>
      (studentAnswers || []).some(answer => answer.studentId === user.id && answer.score === answer.totalQuestions),
  },
  {
    id: 'subject-expert',
    name: 'Experto en una Materia',
    description: 'Completaste todos los vídeos de una asignatura.',
    icon: 'CheckCircleIcon',
    criteria: (user: StudentUser, allCourses: CourseLevel[]) => {
      return (allCourses || []).some(level =>
        (level.subjects || []).some(subject => {
          const subjectVideoIds = (subject.videos || []).map(v => v.id);
          return subjectVideoIds.length > 0 && subjectVideoIds.every(id => (user.watchedVideos || []).includes(id));
        })
      );
    },
  },
  {
    id: 'level-up',
    name: 'Nivel Superado',
    description: 'Completaste todos los vídeos de un curso entero.',
    icon: 'ChartBarIcon',
    criteria: (user: StudentUser, allCourses: CourseLevel[]) => {
      return (allCourses || []).some(level => {
        const levelVideoIds = (level.subjects || []).flatMap(s => (s.videos || []).map(v => v.id));
        return levelVideoIds.length > 0 && levelVideoIds.every(id => (user.watchedVideos || []).includes(id));
      });
    },
  },
];
