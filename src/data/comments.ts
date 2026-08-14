// This file acts as a static data source for initial comments.

// FIX: Corrected import path.
import type { Comment } from '../types';

// Comments Table
export let commentsData: Comment[] = [
    { id: 'c1', videoId: 'eso_m_1', author: { id: 'student2', name: 'Carlos M.' }, text: '¡Muy bien explicado! Me ha servido para repasar.', timestamp: '2024-07-20T10:00:00Z' },
    { id: 'c2', videoId: 'eso_m_1', author: { id: 'student3', name: 'Sofía R.' }, text: '¿Podrías hacer un vídeo con ejercicios más difíciles?', timestamp: '2024-07-21T12:30:00Z' },
    // FIX: Corrected videoId from non-existent 'bach_t_m_4' to 'bach_c_m_4'
    { id: 'c3', videoId: 'bach_c_m_4', author: { id: 'student1', name: 'Lucía G.' }, text: 'La explicación sobre la regla de la cadena me ha salvado. ¡Gracias!', timestamp: '2024-07-22T09:45:00Z' },
];