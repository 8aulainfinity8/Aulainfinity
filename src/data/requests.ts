
// This file acts as a static data source for initial topic requests.

// FIX: Corrected import path.
import type { TopicRequest } from '../types';

// Topic Requests Table
export let topicRequestsData: TopicRequest[] = [
    { id: 'req1', studentId: 'student1', studentName: 'Lucía G.', topic: 'Teorema de Rolle', details: 'Me gustaría ver un vídeo con ejemplos prácticos.', timestamp: '2024-07-22T10:00:00Z', status: 'pending' },
    { id: 'req2', studentId: 'student2', studentName: 'Carlos M.', topic: 'Optimización con derivadas', details: '', timestamp: '2024-07-21T15:30:00Z', status: 'completed' },
    { id: 'req3', studentId: 'student3', studentName: 'Sofía R.', topic: 'Formulación de ésteres', details: 'Un vídeo más a fondo sobre la nomenclatura de los ésteres.', timestamp: '2024-07-20T11:00:00Z', status: 'completed' },
];
