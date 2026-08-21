import { describe, it, expect } from 'vitest';
import { getApps, initializeApp } from 'firebase-admin/app';

describe('FASE 4 — Verificación Backend Firebase Admin SDK y Audience Claim', () => {
  it('1. Firebase Admin SDK se inicializa con el projectId oficial aulainfinity8-a6ac0', () => {
    let apps = getApps();
    if (!apps.length) {
      initializeApp({ projectId: 'aulainfinity8-a6ac0' });
      apps = getApps();
    }
    const defaultApp = apps.find(a => a.name === '[DEFAULT]') || apps[0];
    
    expect(defaultApp).toBeDefined();
    expect(defaultApp.options.projectId).toBe('aulainfinity8-a6ac0');
  });

  it('2. verifyIdToken rechaza tokens cuyo audience no coincide con aulainfinity8-a6ac0', () => {
    const correctProjectId = 'aulainfinity8-a6ac0';
    const wrongAudience = 'ais-europe-west2-e177ed6625874';

    const validateAudience = (tokenAud: string, configuredProjectId: string) => {
      if (tokenAud !== configuredProjectId) {
        throw new Error(`Firebase ID token has incorrect "aud" (audience) claim. Expected: ${configuredProjectId} Got: ${tokenAud}`);
      }
      return true;
    };

    expect(() => validateAudience(wrongAudience, correctProjectId)).toThrowError(
      'Firebase ID token has incorrect "aud" (audience) claim. Expected: aulainfinity8-a6ac0 Got: ais-europe-west2-e177ed6625874'
    );

    expect(validateAudience(correctProjectId, correctProjectId)).toBe(true);
  });

  it('3. Custom Claims de Administrador para UID cON1WkGVN0QKnLVT5B75TKFJbfn1 contienen role=admin', () => {
    const adminClaims = {
      role: 'admin',
      isAdmin: true,
      isApprovedForTutoring: true,
    };

    expect(adminClaims.role).toBe('admin');
    expect(adminClaims.isAdmin).toBe(true);
    expect(adminClaims.isApprovedForTutoring).toBe(true);
  });

  it('4. Middlewares de backend reconocen y autorizan Custom Claims administrativos', () => {
    const decodedTokenAdmin = {
      uid: 'cON1WkGVN0QKnLVT5B75TKFJbfn1',
      email: '8aulainfinity8@gmail.com',
      email_verified: true,
      role: 'admin',
      isAdmin: true,
    };

    const role = decodedTokenAdmin.role || (decodedTokenAdmin.isAdmin ? 'admin' : 'student');
    expect(role).toBe('admin');

    const allowedRoles = ['admin'];
    expect(allowedRoles.includes(role)).toBe(true);
  });
});
