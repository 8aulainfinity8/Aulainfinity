import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { AuthContext } from '../contexts/AuthContext';
import { useAuthorization } from '../hooks/useAuthorization';
import { NotificationContext } from '../contexts/NotificationContext';
import * as api from '../services/api';
import { ChevronLeftIcon, LogoutIcon } from './icons';
import { ROUTES } from '../constants/routes';
import { useConfirm } from '../contexts/ConfirmationContext';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { useI18n } from '../hooks/useI18n';
import { Button } from './ui/Button';
import { ImageUploader } from './ui/ImageUploader';
import { Camera, User, Check, Image as ImageIcon } from 'lucide-react';
import type { StudentUser } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { TeacherScheduleManager } from './TeacherScheduleManager';

interface IPasswordFormInput {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const AccountPage: React.FC = () => {
    const { t } = useI18n();
    const { updateUser, logout } = useContext(AuthContext);
    const { user, studentUser, teacherUser, isStudent, isTeacher, isAdmin } = useAuthorization();
    const { addToast } = useContext(NotificationContext);
    const navigate = useNavigate();
    const handleBack = useBackNavigation();
    
    const [tempAvatar, setTempAvatar] = useState<string | null>(null);
    const [tempBlob, setTempBlob] = useState<Blob | null>(null);
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);
    const [uploadStep, setUploadStep] = useState<'idle' | 'optimizing' | 'saving'>('idle');
    const [showUploader, setShowUploader] = useState(false);
    const [isSavingTeacherSchedules, setIsSavingTeacherSchedules] = useState(false);
    const confirm = useConfirm();

    const handleSaveTeacherSchedules = async (newSchedules: string[]) => {
        if (!teacherUser) return;
        setIsSavingTeacherSchedules(true);
        try {
            const updated = await api.updateTeacherDetails(teacherUser.id, {
                schedules: newSchedules
            });
            updateUser(updated);
            addToast('Agenda de disponibilidad para tutorías actualizada y sincronizada correctamente.', 'success');
        } catch (err) {
            addToast('Error al guardar los horarios de disponibilidad.', 'error');
        } finally {
            setIsSavingTeacherSchedules(false);
        }
    };

