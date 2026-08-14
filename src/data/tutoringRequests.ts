
// FIX: Corrected import path.
import type { TutoringRequest } from '../types';

export let tutoringRequestsData: TutoringRequest[] = [
    {
        id: 'treq1',
        studentId: 'student1',
        studentName: 'Lucía G.',
        subject: 'Matemáticas II',
        details: 'Tengo problemas con las integrales por partes y me gustaría repasar algunos ejemplos.',
        timestamp: '2024-07-25T14:00:00Z',
        status: 'pending',
        teacherApproved: false,
        adminApproved: false,
        teacherId: 'teacher2',
        teacherName: 'Marta Robles',
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
        time: '16:00'
    },
    {
        id: 'treq2',
        studentId: 'student3',
        studentName: 'Sofía R.',
        subject: 'Química',
        details: 'Necesito ayuda para entender el equilibrio químico para la EBAU.',
        timestamp: '2024-07-24T18:30:00Z',
        status: 'confirmed',
        teacherApproved: true,
        adminApproved: true,
        teacherId: 'teacher1',
        teacherName: 'Carlos Vega',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: '11:00'
    },
    {
        id: 'treq_comp1',
        studentId: 'student1',
        studentName: 'Lucía G.',
        subject: 'Matemáticas II',
        details: 'Resolución de dudas sobre integrales indefinidas por sustitución.',
        timestamp: '2024-06-10T12:00:00Z',
        status: 'completed',
        teacherApproved: true,
        adminApproved: true,
        teacherId: 'teacher2',
        teacherName: 'Marta Robles',
        date: '2024-06-10',
        time: '12:00',
        sessionSummary: 'Revisamos detalladamente el método de cambio de variable o sustitución en integrales indefinidas. Lucía comprendió cómo elegir el término "u" y cómo calcular "du". Realizamos tres ejercicios prácticos de exámenes de Selectividad pasados para asegurar que domina el patrón.',
        sharedResources: [
            { title: 'PDF: Guía de Integración por Sustitución (Ejercicios resueltos)', url: 'https://example.com/resources/integrales-sustitucion.pdf' },
            { title: 'Video: Trucos para Selectividad - Matemáticas II', url: 'https://youtube.com/watch?v=example123' },
            { title: 'Ficha de Ejercicios Propuestos para entregar', url: 'https://example.com/resources/tarea-integrales.pdf' }
        ],
        rating: 5,
        feedback: '¡Excelente explicación! Todo quedó clarísimo.'
    },
    {
        id: 'treq_comp2',
        studentId: 'student1',
        studentName: 'Lucía G.',
        subject: 'Física y Química',
        details: 'Leyes de la Termodinámica y cálculo de entalpías.',
        timestamp: '2024-06-15T16:30:00Z',
        status: 'completed',
        teacherApproved: true,
        adminApproved: true,
        teacherId: 'teacher1',
        teacherName: 'Carlos Vega',
        date: '2024-06-15',
        time: '16:30',
        sessionSummary: 'En esta sesión cubrimos la Ley de Hess y el cálculo de la entalpía estándar de reacción a partir de entalpías de formación y de combustión. Hicimos énfasis en la importancia de ajustar las ecuaciones químicas y multiplicar los valores de entalpía correspondientemente.',
        sharedResources: [
            { title: 'Enlace: Simulador Interactivo de Termoquímica', url: 'https://phet.colorado.edu/es/simulations/category/chemistry' },
            { title: 'Esquema Conceptual: Termodinámica EBAU', url: 'https://example.com/resources/esquema-termoquimica.pdf' }
        ],
        rating: 4,
        feedback: 'Muy útil el simulador interactivo para ver los cambios de energía.'
    }
];
