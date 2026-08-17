import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { AnyUser } from '../types';
import { UserSchema } from '../schemas';

export interface UserFirestoreData {
    uid: string;
    id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    subscriptionStatus: string;
    createdAt: any;
    updatedAt: any;
    firebaseUid?: string | null;
    phone?: string;
    enrolledCourseIds?: string[];
    coursesTaughtIds?: string[];
    watchedVideos?: string[];
    favoriteVideos?: string[];
    [key: string]: any;
}

export async function getUserProfile(uid: string): Promise<UserFirestoreData | null> {
    const userDocRef = doc(db, 'firestore_users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return userDoc.data() as UserFirestoreData;
    }
    return null;
}

export function cleanFirestoreData<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (obj instanceof Date || typeof (obj as any).toMillis === 'function') return obj;
    if ((obj as any)._methodName || (obj as any).constructor?.name === 'FieldValueImpl') return obj;

    if (Array.isArray(obj)) {
        return obj
            .filter(item => item !== undefined)
            .map(item => cleanFirestoreData(item)) as any;
    }

    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj as Record<string, any>)) {
        const val = (obj as Record<string, any>)[key];
        if (val !== undefined) {
            cleaned[key] = cleanFirestoreData(val);
        }
    }
    return cleaned as T;
}

// In-flight synchronization deduplication map
const inFlightUserSync = new Map<string, Promise<UserFirestoreData | null>>();

/**
 * Service to initialize and sync user data in Firestore upon successful authentication,
 * validating schema with Zod and strictly writing to primary user collections.
 * 
 * Architecture Note on Collections:
 * - 'firestore_users/{uid}' & 'users/{uid}': Canonical primary user profile collections.
 * - 'students/{uid}' / 'teachers/{uid}': Role-filtered collections used by role-specific directory queries.
 */
export async function initializeAndSyncUserDataInFirestore(
    user: AnyUser,
    roleOverride?: 'student' | 'teacher' | 'admin',
    firebaseUid?: string
): Promise<UserFirestoreData | null> {
    if (!user) return null;

    const targetDocId = firebaseUid || (user as any).firebaseUid || user.id || (user as any).uid;
    if (!targetDocId) return null;

    // Deduplicate simultaneous calls for the same user
    if (inFlightUserSync.has(targetDocId)) {
        return inFlightUserSync.get(targetDocId)!;
    }

    const syncPromise = (async () => {
        try {
            const role = roleOverride || user.role || 'student';
            const nowIso = new Date().toISOString();
            const { password, ...restUser } = user as any;

            const rawUserData: UserFirestoreData = {
                ...restUser,
                id: user.id || targetDocId,
                uid: targetDocId,
                firebaseUid: firebaseUid || (user as any).firebaseUid || targetDocId,
                name: user.name || (user as any).username || '',
                email: user.email || '',
                role: role,
                subscriptionStatus: (user as any).subscriptionStatus || ((user as any).isSubscribed ? 'active' : 'active'),
                createdAt: (user as any).createdAt || nowIso,
                updatedAt: serverTimestamp(),
                assignedTeacherId: (user as any).assignedTeacherId ?? null,
                assignedTeacherName: (user as any).assignedTeacherName ?? null,
                watchedVideos: Array.isArray((user as any).watchedVideos) ? (user as any).watchedVideos : [],
                favoriteVideos: Array.isArray((user as any).favoriteVideos) ? (user as any).favoriteVideos : [],
                enrolledCourseIds: Array.isArray((user as any).enrolledCourseIds) ? (user as any).enrolledCourseIds : [],
                completedVideoIds: Array.isArray((user as any).completedVideoIds) ? (user as any).completedVideoIds : [],
                unlockedRewardIds: Array.isArray((user as any).unlockedRewardIds) ? (user as any).unlockedRewardIds : [],
                unlockedBadgeIds: Array.isArray((user as any).unlockedBadgeIds) ? (user as any).unlockedBadgeIds : [],
                coursesTaughtIds: Array.isArray((user as any).coursesTaughtIds) ? (user as any).coursesTaughtIds : (Array.isArray((user as any).taughtCourseIds) ? (user as any).taughtCourseIds : []),
                taughtCourseIds: Array.isArray((user as any).taughtCourseIds) ? (user as any).taughtCourseIds : (Array.isArray((user as any).coursesTaughtIds) ? (user as any).coursesTaughtIds : []),
                schedules: Array.isArray((user as any).schedules) ? (user as any).schedules : [],
                isApprovedForTutoring: role === 'teacher' ? Boolean((user as any).isApprovedForTutoring || false) : undefined,
                isAdmin: role === 'admin',
                ...((user as any).phone ? { phone: (user as any).phone } : {}),
            };

            // Strict client-side validation using Zod UserSchema
            const validatedData = UserSchema.parse(cleanFirestoreData(rawUserData)) as UserFirestoreData;

            // Perform parallel writes to canonical user doc and role doc
            const writePromises: Promise<any>[] = [
                setDoc(doc(db, 'users', targetDocId), validatedData, { merge: true }),
                setDoc(doc(db, 'firestore_users', targetDocId), validatedData, { merge: true })
            ];

            if (role === 'student') {
                writePromises.push(setDoc(doc(db, 'students', targetDocId), validatedData, { merge: true }));
            } else if (role === 'teacher') {
                writePromises.push(setDoc(doc(db, 'teachers', targetDocId), validatedData, { merge: true }));
            } else if (role === 'admin') {
                writePromises.push(setDoc(doc(db, 'admins', targetDocId), validatedData, { merge: true }));
            }

            await Promise.all(writePromises);

            console.log(`[UserService] Successfully initialized & synced user in Firestore (${targetDocId}) with role: ${validatedData.role}`);
            return validatedData;
        } catch (error: any) {
            if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('quota')) {
                console.warn('[UserService] Firestore quota limit exceeded. Falling back to local user state.');
            } else if (error && (error.code === 'permission-denied' || (typeof error.message === 'string' && error.message.toLowerCase().includes('permission')))) {
                console.warn('[UserService] Firestore permission denied for user sync (unauthenticated or mock session). Falling back to local user state.');
            } else {
                console.error('[UserService] Error syncing user data to Firestore:', error);
            }
            
            // Return fallback user data so session remains functional
            return {
                ...user,
                id: user.id || targetDocId,
                uid: targetDocId,
                firebaseUid: targetDocId,
                name: user.name || (user as any).username || '',
                email: user.email || '',
                role: (roleOverride || user.role || 'student') as any,
                subscriptionStatus: (user as any).subscriptionStatus || 'active',
                createdAt: (user as any).createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as any;
        } finally {
            inFlightUserSync.delete(targetDocId);
        }
    })();

    inFlightUserSync.set(targetDocId, syncPromise);
    return syncPromise;
}
