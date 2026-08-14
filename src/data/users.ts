// FIX: Corrected import path.
import type { StudentUser } from '../types';

// User Table
export let usersData: StudentUser[] = [
    {
        id: 'student1',
        name: 'Lucía G.',
        email: 'lucia@example.com',
        role: 'student',
        // FIX: Corrected video IDs to match those in courses.ts (bach_c_m_* instead of bach_t_m_*)
        watchedVideos: ['eso_m_1', 'eso_fyq_1', 'bach_c_m_1', 'bach_c_m_2', 'bach_c_m_3'],
        password: 'password123',
        isSubscribed: true, // Example of a subscribed user
        registrationDate: '2024-07-02T10:00:00Z',
        enrolledCourseIds: ['bach_2_ciencias', 'ebau'],
        phone: '600111222',
        creditsBalance: 8,
    },
    {
        id: 'student2',
        name: 'Carlos M.',
        email: 'carlos@example.com',
        role: 'student',
        watchedVideos: ['eso_m_4', 'eso_fyq_4'],
        password: 'password123',
        isSubscribed: false,
        registrationDate: '2024-06-20T11:30:00Z',
        enrolledCourseIds: ['eso_4'],
        phone: '600222333',
        creditsBalance: 0,
    },
    {
        id: 'student3',
        name: 'Sofía R.',
        email: 'sofia@example.com',
        role: 'student',
        watchedVideos: ['bach_c_m_5', 'bach_c_m_6', 'bach_c_m_7'],
        password: 'password123',
        isSubscribed: false,
        registrationDate: '2024-07-01T15:00:00Z',
        enrolledCourseIds: ['ebau'],
        phone: '600333444',
        creditsBalance: 3,
    },
    {
        id: 'student4',
        name: 'Nuevo Estudiante',
        email: 'nuevo@example.com',
        role: 'student',
        watchedVideos: [],
        password: 'password123',
        isSubscribed: false,
        registrationDate: '2024-04-05T09:00:00Z',
        enrolledCourseIds: ['eso_2'],
        phone: '600444555',
        creditsBalance: 5,
    },
];