import type { StudentAnswer } from '../types';

export let studentAnswersData: StudentAnswer[] = [
    {
        studentId: 'student1',
        videoId: 'eso_m_1',
        quizId: 'quiz1',
        answers: { 'q1_1': 0, 'q1_2': 1 },
        score: 2,
        totalQuestions: 2,
        timestamp: new Date().toISOString()
    }
];
