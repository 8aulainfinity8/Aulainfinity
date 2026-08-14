import React, { useState, useRef, useEffect } from 'react';
import { 
    UploadCloud, 
    Image as ImageIcon, 
    Trash2, 
    Sparkles, 
    CheckCircle, 
    TrendingDown, 
    RefreshCw,
    AlertCircle,
    Info
} from 'lucide-react';

interface ImageUploaderProps {
    onImageProcessed: (dataUrl: string, blob: Blob, metrics?: { originalSize: number, optimizedSize: number }) => void;
    currentImageUrl?: string;
    maxDimension?: number; // max width/height in px
    quality?: number; // 0.0 to 1.0 (JPEG quality)
    aspectRatio?: 'square' | 'any';
    label?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    onImageProcessed,
    currentImageUrl,
    maxDimension = 800,
    quality = 0.8,
    aspectRatio = 'square',
    label = "Foto de perfil"
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Memory/size reporting states
    const [metrics, setMetrics] = useState<{
        originalSize: number; // in bytes
        optimizedSize: number; // in bytes
        reductionPercentage: number;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Clean up our ObjectURL when component unmounts or before creating a new one
    // to prevent memory leaks on mobile devices.
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Handle drag events
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // Client-side image resizing and compression
    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecciona un archivo de imagen válido (JPEG, PNG, WEBP).');
            return;
        }

        setOriginalFile(file);
        setIsProcessing(true);
        setError(null);

        // Standard local preview using ObjectURL (temporary, revoked on change or unmount)
        const tempBlobUrl = URL.createObjectURL(file);
        
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = canvasRef.current || document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Adjust for aspect ratio or downscaling
                if (aspectRatio === 'square') {
                    // Crop or scale as a square
                    const minDimension = Math.min(width, height);
                    const cropSize = Math.min(minDimension, maxDimension);
                    canvas.width = cropSize;
                    canvas.height = cropSize;

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        
                        // Center crop
                        const sourceX = (width - minDimension) / 2;
                        const sourceY = (height - minDimension) / 2;
                        ctx.drawImage(
                            img, 
                            sourceX, sourceY, minDimension, minDimension, // source
                            0, 0, cropSize, cropSize // destination
                        );
                    }
                } else {
                    // Standard proportional downscale
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        } else {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                    }
                }

                // Compress canvas image to JPEG blob
                canvas.toBlob(
                    (optimizedBlob) => {
                        if (optimizedBlob) {
                            // Convert back to base64 or binary dataUrl to communicate up to parent
                            const reader = new FileReader();
                            reader.readAsDataURL(optimizedBlob);
                            reader.onloadend = () => {
                                const dataUrl = reader.result as string;
                                
                                // Revoke previous ObjectURL to free up memory
                                if (previewUrl && previewUrl.startsWith('blob:')) {
                                    URL.revokeObjectURL(previewUrl);
                                }
                                
                                // Set new preview to optimized local base64/dataURL context
                                setPreviewUrl(dataUrl);
                                setIsProcessing(false);
                                
                                // Report metrics
                                const originalSize = file.size;
                                const optimizedSize = optimizedBlob.size;
                                const reductionPercentage = Math.round(((originalSize - optimizedSize) / originalSize) * 100);
                                
                                setMetrics({
                                    originalSize,
                                    optimizedSize,
                                    reductionPercentage
                                });

                                // Communicate results
                                onImageProcessed(dataUrl, optimizedBlob, { originalSize, optimizedSize });
                            };
                        } else {
                            throw new Error('No se pudo generar el blog optimizado de la imagen.');
                        }
                    },
                    'image/jpeg',
                    quality
                );

                // Safe cleanup of temporary url
                URL.revokeObjectURL(tempBlobUrl);

            } catch (err) {
                console.error(err);
                setError('Error al optimizar la imagen localmente. Inténtalo de nuevo.');
                setIsProcessing(false);
                URL.revokeObjectURL(tempBlobUrl);
            }
        };

        img.onerror = () => {
            setError('No se pudo cargar la imagen para su procesamiento.');
            setIsProcessing(false);
            URL.revokeObjectURL(tempBlobUrl);
        };

        // Trigger loading the image
        img.src = tempBlobUrl;
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setOriginalFile(null);
        setMetrics(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        // Let parent know it was cleared
        onImageProcessed('', new Blob());
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const decimals = 1;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            {label && (
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350">
                    {label}
                </label>
            )}

            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-250 cursor-pointer flex flex-col items-center justify-center min-h-[180px] text-center select-none ${
                    isDragging 
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]' 
                        : previewUrl 
                            ? 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10'
                            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                }`}
            >
                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden" 
                />

                {isProcessing ? (
                    <div className="flex flex-col items-center justify-center space-y-3 animate-pulse">
                        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                            Optimizando imagen móvil...
                        </span>
                    </div>
                ) : previewUrl ? (
                    <div className="relative group flex flex-col items-center space-y-4">
                        {/* Selected Preview thumbnail */}
                        <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                            <img 
                                src={previewUrl} 
                                alt="Previsualización local" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
                                <span className="text-xs font-semibold flex items-center">
                                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                    Cambiar
                                </span>
                            </div>
                        </div>

                        {/* Image details & metric optimizations */}
                        <div className="flex flex-col items-center space-y-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {originalFile ? originalFile.name : "Imagen cargada"}
                            </span>
                            
                            {metrics && (
                                <div className="flex flex-col items-center space-y-1 mt-1 bg-slate-100 dark:bg-slate-750 p-2.5 rounded-xl border border-slate-200 dark:border-slate-705">
                                    <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                        <span className="line-through">{formatBytes(metrics.originalSize)}</span>
                                        <ChevronRightIcon className="w-3 h-3 text-slate-400" />
                                        <span className="font-bold text-green-600 dark:text-green-400 flex items-center">
                                            {formatBytes(metrics.optimizedSize)}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-[10px] text-green-600 dark:text-green-400 font-mono font-bold uppercase tracking-wider">
                                        <TrendingDown className="w-3.5 h-3.5" />
                                        <span>Reducción de memoria: {metrics.reductionPercentage}%</span>
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleClear}
                                className="mt-2 text-xs font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center space-x-1 py-1 px-2.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar imagen</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 flex flex-col items-center">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-500">
                            <UploadCloud className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Arrastra tu imagen aquí, o <span className="text-indigo-600 dark:text-indigo-400 hover:underline">explora</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Admite JPG, PNG o WEBP. Redimensionamiento automático en dispositivo móvil.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden canvas for browser-side scaling */}
            <canvas ref={canvasRef} className="hidden" />

            {error && (
                <div className="flex items-start space-x-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-xs">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex items-start space-x-2 bg-slate-50 dark:bg-slate-900/40 text-slate-500 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed">
                <Info className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" />
                <span>
                    <strong>Mobile Memory Protection:</strong> Este cargador procesa tu imagen localmente en el dispositivo utilizando la GPU (HTML5 Canvas) antes de iniciar la transmisión. Esto previene saturaciones de RAM en navegadores móviles al descartar la imagen original de alta resolución inmediatamente.
                </span>
            </div>
        </div>
    );
};

// Subtle icon for visual flows
const ChevronRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
);
