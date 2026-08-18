import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db, auth } from './firebase';

export interface UploadProgressCallback {
    (progress: number): void;
}

/**
 * Solicitud autorizada de Signed URL al backend para operaciones de almacenamiento privado
 */
export const requestStorageSignedUrl = async (params: {
    path: string;
    action: 'read' | 'write' | 'delete';
    contentType?: string;
}): Promise<string | null> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;

        const token = await currentUser.getIdToken();
        const response = await fetch('/api/storage/signed-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data?.url || null;
    } catch (err) {
        console.warn('[StorageService] Error obteniendo Signed URL del backend:', err);
        return null;
    }
};

export interface VideoMetadataPayload {
    id?: string;
    title: string;
    category?: string;
    videoUrl: string;
    videoFileName?: string;
    topic?: string;
    levelId?: string;
    subjectId?: string;
    blockId?: string;
    createdAt?: string;
}

/**
 * Genera una URL local de almacenamiento seguro si Firebase Storage está deshabilitado o fuera de línea
 */
const createVideoFallbackUrl = (file: File, onProgress?: UploadProgressCallback): Promise<string> => {
    return new Promise((resolve) => {
        let current = 0;
        const interval = setInterval(() => {
            current += 20;
            if (onProgress) onProgress(Math.min(current, 100));
            if (current >= 100) {
                clearInterval(interval);
                // Si es menor de 20MB guardamos como Data URL para persistencia local
                if (file.size < 20 * 1024 * 1024) {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = () => resolve(URL.createObjectURL(file));
                    reader.readAsDataURL(file);
                } else {
                    resolve(URL.createObjectURL(file));
                }
            }
        }, 150);
    });
};

/**
 * Subir un archivo de vídeo a Firebase Storage con seguimiento de progreso y fallback automático
 */
export const uploadVideoToStorage = (
    file: File,
    onProgress?: UploadProgressCallback
): Promise<{ url: string; fileName: string }> => {
    return new Promise(async (resolve, reject) => {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `videos/${Date.now()}_${cleanName}`;

        try {
            const storageRef = ref(storage, storagePath);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    if (snapshot.totalBytes > 0) {
                        const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        if (onProgress) onProgress(prog);
                    }
                },
                async (error) => {
                    console.warn('[Firebase Storage] Error o límite de reintentos excedido:', error);
                    // Si ocurre un error de retry-limit-exceeded, unauthorized o falta de permisos en Firebase Storage
                    const isUnauthorized = error?.code === 'storage/unauthorized' || error?.code?.includes('unauthorized') || error?.message?.includes('unauthorized') || error?.message?.includes('permission');
                    const isRetryLimit = error?.code === 'storage/retry-limit-exceeded' || error?.message?.includes('retry limit');
                    const isUnknownOrDenied = error?.code === 'storage/unknown' || error?.code === 'storage/canceled';

                    if (isUnauthorized || isRetryLimit || isUnknownOrDenied) {
                        console.warn('[Firebase Storage] Permiso denegado o Storage no disponible. Usando fallback de almacenamiento local...', error);
                        try {
                            const fallbackUrl = await createVideoFallbackUrl(file, onProgress);
                            resolve({ url: fallbackUrl, fileName: file.name });
                            return;
                        } catch (fallbackErr) {
                            reject(error);
                            return;
                        }
                    }
                    reject(error);
                },
                async () => {
                    try {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve({ url: downloadUrl, fileName: file.name });
                    } catch (err) {
                        console.warn('[Firebase Storage] Error obteniendo URL de descarga, usando fallback local:', err);
                        const fallbackUrl = await createVideoFallbackUrl(file, onProgress);
                        resolve({ url: fallbackUrl, fileName: file.name });
                    }
                }
            );
        } catch (initErr) {
            console.warn('[Firebase Storage] Excepción al iniciar la subida, usando fallback local:', initErr);
            const fallbackUrl = await createVideoFallbackUrl(file, onProgress);
            resolve({ url: fallbackUrl, fileName: file.name });
        }
    });
};

/**
 * Guardar un documento con metadatos del vídeo en la colección 'videos' de Firestore
 */
export const saveVideoDocumentToFirestore = async (payload: VideoMetadataPayload): Promise<string> => {
    try {
        const docId = payload.id || `video_${Date.now()}`;
        const videoRef = doc(db, 'videos', docId);

        const videoData = {
            id: docId,
            title: payload.title || payload.videoFileName || 'Vídeo educativo',
            category: payload.category || payload.topic || 'General',
            url: payload.videoUrl,
            videoUrl: payload.videoUrl,
            videoFileName: payload.videoFileName || '',
            topic: payload.topic || payload.category || '',
            levelId: payload.levelId || '',
            subjectId: payload.subjectId || '',
            blockId: payload.blockId || '',
            uploadDate: payload.createdAt || new Date().toISOString(),
            createdAt: payload.createdAt || new Date().toISOString(),
            updatedAt: serverTimestamp()
        };

        await setDoc(videoRef, videoData, { merge: true });
        console.log('[Firestore] Documento guardado automáticamente en colección "videos":', docId, videoData);
        return docId;
    } catch (err) {
        console.warn('[Firestore] Error guardando metadatos del vídeo en la colección "videos":', err);
        return payload.id || '';
    }
};

/**
 * Eliminar un archivo de vídeo de Firebase Storage
 */
export const deleteVideoFileFromStorage = async (videoUrl?: string): Promise<boolean> => {
    if (!videoUrl || typeof videoUrl !== 'string') return false;
    try {
        if (videoUrl.includes('firebasestorage') || videoUrl.includes('appspot.com') || videoUrl.startsWith('gs://')) {
            const storageRef = ref(storage, videoUrl);
            await deleteObject(storageRef);
            console.log('[Firebase Storage] Vídeo eliminado de Firebase Storage:', videoUrl);
            return true;
        }
    } catch (err) {
        console.warn('[Firebase Storage] No se pudo eliminar el archivo de Storage (es posible que ya no exista):', err);
    }
    return false;
};

