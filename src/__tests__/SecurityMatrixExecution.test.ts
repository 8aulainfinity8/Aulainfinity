import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Suite de Pruebas de Autorización Real de Reglas de Seguridad (Fase 3)
 * 
 * Esta suite evalúa formalmente el archivo `firestore.rules` contrastando:
 * 1. El comportamiento ACTUAL del archivo de reglas (capturando vulnerabilidades existentes).
 * 2. El comportamiento ESPERADO según el documento `docs/AUTHORIZATION_MATRIX.md`.
 */

describe('Fase 4: Verificación de Implementación Quirúrgica de Seguridad', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rulesContent = readFileSync(rulesPath, 'utf8');

    describe('1. Cuestionarios y Respuestas (quiz_answers)', () => {
        it('VERIFICADO: quiz_answers exigen studentId == request.auth.uid en create', () => {
            const quizAnswersMatch = rulesContent.match(/match\s+\/quiz_answers\/\{answerId\}[\s\S]*?allow\s+create:\s*if\s*([^;]+);/);
            expect(quizAnswersMatch).not.toBeNull();
            
            const createCondition = quizAnswersMatch![1].trim();
            const hasStudentIdOwnership = createCondition.includes('request.resource.data.studentId == request.auth.uid');
            expect(hasStudentIdOwnership).toBe(true);
        });

        it('VERIFICADO: update y delete en quiz_answers están reservados a Admin', () => {
            const quizAnswersMatch = rulesContent.match(/match\s+\/quiz_answers\/\{answerId\}[\s\S]*?allow\s+update,\s*delete:\s*if\s*([^;]+);/);
            expect(quizAnswersMatch).not.toBeNull();
            expect(quizAnswersMatch![1].trim()).toBe('isAdmin()');
        });
    });

    describe('2. Solicitudes de Tutoría (firestore_tutoring_requests)', () => {
        it('VERIFICADO: tutoring_requests exige studentId == request.auth.uid en create', () => {
            const match = rulesContent.match(/match\s+\/firestore_tutoring_requests\/\{requestId\}[\s\S]*?allow\s+create:\s*if\s*([^;]+);/);
            expect(match).not.toBeNull();
            
            const createCondition = match![1].trim();
            const hasStudentValidation = createCondition.includes('request.resource.data.studentId == request.auth.uid');
            expect(hasStudentValidation).toBe(true);
        });
    });

    describe('3. Solicitudes de Temas (firestore_topic_requests)', () => {
        it('VERIFICADO: topic_requests exige studentId == request.auth.uid en create', () => {
            const match = rulesContent.match(/match\s+\/firestore_topic_requests\/\{requestId\}[\s\S]*?allow\s+create:\s*if\s*([^;]+);/);
            expect(match).not.toBeNull();
            
            const createCondition = match![1].trim();
            const hasStudentValidation = createCondition.includes('request.resource.data.studentId == request.auth.uid');
            expect(hasStudentValidation).toBe(true);
        });
    });

    describe('4. Comentarios y Foros (firestore_comments)', () => {
        it('VERIFICADO: firestore_comments valida autoría con request.auth.uid en create', () => {
            const match = rulesContent.match(/match\s+\/firestore_comments\/\{commentId\}[\s\S]*?allow\s+create:\s*if\s*([^;]+);/);
            expect(match).not.toBeNull();
            
            const createCondition = match![1].trim();
            const hasAuthorValidation = createCondition.includes('request.auth.uid');
            expect(hasAuthorValidation).toBe(true);
        });
    });

    describe('5. Storage Rules (storage.rules)', () => {
        it('VERIFICADO: storage.rules no contiene fallbacks de regex negados en chat_attachments', () => {
            const storagePath = path.resolve(process.cwd(), 'storage.rules');
            const storageContent = readFileSync(storagePath, 'utf8');
            
            const hasNegatedRegexFallback = storageContent.includes("!conversationId.matches('.*_[a-zA-Z0-9]+.*')");
            expect(hasNegatedRegexFallback).toBe(false);
        });

        it('VERIFICADO: storage.rules NO permite isApprovedTeacher() en /notes/{userId}/', () => {
            const storagePath = path.resolve(process.cwd(), 'storage.rules');
            const storageContent = readFileSync(storagePath, 'utf8');
            
            const notesRuleMatch = storageContent.match(/match\s+\/notes\/\{userId\}\/\{fileName\}[\s\S]*?allow\s+read:\s*if\s*([^;]+);/);
            expect(notesRuleMatch).not.toBeNull();
            
            const readCondition = notesRuleMatch![1].trim();
            const allowsTeacherOnStudentNotes = readCondition.includes('isApprovedTeacher()');
            expect(allowsTeacherOnStudentNotes).toBe(false);
        });
    });

    describe('6. WebSocket & LiveKit en server.ts', () => {
        it('VERIFICADO: server.ts implementa verificación de autorización para LiveKit y WebSocket', () => {
            const serverPath = path.resolve(process.cwd(), 'server.ts');
            const serverContent = readFileSync(serverPath, 'utf8');

            expect(serverContent).toContain('canAccessRoom');
            expect(serverContent).toContain('WS UNAUTHORIZED JOIN ATTEMPT');
        });
    });

    describe('7. Protección de Custom Claims y Prevención de Auto-Escalada', () => {
        it('CORRECTO: Un usuario estudiante NO puede asignarse rol admin o profesor', () => {
            const userRuleMatch = rulesContent.match(/match\s+\/firestore_users\/\{userId\}[\s\S]*?allow\s+create:\s*if\s*([^;]+);/);
            expect(userRuleMatch).not.toBeNull();
            
            const createCond = userRuleMatch![1];
            expect(createCond).toContain("request.resource.data.role == 'student'");
            expect(createCond).toContain("request.resource.data.isAdmin == false");
        });

        it('CORRECTO: La colección de elementos eliminados está estrictamente reservada a Admin', () => {
            const deletedItemsMatch = rulesContent.match(/match\s+\/firestore_deleted_items\/\{id\}[\s\S]*?allow\s+read,\s*write:\s*if\s*([^;]+);/);
            expect(deletedItemsMatch).not.toBeNull();
            
            const condition = deletedItemsMatch![1].trim();
            expect(condition).toBe('isAdmin()');
        });
    });
});
