import type { ExamEvent } from '../types';

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

// Create dates for this month for demo purposes
const examDate1 = new Date(currentYear, currentMonth, 16);
const examDate2 = new Date(currentYear, currentMonth, 20);
const examDate3 = new Date(currentYear, currentMonth, 25);


// Mock data for student agendas.
// The dates are set to the current month to be visible in a default calendar view.
export let agendaData: ExamEvent[] = [
  {
    id: 'exam1',
    studentId: 'student1',
    title: 'Parcial 1: Matrices y Sistemas',
    date: formatDate(examDate1),
    subjectId: 'bach_c2_matematicas',
    videoIds: ['bach_c_m_4', 'bach_c_m_5'],
  },
  {
    id: 'exam2',
    studentId: 'student1',
    title: 'Examen de Fracciones',
    date: formatDate(examDate2),
    subjectId: 'eso_2_matematicas',
    videoIds: ['eso_m_1'],
  },
   {
    id: 'exam3',
    studentId: 'student2',
    title: 'Prueba de Cinemática',
    date: formatDate(examDate3),
    subjectId: 'eso_4_fisica_quimica',
    videoIds: ['eso_4_fyq_2'],
  },
];