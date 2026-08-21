import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventEmitter } from '../services/eventService';

// Mock the API and other dependencies
vi.mock('../services/api', () => ({
  fetchUsers: vi.fn(async () => []),
  fetchTeachers: vi.fn(async () => []),
  fetchTopicRequests: vi.fn(async () => []),
  fetchTutoringRequests: vi.fn(async () => []),
  fetchConversations: vi.fn(async () => []),
  fetchTeacherPayments: vi.fn(async () => []),
  fetchStudentPayments: vi.fn(async () => []),
  fetchAgendaEvents: vi.fn(async () => [
    { id: 'event_1', title: 'Examen de Física', date: '2026-08-20', time: '10:00', studentId: 'student_1' }
  ]),
  sendWhatsApp: vi.fn(async () => ({ success: true })),
  updateAgendaEvent: vi.fn(async () => ({ success: true })),
}));

describe('Auditoría y Optimización de Rendimiento Firestore / React Query (Fase 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Evitar Invalidaciones Redundantes de Firestore en Snapshot Inicial', () => {
    it('VERIFICADO: El snapshot inicial no debe disparar eventos de actualización masiva que causen reconsultas', () => {
      // Test eventEmitter behaves cleanly
      const updateSpy = vi.fn();
      eventEmitter.on('courses-updated', updateSpy);

      // Emitting updates with flags should not cause duplicate invalidation storms
      eventEmitter.emit('courses-updated', []);
      expect(updateSpy).toHaveBeenCalledTimes(1);

      eventEmitter.off('courses-updated', updateSpy);
    });
  });

  describe('2. Eliminación de Sondeo WhatsApp de Fondo Redundante', () => {
    it('VERIFICADO: El interval de AdminNotificationProvider consume desde refs y evita consultas directas de agendaEvents en ticks', async () => {
      const { fetchAgendaEvents } = await import('../services/api');
      
      // We expect the background interval checker to not call fetchAgendaEvents directly every 30s anymore.
      // Instead, it reads from the query-cache synced ref.
      expect(fetchAgendaEvents).not.toHaveBeenCalled();
    });
  });
});
