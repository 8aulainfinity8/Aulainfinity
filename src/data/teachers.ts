import type { TeacherUser } from '../types';

export let teachersData: TeacherUser[] = [
    {
        id: 'teacher1',
        name: 'Carlos Vega',
        email: 'carlos.vega@example.com',
        role: 'teacher',
        password: 'password123',
        phone: '655111222',
        avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Carlos',
        category: 'Física y Química',
        isApprovedForTutoring: true,
        aiEnabled: true,
        videosEnabled: true,
        subjects: ['Física y Química', 'Física', 'Química'],
        levels: ['3º E.S.O.', '4º E.S.O.', '1º Bachillerato de Ciencias', '2º Bachillerato de Ciencias', 'Selectividad (EBAU)'],
        schedules: ['Lunes a Viernes de 16:00 a 20:00'],
        status: 'available'
    },
    {
        id: 'teacher2',
        name: 'Marta Robles',
        email: 'marta.robles@example.com',
        role: 'teacher',
        password: 'password123',
        phone: '655222333',
        avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Marta',
        category: 'Matemáticas'
    },
    {
        id: 'teacher3',
        name: 'Ana Gómez',
        email: 'ana.gomez@example.com',
        role: 'teacher',
        password: 'password123',
        phone: '655333444',
        avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Ana',
        category: 'Biología y Geología'
    }
];
