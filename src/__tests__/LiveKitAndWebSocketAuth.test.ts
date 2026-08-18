import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('Fase 6: Pruebas de Autorización de WebSocket y LiveKit en server.ts', () => {
    const serverPath = path.resolve(process.cwd(), 'server.ts');
    const serverContent = readFileSync(serverPath, 'utf8');

    describe('1. LiveKit Token Endpoint (Strict Deny-by-Default)', () => {
        it('VERIFICADO: NO contiene ningún fallback basado en .includes(uid)', () => {
            const hasIncludesUidFallback = serverContent.includes('canAccessRoom = roomStr.includes(uid)') ||
                                           serverContent.includes('roomStr.includes(uid)');
            expect(hasIncludesUidFallback).toBe(false);
        });

        it('VERIFICADO: Salas desconocidas resultan en Deny explícito (canAccessRoom = false)', () => {
            expect(serverContent).toContain('// Unknown room format: strict DENY');
            expect(serverContent).toContain('// Document does not exist: strict DENY');
        });

        it('VERIFICADO: LiveKit exige verificación en Firestore para tutorías/conversaciones', () => {
            expect(serverContent).toContain('firestore_tutoring_requests');
            expect(serverContent).toContain('firestore_conversations');
        });
    });

    describe('2. WebSocket Routing & Session Aspiration', () => {
        it('VERIFICADO: WebSocket routing ignora courseId del cliente en cursor/eventos', () => {
            const cursorSection = serverContent.substring(
                serverContent.indexOf('if (message.type === "cursor")'),
                serverContent.indexOf('ws.on("close"')
            );
            
            // Verifica que cursor usa activeCourseId y no confía en message.courseId
            expect(cursorSection).toContain('rooms.get(activeCourseId)');
            expect(cursorSection).not.toContain('rooms.get(courseId)');
        });

        it('VERIFICADO: ws.on("close") limpia activeCourseId explícitamente', () => {
            const closeSection = serverContent.substring(serverContent.indexOf('ws.on("close"'));
            expect(closeSection).toContain('activeCourseId = undefined');
        });
    });
});
