import type { Conversation, DirectMessage } from '../types';

export let conversationsData: Conversation[] = [
    {
        id: 'student1',
        studentId: 'student1',
        studentName: 'Lucía G.',
        lastMessageText: '¡Muchas gracias por la ayuda!',
        lastMessageTimestamp: '2024-07-28T11:00:00Z',
        unreadByAdmin: false,
    },
    {
        id: 'student3',
        studentId: 'student3',
        studentName: 'Sofía R.',
        lastMessageText: 'Perfecto, lo reviso.',
        lastMessageTimestamp: '2024-07-27T18:00:00Z',
        unreadByAdmin: false,
    }
];

export let directMessagesData: DirectMessage[] = [
    // Conversation with Lucía
    {
        id: 'msg1',
        conversationId: 'student1',
        senderId: 'student1',
        senderRole: 'student',
        text: 'Hola, tengo una duda con el último vídeo de matrices. ¿Cómo se calcula el determinante de una matriz 3x3?',
        timestamp: '2024-07-28T10:30:00Z'
    },
    {
        id: 'msg2',
        conversationId: 'student1',
        senderId: 'admin',
        senderRole: 'admin',
        text: '¡Hola Lucía! Claro, se usa la regla de Sarrus. Te recomiendo revisar el vídeo de "Matrices y Determinantes", sobre el minuto 5:30 lo explico en detalle. ¿Te sirve?',
        timestamp: '2024-07-28T10:45:00Z'
    },
    {
        id: 'msg3',
        conversationId: 'student1',
        senderId: 'student1',
        senderRole: 'student',
        text: '¡Muchas gracias por la ayuda!',
        timestamp: '2024-07-28T11:00:00Z'
    },
    // Conversation with Sofía
    {
        id: 'msg4',
        conversationId: 'student3',
        senderId: 'admin',
        senderRole: 'admin',
        text: 'Hola Sofía, ya he añadido el vídeo sobre la Segunda República que pediste.',
        timestamp: '2024-07-27T17:55:00Z'
    },
    {
        id: 'msg5',
        conversationId: 'student3',
        senderId: 'student3',
        senderRole: 'student',
        text: 'Perfecto, lo reviso.',
        timestamp: '2024-07-27T18:00:00Z'
    },
];
