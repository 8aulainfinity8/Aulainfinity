import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load config or initialize default
if (!getApps().length) {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      process.env.GCLOUD_PROJECT = config.projectId;
      process.env.GOOGLE_CLOUD_PROJECT = config.projectId;
      initializeApp({
        projectId: config.projectId,
      });
    } else {
      initializeApp();
    }
  } catch (e) {
    console.error('[bootstrapAdmin] Error initializing Firebase Admin:', e);
  }
}

/**
 * Bootstrap administrative claims for a specified user (identified by UID or email provided as CLI argument)
 * Usage: npx tsx scripts/bootstrapAdmin.ts <UID_OR_EMAIL>
 */
async function main() {
  const targetIdentifier = process.argv[2] || '8aulainfinity8@gmail.com';
  console.log(`[bootstrapAdmin] Iniciando verificación/asignación de claims para: ${targetIdentifier}`);

  const auth = getAuth();
  const db = getFirestore();

  try {
    let userRecord;
    if (targetIdentifier.includes('@')) {
      userRecord = await auth.getUserByEmail(targetIdentifier);
    } else {
      userRecord = await auth.getUser(targetIdentifier);
    }

    console.log('\n--- DATOS DE LA CUENTA FIREBASE AUTH ---');
    console.log(`UID: ${userRecord.uid}`);
    console.log(`Email: ${userRecord.email}`);
    console.log(`Email Verified: ${userRecord.emailVerified}`);
    console.log(`Disabled: ${userRecord.disabled}`);
    console.log('Custom Claims actuales:', JSON.stringify(userRecord.customClaims || {}, null, 2));

    const targetClaims = {
      role: 'admin',
      isAdmin: true,
      isApprovedForTutoring: true,
    };

    await auth.setCustomUserClaims(userRecord.uid, targetClaims);
    console.log('\n✅ Custom Claims asignadas con éxito en Firebase Auth:');
    console.log(JSON.stringify(targetClaims, null, 2));

    // Sincronizar documento en Firestore
    const userDocRef = db.collection('firestore_users').doc(userRecord.uid);
    const usersDocRef = db.collection('users').doc(userRecord.uid);

    const updateData = {
      role: 'admin',
      isAdmin: true,
      isApprovedForTutoring: true,
      email: userRecord.email,
      name: userRecord.displayName || 'Administrador',
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userDocRef.set(updateData, { merge: true });
    await usersDocRef.set(updateData, { merge: true });
    console.log('✅ Documentos Firestore (firestore_users y users) sincronizados con role=admin.');

    // Verificar re-lectura
    const updatedUser = await auth.getUser(userRecord.uid);
    console.log('\n--- VERIFICACIÓN FINAL ---');
    console.log('UID:', updatedUser.uid);
    console.log('Role:', updatedUser.customClaims?.role);
    console.log('isAdmin:', updatedUser.customClaims?.isAdmin);
    console.log('isApprovedForTutoring:', updatedUser.customClaims?.isApprovedForTutoring);
    console.log('emailVerified:', updatedUser.emailVerified);

  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.error(`❌ Usuario no encontrado en Firebase Auth: ${targetIdentifier}`);
    } else {
      console.error('❌ Error en bootstrapAdmin:', err.message || err);
    }
    process.exit(1);
  }
}

main();
