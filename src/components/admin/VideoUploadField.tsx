import React, { useState } from 'react';
import { uploadVideoToStorage, saveVideoDocumentToFirestore, deleteVideoFileFromStorage } from '../../services/storageService';
import { CloudArrowUpIcon, CheckCircleIcon, TrashIcon } from '../icons';

interface VideoUploadFieldProps {
    currentUrl?: string;
    currentFileName?: string;
    videoTitle?: string;
    category?: string;
    onUploadSuccess: (url: string, fileName: string) => void;
    onRemove: () => void;
    disabled?: boolean;
}

export const VideoUploadField: React.FC<VideoUploadFieldProps> = ({
    currentUrl,
    currentFileName,
    videoTitle,
    category,
    onUploadSuccess,
    onRemove,
    disabled = false
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setUploading(true);
        setProgress(0);

        try {
            const { url, fileName } = await uploadVideoToStorage(file, (prog) => setProgress(prog));
            
            // Guardar automáticamente metadatos en la colección 'videos' de Firestore
            await saveVideoDocumentToFirestore({
                title: videoTitle || fileName || 'Vídeo subido',
                category: category || 'General',
                videoUrl: url,
                videoFileName: fileName,
                createdAt: new Date().toISOString()
            });

            onUploadSuccess(url, fileName);
        } catch (err: any) {
            console.error('Error al subir el vídeo:', err);
            const msg = err?.message || 'Error al subir el vídeo a Firebase Storage.';
            setError(`Error en la subida: ${msg}`);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveFile = async () => {
        if (currentUrl) {
            try {
                await deleteVideoFileFromStorage(currentUrl);
            } catch (e) {
                console.warn('Error al borrar de Storage:', e);
            }
        }
        onRemove();
    };

    return (
        <div className="mt-2 p-3 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800/80 transition-colors">
            {currentUrl ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate font-medium" title={currentFileName || currentUrl}>
                            Vídeo en Storage: {currentFileName || 'Archivo de vídeo'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemoveFile}
                        disabled={disabled || uploading}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors flex-shrink-0 ml-2"
                        title="Eliminar archivo de Firebase Storage"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ) : uploading ? (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>Subiendo vídeo a Firebase Storage...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-1">
                    <label className="cursor-pointer flex items-center space-x-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors py-1.5 px-3 rounded-md border border-primary/30 hover:bg-primary/5">
                        <CloudArrowUpIcon className="w-5 h-5" />
                        <span>Subir vídeo manualmente a Firebase (MP4, WebM)</span>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            disabled={disabled}
                            className="hidden"
                        />
                    </label>
                    {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
                </div>
            )}
        </div>
    );
};

