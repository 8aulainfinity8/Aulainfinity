import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { AnyUser } from '../types';
import { isAdminEmail } from '../constants/auth';
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

/**
 * Service to initialize and sync user data in Firestore (users/{uid}) upon successful authentication,
 * including required fields like 'role' (student/teacher/admin), 'subscriptionStatus', and 'createdAt'.
 */
export async function initializeAndSyncUserDataInFirestore(
    user: AnyUser,
    roleOverride?: 'student' | 'teacher' | 'admin',
    firebaseUid?: string
): Promise<UserFirestoreData | null> {
    if (!user) return null;

    try {
        const isMasterAdmin = isAdminEmail(user.email) || user.role === 'admin';
        const role = isMasterAdmin ? 'admin' : (roleOverride || user.role || 'student');
        let targetDocId = firebaseUid || (user as any).firebaseUid || user.id || (user as any).uid;
        if (!targetDocId) return null;

        let existingData: any = {};
        let userDocRef = doc(db, 'firestore_users', targetDocId);
        let existingDoc = await getDoc(userDocRef);

        // If not found by direct docId, query Firestore by email to locate existing document
        if (!existingDoc.exists()) {
            if (user.email) {
                const usersRef = collection(db, 'firestore_users');
                const qEmail = query(usersRef, where('email', '==', user.email));
                const snapEmail = await getDocs(qEmail);
                if (!snapEmail.empty) {
                    const foundDoc = snapEmail.docs[0];
                    targetDocId = foundDoc.id;
                    existingData = foundDoc.data();
                    userDocRef = doc(db, 'firestore_users', targetDocId);
                }
            }
        } else {
            existingData = existingDoc.data();
        }

        const nowIso = new Date().toISOString();
        const { password, ...restUser } = user as any;

        const rawUserData: UserFirestoreData = {
            ...existingData,
            ...restUser,
            id: user.id || targetDocId,
            uid: targetDocId,
            firebaseUid: firebaseUid || (user as any).firebaseUid || existingData.firebaseUid || targetDocId,
            name: user.name || (user as any).username || existingData.name || '',
            email: user.email || existingData.email || '',
            role: role,
            subscriptionStatus: (user as any).subscriptionStatus || ((user as any).isSubscribed ? 'active' : (existingData.subscriptionStatus || 'active')),
            createdAt: existingData.createdAt || (user as any).createdAt || nowIso,
            updatedAt: serverTimestamp(),
            assignedTeacherId: (user as any).assignedTeacherId !== undefined ? (user as any).assignedTeacherId : (existingData.assignedTeacherId ?? null),
            assignedTeacherName: (user as any).assignedTeacherName !== undefined ? (user as any).assignedTeacherName : (existingData.assignedTeacherName ?? null),
            watchedVideos: Array.isArray((user as any).watchedVideos) ? (user as any).watchedVideos : (Array.isArray(existingData.watchedVideos) ? existingData.watchedVideos : []),
            favoriteVideos: Array.isArray((user as any).favoriteVideos) ? (user as any).favoriteVideos : (Array.isArray(existingData.favoriteVideos) ? existingData.favoriteVideos : []),
            enrolledCourseIds: Array.isArray((user as any).enrolledCourseIds) ? (user as any).enrolledCourseIds : (Array.isArray(existingData.enrolledCourseIds) ? existingData.enrolledCourseIds : []),
            completedVideoIds: Array.isArray((user as any).completedVideoIds) ? (user as any).completedVideoIds : (Array.isArray(existingData.completedVideoIds) ? existingData.completedVideoIds : []),
            unlockedRewardIds: Array.isArray((user as any).unlockedRewardIds) ? (user as any).unlockedRewardIds : (Array.isArray(existingData.unlockedRewardIds) ? existingData.unlockedRewardIds : []),
            unlockedBadgeIds: Array.isArray((user as any).unlockedBadgeIds) ? (user as any).unlockedBadgeIds : (Array.isArray(existingData.unlockedBadgeIds) ? existingData.unlockedBadgeIds : []),
            coursesTaughtIds: Array.isArray((user as any).coursesTaughtIds) ? (user as any).coursesTaughtIds : (Array.isArray((user as any).taughtCourseIds) ? (user as any).taughtCourseIds : (Array.isArray(existingData.coursesTaughtIds) ? existingData.coursesTaughtIds : [])),
            taughtCourseIds: Array.isArray((user as any).taughtCourseIds) ? (user as any).taughtCourseIds : (Array.isArray((user as any).coursesTaughtIds) ? (user as any).coursesTaughtIds : (Array.isArray(existingData.taughtCourseIds) ? existingData.taughtCourseIds : [])),
            schedules: Array.isArray((user as any).schedules) ? (user as any).schedules : (Array.isArray(existingData.schedules) ? existingData.schedules : []),
            ...((user as any).phone ? { phone: (user as any).phone } : {}),
        };

        // Validate and clean using Zod for strict runtime safety without breaking old docs
        const userData = UserSchema.parse(cleanFirestoreData(rawUserData)) as UserFirestoreData;

        // Save into main firestore_users/{uid} document and role-specific sub-collection in parallel
        console.log(`[UserService] Writing user doc & role doc in parallel for 'users/${targetDocId}'...`);
        const writePromises: Promise<any>[] = [setDoc(userDocRef, userData, { merge: true })];
        if (role === 'student') {
            writePromises.push(setDoc(doc(db, 'students', targetDocId), userData, { merge: true }));
        } else if (role === 'teacher') {
            writePromises.push(setDoc(doc(db, 'teachers', targetDocId), userData, { merge: true }));
        } else if (role === 'admin') {
            writePromises.push(setDoc(doc(db, 'admins', targetDocId), userData, { merge: true }));
        }
        await Promise.all(writePromises);
        console.log(`[UserService] Successfully wrote user doc & role doc in parallel for 'users/${targetDocId}'`);

        console.log(`[UserService] Successfully initialized & synced user in users/${targetDocId}:`, {
            role: userData.role,
            subscriptionStatus: userData.subscriptionStatus,
            createdAt: userData.createdAt
        });

        return userData;
    } catch (error: any) {
        if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('quota')) {
            console.warn('[UserService] Firestore quota limit exceeded. Falling back to local user state.');
        } else if (error && (error.code === 'permission-denied' || (typeof error.message === 'string' && error.message.toLowerCase().includes('permission')))) {
            console.warn('[UserService] Firestore permission denied for user sync (unauthenticated or mock session). Falling back to local user state.');
        } else {
            console.error('[UserService] Error syncing user data to Firestore:', error);
        }
        
        // Return fallback user data so session remains functional
        const targetDocId = firebaseUid || (user as any).firebaseUid || user.id || (user as any).uid || 'local_user';
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
            updatedAt: new Date().toISOString()
        } as UserFirestoreData;
    }
}
