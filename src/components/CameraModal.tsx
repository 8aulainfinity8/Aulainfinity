import React, { useState, useRef, useEffect } from 'react';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (base64Data: string, fileName: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setCapturedImage(null);
            setVideoError(null);
            setIsLoading(true);
            return;
        }

        let activeStream: MediaStream | null = null;

        async function startCamera() {
            setIsLoading(true);
            setVideoError(null);
            try {
                const constraints: MediaStreamConstraints = {
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false
                };
                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                activeStream = mediaStream;
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
                setIsLoading(false);
            } catch (err: any) {
                console.error('Error starting webcam:', err);
                setVideoError(
                    'No se pudo acceder a la cámara. Asegúrate de otorgar permisos o utiliza el selector de archivos normal.'
                );
                setIsLoading(false);
            }
        }

        startCamera();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen, facingMode]);

    if (!isOpen) return null;

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Match base video resolution
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (context) {
            // Flip horizontal if using user camera for preview matching
            if (facingMode === 'user') {
                context.translate(width, 0);
                context.scale(-1, 1);
            }
            context.drawImage(video, 0, 0, width, height);
            
            // Generate raw JPEG Base64
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setCapturedImage(dataUrl);
            
            // Direct track stopping upon capture
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            const fileName = `foto_${Date.now()}.jpg`;
            onCapture(capturedImage, fileName);
            onClose();
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setIsLoading(true);
        // Toggling trigger to re-run the camera start effect
        setFacingMode(prev => prev);
    };

    const toggleFacingMode = () => {
        setCapturedImage(null);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div 
            id="camera-modal-backdrop"
            className="fixed inset-0 bg-slate-900/70 dark:bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                id="camera-modal-container"
                className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden border dark:border-slate-700 animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 19.5 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                        </svg>
                        {capturedImage ? 'Previsualizar foto' : 'Hacer foto'}
                    </h3>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Cerrar"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Main viewport */}
                <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {/* Hidden canvas for drawing snapshot */}
                    <canvas ref={canvasRef} className="hidden" />

                    {capturedImage ? (
                        <img 
                            src={capturedImage} 
                            alt="Foto tomada" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <>
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10 text-white gap-3">
                                    <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-xs font-semibold text-slate-300">Iniciando cámara...</span>
                                </div>
                            )}

                            {videoError ? (
                                <div className="p-6 text-center text-red-400 font-sans text-xs bg-slate-900 border border-slate-800 rounded-xl max-w-sm m-4 shadow-inner">
                                    <p className="font-bold text-sm mb-1.5 flex items-center justify-center gap-1.5">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
                                        </svg>
                                        Error de cámara
                                    </p>
                                    <p className="text-slate-400 text-left">{videoError}</p>
                                </div>
                            ) : (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="mt-5 flex gap-3 justify-center items-center font-sans">
                    {capturedImage ? (
                        <>
                            <button
                                type="button"
                                onClick={handleRetake}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-semibold cursor-pointer"
                            >
                                Volver a hacer
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Confirmar y usar
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-8 justify-between w-full px-6">
                            {/* Empty spacer or change camera capability */}
                            <button
                                type="button"
                                onClick={toggleFacingMode}
                                disabled={!!videoError}
                                className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                                title="Girar cámara"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                            </button>

                            {/* Camera Shutter Trigger button */}
                            <button
                                type="button"
                                onClick={handleCapture}
                                disabled={isLoading || !!videoError}
                                className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-100 p-1 flex items-center justify-center transition-all disabled:opacity-40 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
                                title="Capturar foto"
                            >
                                <div className="w-full h-full rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white font-bold shadow-inner">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </div>
                            </button>

                            {/* Standard Native Mobile Snapshot / File selector fallback */}
                            <label
                                className={`p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center shadow-sm ${videoError ? 'animate-pulse border border-indigo-500 bg-indigo-50/10' : ''}`}
                                title="Subir foto desde dispositivo"
                            >
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment" 
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                setCapturedImage(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75Z" />
                                </svg>
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