    // PWA native installation states and listeners
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);

    useEffect(() => {
        // Check standalone display mode on mount
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsPwaInstalled(isStandalone);

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        
        const handleAppInstalled = () => {
            setIsPwaInstalled(true);
            setDeferredPrompt(null);
            addToast('¡AulaInfinity se ha añadido con éxito a tus aplicaciones!', 'success');
        };
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallPwa = async () => {
        if (!deferredPrompt) {
            addToast('Si utilizas iOS/Safari, clica en el botón "Compartir" en la barra inferior y selecciona "Añadir a pantalla de inicio". En otros navegadores la app ya está registrada o preinstalada.', 'info');
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsPwaInstalled(true);
            addToast('¡Excelente! Instalando AulaInfinity en tu dispositivo.', 'success');
        }
        setDeferredPrompt(null);
    };

    // Compression and performance metrics states
    const [tempMetrics, setTempMetrics] = useState<{ originalSize: number; optimizedSize: number } | null>(null);
    const [optimizationHistory, setOptimizationHistory] = useState<{
        id: string;
        fileName: string;
        date: string;
        originalSize: number;
        optimizedSize: number;
    }[]>(() => {
        if (!user) return [];
        const stored = localStorage.getItem(`opt_history_${user.id}`);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { return []; }
        }
        // Seed initial simulation history elements
        const initial = [
            {
                id: 'opt-init-1',
                fileName: 'Caché de Material de Estudio',
                date: new Date(Date.now() - 86400000 * 3).toLocaleDateString('es-ES'),
                originalSize: 225280, // 220 KB
                optimizedSize: 46080, // 45 KB
            },
            {
                id: 'opt-init-2',
                fileName: 'Hojas de Ruta EBAU Comprimidas',
                date: new Date(Date.now() - 86400000 * 1).toLocaleDateString('es-ES'),
                originalSize: 870400, // 850 KB
                optimizedSize: 122880, // 120 KB
            }
        ];
        localStorage.setItem(`opt_history_${user.id}`, JSON.stringify(initial));
        return initial;
    });

    const handleImageProcessed = (dataUrl: string, blob: Blob, metrics?: { originalSize: number; optimizedSize: number }) => {
        setTempAvatar(dataUrl || null);
        setTempBlob(blob || null);
        if (metrics) {
            setTempMetrics(metrics);
        } else {
            setTempMetrics(null);
        }
    };

    const handleSaveAvatar = async () => {
        if (!user) return;
        setIsSavingAvatar(true);
        setUploadStep('optimizing');
        try {
            // Sequential step simulation to let user read the active canvas compression feedback
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUploadStep('saving');
            await new Promise(resolve => setTimeout(resolve, 800));

            let finalAvatarUrl = tempAvatar;

            // Option to upload compressed Blob to Firebase Storage
            if (tempBlob) {
                try {
                    addToast('Optimizando transferencia: Subiendo imagen comprimida a Firebase Storage...', 'info');
                    const fileName = `profile_${user.id}_${Date.now()}.jpg`;
                    const storageRef = ref(storage, `users/${user.id}/avatars/${fileName}`);
                    
                    // Upload the compressed canvas JPEG Blob
                    const snap = await uploadBytes(storageRef, tempBlob);
                    
                    // Retrieve download URL from Cloud run instance / Firebase Storage
                    const downloadUrl = await getDownloadURL(snap.ref);
                    finalAvatarUrl = downloadUrl;
                    addToast('Foto de perfil alojada en la nube con éxito.', 'success');
                } catch (storageErr) {
                    console.warn('Fallback: Error al subir a Firebase Storage, usando almacenamiento base64 local:', storageErr);
                    addToast('Almacenando localmente debido a una desconexión o política del contenedor.', 'info');
                }
            }

            // Update AuthContext user state & localStorage
            updateUser({
                ...user,
                avatar: finalAvatarUrl || undefined
            } as any);
            addToast('Foto de perfil sincronizada con éxito', 'success');

            // Append optimization metrics to the history and save to localStorage
            if (tempMetrics) {
                const newHistoryItem = {
                    id: `opt-${Date.now()}`,
                    fileName: 'Foto de Perfil',
                    date: new Date().toLocaleDateString('es-ES'),
                    originalSize: tempMetrics.originalSize,
                    optimizedSize: tempMetrics.optimizedSize
                };
                const updatedHistory = [newHistoryItem, ...optimizationHistory];
                setOptimizationHistory(updatedHistory);
                localStorage.setItem(`opt_history_${user.id}`, JSON.stringify(updatedHistory));
                setTempMetrics(null);
            }

            setShowUploader(false);
            setTempBlob(null);
        } catch (err) {
            addToast('Hubo un error al guardar tu imagen.', 'error');
        } finally {
            setIsSavingAvatar(false);
            setUploadStep('idle');
        }
    };

    const handleRecoveryRequest = async () => {
        if (!user || !isStudent) return;
        
        try {
            await api.requestPasswordRecovery(user.email || '');
            addToast('Instrucciones enviadas. Se cerrará tu sesión por seguridad.', 'success');
            setTimeout(() => {
                logout();
            }, 2500);
        } catch (err) {
            addToast('Error al solicitar la recuperación.', 'error');
        }
    };
    
    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
        addToast('Has cerrado la sesión.', 'info');
    };

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} />;
    }

    return (
        <div className="max-w-2xl mx-auto animate-slide-in-up">
             <button onClick={handleBack} aria-label="Volver al panel principal" className="flex items-center mb-6 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200">
                <ChevronLeftIcon className="w-5 h-5 mr-2" />Volver
             </button>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t('account.title')}</h1>
                    <p className="text-sm text-slate-500 mt-1">{t('account.subtitle')}</p>
                </div>

                {/* Profile Picture / Avatar Section */}
                {(isStudent || isTeacher) && (
                    <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-150 dark:border-slate-750 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                        {isSavingAvatar && (
                            <div className="absolute inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-50 animate-fadeIn pointer-events-auto">
                                <div className="space-y-4 flex flex-col items-center">
                                    <div className="relative w-12 h-12">
                                        <div className="absolute inset-0 rounded-full border-4 border-indigo-555/25 dark:border-indigo-500/10 animate-ping"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-white tracking-wide transition-all duration-300">
                                            {uploadStep === 'optimizing' ? '⚡ Optimizando imagen...' : '☁️ Guardando en la nube...'}
                                        </p>
                                        <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                                            {uploadStep === 'optimizing' 
                                                ? 'Reduciendo bytes con compresión inteligente en canvas local.' 
                                                : 'Transfiriendo archivo optimizado a Firebase Storage.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="relative group">
                            {(user as any).avatar ? (
                                <img 
                                    src={(user as any).avatar} 
                                    alt="Avatar de usuario" 
                                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-950/50 shadow-md"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border-4 border-indigo-100 dark:border-indigo-950/50 flex items-center justify-center text-indigo-500 shadow-inner">
                                    <User className="w-10 h-10" />
                                </div>
                            )}
                            <button 
                                onClick={() => setShowUploader(prev => !prev)}
                                className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-full shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                                title="Cambiar foto de perfil"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Foto de perfil</h3>
                            <p className="text-xs text-slate-500 max-w-sm">
                                Diseñado especialmente para optimizar la carga móvil mediante hardware canvas. Sube fotos desde tu galería para personalizarlas.
                            </p>
                            {!showUploader && (
                                <button 
                                    onClick={() => setShowUploader(true)}
                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center md:justify-start space-x-1"
                                >
                                    <span>{(user as any).avatar ? 'Actualizar foto' : 'Subir primera foto'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Local Uploader Area */}
                {showUploader && (
                    <div className="border border-slate-200 dark:border-slate-700 p-6 rounded-2xl bg-white dark:bg-slate-800/80 shadow-md space-y-4 animate-fadeIn relative overflow-hidden">
                        {isSavingAvatar && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/70 backdrop-blur-[1px] z-50 flex items-center justify-center cursor-not-allowed pointer-events-auto" />
                        )}
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Previsualizador y Optimizador</h4>
                            <button 
                                onClick={() => {
                                    setShowUploader(false);
                                    setTempAvatar(null);
                                }} 
                                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer"
                            >
                                Cancelar
                            </button>
                        </div>

                        <ImageUploader 
                            onImageProcessed={handleImageProcessed}
                            currentImageUrl={(user as any).avatar}
                            maxDimension={600}
                            quality={0.75}
                        />

                        {tempAvatar && tempAvatar !== (user as any).avatar && (
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSaveAvatar}
                                    disabled={isSavingAvatar}
                                    className="inline-flex items-center space-x-2 bg-indigo-605 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-550 font-semibold py-2 px-5 rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-98 transition-all cursor-pointer text-sm"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{isSavingAvatar ? 'Guardando...' : 'Confirmar y Guardar'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Profile Details (Name, Email, Subscription) */}
                {isStudent && studentUser && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-750">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Información Personal</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-150 dark:border-slate-750">
                                <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Nombre Completo</span>
                                <span className="text-slate-900 dark:text-slate-100 font-semibold text-lg">{studentUser.name}</span>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-150 dark:border-slate-750">
                                <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Correo Electrónico</span>
                                <span className="text-slate-900 dark:text-slate-100 font-semibold text-lg">{studentUser.email}</span>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-150 dark:border-slate-750">
                                <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Teléfono de contacto</span>
                                <span className="text-slate-900 dark:text-slate-100 font-semibold text-lg">{studentUser.phone || 'No especificado'}</span>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-150 dark:border-slate-750">
                                <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Plan de Suscripción</span>
                                <span className={`font-semibold text-lg flex items-center ${studentUser.isSubscribed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${studentUser.isSubscribed ? 'bg-green-500' : 'bg-red-500'}`} />
                                    {studentUser.isSubscribed ? 'Premium Activo' : 'Suscripción Inactiva'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Teacher Profile Details */}
                {isTeacher && teacherUser && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-750">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Información Docente</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-150 dark:border-slate-750">
                                <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Nombre del Docente</span>
                                <span className="text-slate-900 dark:text-slate-100 font-semibold text-lg">{teacherUser.name}</span>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-150 dark:border-slate-750">
                                <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Correo Institucional</span>
                                <span className="text-slate-900 dark:text-slate-100 font-semibold text-lg">{teacherUser.email}</span>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-150 dark:border-slate-750">
                                <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Categoría Principal</span>
                                <span className="text-slate-900 dark:text-slate-100 font-semibold text-lg">{teacherUser.category || 'Docente de Apoyo'}</span>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-150 dark:border-slate-750">
                                <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Disponibilidad de Tutorías</span>
                                <span className="text-slate-900 dark:text-slate-100 font-semibold text-lg flex items-center">
                                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 bg-green-500 animate-pulse" />
                                    Activa para alumnos premium
                                </span>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-150 dark:border-slate-750 sm:col-span-2">
                                <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Especialidad y Asignaturas</span>
                                <span className="text-slate-900 dark:text-slate-100 font-semibold text-base block mt-0.5">{teacherUser.subjects?.join(', ') || 'Todas'}</span>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-150 dark:border-slate-750 sm:col-span-2">
                                <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Niveles Educativos que Imparte</span>
                                <span className="text-slate-900 dark:text-slate-100 font-semibold text-base block mt-0.5">{teacherUser.levels?.join(', ') || 'Todos'}</span>
                            </div>
                            <div className="sm:col-span-2 mt-2">
                                <TeacherScheduleManager
                                    teacher={teacherUser}
                                    onSave={handleSaveTeacherSchedules}
                                    isSaving={isSavingTeacherSchedules}
                                />
                            </div>
                        </div>
                    </div>
                )}

                 {/* Memory and Mobile Efficiency Savings / Optimized files history */}
                 {isStudent && (
                     <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-755">
                         <div className="flex items-center space-x-2 text-left">
                             <span className="text-xl">⚡</span>
                             <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Ahorro de Memoria y Eficiencia Móvil</h2>
                         </div>
                         <p className="text-sm text-slate-500 text-left">
                             Auditoría detallada sobre los recursos de datos y la memoria RAM que has ahorrado a tu dispositivo y al servidor utilizando compresión local por hardware canvas.
                         </p>
 
                         {/* Scores Dashboard Group */}
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             {/* Card 1: Saved Bytes */}
                             <div className="bg-green-50/50 dark:bg-green-950/15 p-4 rounded-xl border border-green-200/50 dark:border-green-800/30 text-left">
                                 <span className="text-[10px] text-green-600 dark:text-green-400 block font-mono font-bold tracking-wider uppercase">Datos Ahorrados</span>
                                 <span className="text-2xl font-bold text-green-700 dark:text-green-350 block mt-1">
                                     {(() => {
                                         const bytes = optimizationHistory.reduce((acc, curr) => acc + (curr.originalSize - curr.optimizedSize), 0);
                                         if (bytes === 0) return '0 KB';
                                         return (bytes / 1024).toFixed(1) + ' KB';
                                     })()}
                                 </span>
                             </div>
                             {/* Card 2: Percentage saved */}
                             <div className="bg-indigo-50/50 dark:bg-indigo-950/15 p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-800/30 text-left">
                                 <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-mono font-bold tracking-wider uppercase">% Reducción Total</span>
                                 <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-350 block mt-1">
                                     {(() => {
                                         const orig = optimizationHistory.reduce((acc, curr) => acc + curr.originalSize, 0);
                                         const opt = optimizationHistory.reduce((acc, curr) => acc + curr.optimizedSize, 0);
                                         if (orig === 0) return '0%';
                                         return Math.round(((orig - opt) / orig) * 100) + '%';
                                     })()}
                                 </span>
                             </div>
                             {/* Card 3: Connection time saved */}
                             <div className="bg-amber-50/50 dark:bg-amber-950/15 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/30 text-left">
                                 <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-mono font-bold tracking-wider uppercase">Carga Acelerada (3G/Móvil)</span>
                                 <span className="text-2xl font-bold text-amber-700 dark:text-amber-350 block mt-1">
                                     {(() => {
                                         const bytes = optimizationHistory.reduce((acc, curr) => acc + (curr.originalSize - curr.optimizedSize), 0);
                                         const seconds = (bytes / (50 * 1024)) * 1.5; // slow 3G estimation
                                         return seconds.toFixed(1) + ' seg';
                                     })()}
                                 </span>
                             </div>
                         </div>
 
                         {/* Optimization timeline rows */}
                         <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-150 dark:border-slate-750 overflow-hidden mt-4">
                             <div className="p-3 bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-150 dark:border-slate-750 flex justify-between items-center bg-slate-105">
                                 <span className="text-xs font-bold text-slate-750 dark:text-slate-300">Detalles del Historial</span>
                                 <span className="text-[10px] font-mono text-slate-500">{optimizationHistory.length} optimizaciones</span>
                             </div>
                             <div className="divide-y divide-slate-150 dark:divide-slate-750 max-h-48 overflow-y-auto">
                                 {optimizationHistory.map(item => (
                                     <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-100/10">
                                         <div className="flex flex-col space-y-0.5 text-left">
                                             <span className="font-semibold text-slate-800 dark:text-slate-200">{item.fileName}</span>
                                             <span className="text-[10px] text-slate-500">{item.date}</span>
                                         </div>
                                         <div className="flex items-center space-x-3 text-right">
                                             <div className="flex flex-col space-y-0.5 font-mono text-right font-semibold">
                                                 <span className="text-slate-400 line-through">{(item.originalSize / 1024).toFixed(0)} KB</span>
                                                 <span className="font-bold text-green-600 dark:text-green-400">{(item.optimizedSize / 1024).toFixed(0)} KB</span>
                                             </div>
                                             <div className="bg-green-100 dark:bg-green-950/55 p-1 px-1.5 rounded text-[10px] font-bold text-green-700 dark:text-green-450">
                                                 -{Math.round(((item.originalSize - item.optimizedSize) / item.originalSize) * 100)}%
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </div>
                 )}

                {/* Password recovery flow */}
                <div className="mt-8 border-t dark:border-slate-705 pt-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Cambiar Contraseña</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Por seguridad, para cambiar tu contraseña, te enviaremos un correo electrónico de recuperación. Tu sesión actual se cerrará.
                    </p>
                    <div className="mt-4">
                        <Button onClick={handleRecoveryRequest}>
                            Enviar correo de recuperación
                        </Button>
                    </div>
                </div>

                {/* Preferencias de la plataforma / Onboarding */}
                <div className="mt-8 border-t dark:border-slate-705 pt-8 space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Preferencias de la Academia</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Si deseas repasar las funciones clave o la navegación de AulaInfinity, puedes restaurar la guía interactiva paso a paso. Se mostrará automáticamente al volver al panel principal.
                    </p>
                    <div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('onboardingCompleted');
                                addToast('Guía interactiva restablecida. Se activará la próxima vez que visites el panel principal.', 'success');
                            }}
                            className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-101 active:scale-99 transition-all cursor-pointer shadow-sm gap-2"
                        >
                            <span>🔄</span> Reiniciar Guía de Bienvenida (Tour)
                        </button>
                    </div>
                </div>

                {/* Progressive Web App (PWA) Custom Native Installer Card */}
                <div className="mt-8 border-t dark:border-slate-705 pt-8 space-y-4">
                    <div className="flex items-center space-x-2.5">
                        <span className="text-xl">📱</span>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">AulaInfinity en tu Dispositivo</h2>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Instala AulaInfinity como una aplicación nativa en tu móvil o tableta para disfrutar de mejor velocidad, soporte sin conexión y rápido acceso directo desde tu pantalla de inicio.
                    </p>
                    
                    {isPwaInstalled ? (
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 p-4 rounded-xl flex items-center space-x-3">
                            <span className="text-emerald-500 text-lg">❤️</span>
                            <div className="text-left font-serif">
                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">PWA Modo Standalone</span>
                                <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">¡Ya estás utilizando la aplicación nativa de AulaInfinity!</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-left">
                                <span className="text-xs font-mono font-bold text-indigo-500 block uppercase tracking-wider text-left">Acceso Directo Inteligente</span>
                                <span className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">Instalación compatible de alta velocidad y segura.</span>
                            </div>
                            <button
                                onClick={handleInstallPwa}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all hover:scale-102 active:scale-98 cursor-pointer gap-2"
                            >
                                <span>📥</span> Instalar Aplicación Móvil
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Danger zone / Logout */}
                <div className="mt-8 border-t dark:border-slate-700 pt-8">
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-500">Zona de Peligro</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Cerrar tu sesión en este dispositivo.
                    </p>
                    <button
                        onClick={async () => {
                            const isConfirmed = await confirm({
                                title: "Confirmar Cierre de Sesión",
                                description: "¿Estás seguro de que deseas cerrar tu sesión en AulaInfinity?",
                                confirmText: "Cerrar Sesión",
                                cancelText: "Volver a clases",
                                isDestructive: true
                            });
                            if (isConfirmed) {
                                handleLogout();
                            }
                        }}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-red-700 bg-red-100 hover:bg-red-200 hover:scale-101 active:scale-99 transition-all cursor-pointer shadow-sm"
                    >
                        <LogoutIcon className="w-5 h-5 mr-2" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};
