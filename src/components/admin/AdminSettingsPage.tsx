import React, { useContext, useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// FIX: Corrected import path.
import * as api from '../../services/api';
// FIX: Corrected import path.
import type { AppConfig } from '../../types';
import { AppConfigContext } from '../../contexts/AppConfigContext';
import { NotificationContext } from '../../contexts/NotificationContext';
// FIX: Corrected import path.
import { ChevronLeftIcon, LockClosedIcon, PlusCircleIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '../icons';
import { Skeleton } from '../ui/Skeleton';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { FailureState } from '../ui/FailureState';

interface IAppSettingsFormInput extends AppConfig {}
interface IAdminPasswordFormInput {
    currentPassword: string;
    newPassword: string;
}

const SettingsSkeleton = () => (
    <div className="space-y-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </div>
        </div>
         <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20" />
            <Skeleton className="h-8 w-24 self-end" />
        </div>
    </div>
);

export const AdminSettingsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const handleBack = useBackNavigation('/admin/dashboard');
    const { addToast } = useContext(NotificationContext);
    const { updateConfig } = useContext(AppConfigContext);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Fetching App Config
    const { data: appConfig, isLoading, isError, refetch } = useQuery<AppConfig>({
        queryKey: ['appConfig'],
        queryFn: api.fetchAppConfig,
    });

    // Forms setup
    const { register, control, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<IAppSettingsFormInput>();
    const currentWhatsappMode = watch("whatsappMode") || "direct";

    useEffect(() => {
        if (appConfig) {
            reset(appConfig);
        }
    }, [appConfig, reset]);


    const { fields, append, remove } = useFieldArray({
        control,
        name: "tutoringSchedule",
    });
    
    const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }, reset: resetPassword } = useForm<IAdminPasswordFormInput>();

    // Mutations
    const updateConfigMutation = useMutation<AppConfig, Error, AppConfig>({
        mutationFn: api.updateAppConfig,
        onSuccess: (data) => {
            queryClient.setQueryData(['appConfig'], data);
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
            updateConfig(data);
            addToast('Ajustes guardados con éxito. Se han actualizado las funciones y accesos globales de todos los usuarios.', 'success');
        },
        onError: () => {
            addToast('Error al guardar los ajustes.', 'error');
        }
    });

    const changePasswordMutation = useMutation({
        mutationFn: api.changeAdminPassword,
        onSuccess: () => {
            addToast('Contraseña de administrador cambiada.', 'success');
            resetPassword();
        },
        onError: (err: Error) => {
            addToast(err.message, 'error');
        }
    });

    const onConfigSubmit = (data: IAppSettingsFormInput) => {
        const merged: AppConfig = {
            ...appConfig,
            ...data,
        };
        updateConfigMutation.mutate(merged);
    };

    const onPasswordSubmit = (data: IAdminPasswordFormInput) => {
        changePasswordMutation.mutate(data);
    };
    
    if (isLoading) return <SettingsSkeleton />;
    if (isError) return <FailureState message="No se pudieron cargar los ajustes de la aplicación." onRetry={refetch} />;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Ajustes Generales</h1>
                <button onClick={handleBack} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" />Volver
                </button>
            </div>
            
            <form onSubmit={handleSubmit(onConfigSubmit)} className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg space-y-8 mb-8">
                {/* Hidden payment configuration fields to preserve state */}
                <input type="hidden" {...register("subscriptionPrice", { valueAsNumber: true })} />
                <input type="hidden" {...register("tutoringPrice", { valueAsNumber: true })} />

                <div>
                    <h2 className="text-xl font-semibold text-primary mb-4">Horario de Tutorías</h2>
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 border dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                                <input {...register(`tutoringSchedule.${index}.day` as const)} placeholder="Día (Ej: Lunes)" className="w-full px-2 py-1 border dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                                <input {...register(`tutoringSchedule.${index}.time` as const)} placeholder="Hora (Ej: 17:00 - 18:00)" className="w-full px-2 py-1 border dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                                <input {...register(`tutoringSchedule.${index}.subject` as const)} placeholder="Asignatura" className="w-full px-2 py-1 border dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
                                <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full justify-self-end">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => append({ day: '', time: '', subject: '' })}
                        className="mt-4 flex items-center px-3 py-1.5 border border-dashed border-gray-400 dark:border-slate-500 text-sm font-medium text-slate-800 dark:text-slate-200 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                        <PlusCircleIcon className="w-5 h-5 mr-2" /> Añadir Horario
                    </button>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-primary mb-4">Control de Funciones y Acceso (Global)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/40 p-4 border dark:border-slate-700 rounded-lg">
                        <label className="flex items-center cursor-pointer space-x-3">
                            <input
                                type="checkbox"
                                id="aiEnabled"
                                {...register("aiEnabled")}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <div>
                                <span className="block text-sm font-medium text-slate-900 dark:text-slate-300">Asistente de IA Habilitado</span>
                                <span className="block text-xs text-slate-500">Permite a alumnos y profesores usar las herramientas y tutores de IA.</span>
                            </div>
                        </label>

                        <label className="flex items-center cursor-pointer space-x-3">
                            <input
                                type="checkbox"
                                id="videosEnabled"
                                {...register("videosEnabled")}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <div>
                                <span className="block text-sm font-medium text-slate-900 dark:text-slate-300">Acceso a Videos Habilitado</span>
                                <span className="block text-xs text-slate-500">Permite ver lecciones en video a través de la plataforma.</span>
                            </div>
                        </label>

                        <label className="flex items-center cursor-pointer space-x-3">
                            <input
                                type="checkbox"
                                id="subscriptionsEnabled"
                                {...register("subscriptionsEnabled")}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <div>
                                <span className="block text-sm font-medium text-slate-900 dark:text-slate-300">Suscripciones Habilitadas</span>
                                <span className="block text-xs text-slate-500">Permite el acceso a planes premium y pasarela de pago.</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
                        <span>📱 Configuración de Notificaciones por WhatsApp</span>
                        <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-0.5 rounded font-black uppercase">Nuevo</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        Elige cómo se enviarán las notificaciones de tutorías y avisos a estudiantes y profesores.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="md:col-span-2">
                            <label htmlFor="whatsappMode" className="block text-sm font-medium text-slate-900 dark:text-slate-300">Método de Envío</label>
                            <select
                                id="whatsappMode"
                                {...register("whatsappMode")}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 font-medium text-sm"
                            >
                                <option value="direct">Redirección del Navegador (Método Directo y Gratuito)</option>
                                <option value="meta">Opción 1: Meta Cloud API Oficial (WhatsApp Business Platform)</option>
                                <option value="evolution">Opción 2: Instancia Web / Evolution API / UltraMsg (Escaneo QR / Número Propio)</option>
                                <option value="greenapi">Opción 3: Green API (WhatsApp de alta estabilidad)</option>
                                <option value="firebase_queue">🔥 Opción 4: Cola en Firebase Firestore / Trigger Nativo (Recomendado Firebase)</option>
                                <option value="twilio">Twilio API (Envío Automatizado desde Servidor)</option>
                            </select>
                            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                                {currentWhatsappMode === 'direct' 
                                    ? '💡 Abre una ventana de WhatsApp con un mensaje pre-redactado. El emisor debe hacer clic en "Enviar" manualmente. Sin coste alguno ni errores.'
                                    : currentWhatsappMode === 'meta'
                                    ? '🏢 Conexión oficial directa con Meta Cloud API sin intermediarios. Ideal para empresas registradas en WhatsApp Business.'
                                    : currentWhatsappMode === 'evolution'
                                    ? '📱 Conecta tu número personal escaneando un código QR. Incluye sistema de auto-reparación inteligente para evitar el Error 404.'
                                    : currentWhatsappMode === 'greenapi'
                                    ? '🟢 Conecta mediante Green API utilizando tu IdInstance y ApiTokenInstance. Muy estable para automatizaciones.'
                                    : currentWhatsappMode === 'firebase_queue'
                                    ? '🔥 Guarda automáticamente cada notificación en la colección "whatsapp_queue" en tu base de datos Firebase Firestore. Listo para Extensión de Firebase, Zapier, Make o Triggers sin errores 404 ni servidores externos.'
                                    : '⚡ Los mensajes se envían de forma 100% automatizada en segundo plano usando la API de Twilio.'
                                }
                            </p>
                        </div>

                        {currentWhatsappMode === 'meta' && (
                            <div className="md:col-span-2 bg-blue-50/50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-900 rounded-xl space-y-4 animate-fade-in">
                                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">Credenciales Meta Cloud API (Opción 1)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="metaPhoneNumberId" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Phone Number ID (ID de Número)</label>
                                        <input
                                            type="text"
                                            id="metaPhoneNumberId"
                                            placeholder="Ej: 104829103948201"
                                            {...register("metaPhoneNumberId")}
                                            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="metaAccessToken" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Access Token (Permanente / Temporal)</label>
                                        <input
                                            type="password"
                                            id="metaAccessToken"
                                            placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxx"
                                            {...register("metaAccessToken")}
                                            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentWhatsappMode === 'evolution' && (
                            <div className="md:col-span-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-4 animate-fade-in">
                                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Instancia QR Web / Evolution API (Opción 2)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="evolutionInstanceUrl" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">URL de Envío / Endpoint HTTP</label>
                                        <input
                                            type="text"
                                            id="evolutionInstanceUrl"
                                            placeholder="https://api.ultramsg.com/instance123/messages/chat"
                                            {...register("evolutionInstanceUrl")}
                                            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="evolutionApiKey" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">API Key / Token de Instancia</label>
                                        <input
                                            type="password"
                                            id="evolutionApiKey"
                                            placeholder="B62910482019A8402..."
                                            {...register("evolutionApiKey")}
                                            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentWhatsappMode === 'greenapi' && (
                            <div className="md:col-span-2 bg-green-50/50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-900 rounded-xl space-y-4 animate-fade-in">
                                <h3 className="text-sm font-bold text-green-900 dark:text-green-300">Credenciales Green API (Opción 3)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="greenapiApiUrl" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">API URL / Host (Opcional pero recomendado)</label>
                                        <input
                                            type="url"
                                            id="greenapiApiUrl"
                                            placeholder="Ej: https://7103.api.greenapi.com"
                                            {...register("greenapiApiUrl")}
                                            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="greenapiIdInstance" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">ID Instance (Id de Instancia)</label>
                                        <input
                                            type="text"
                                            id="greenapiIdInstance"
                                            placeholder="Ej: 1101123456"
                                            {...register("greenapiIdInstance")}
                                            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="greenapiApiTokenInstance" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">API Token Instance (Token de la Instancia)</label>
                                        <input
                                            type="password"
                                            id="greenapiApiTokenInstance"
                                            placeholder="Ej: d75b11234..."
                                            {...register("greenapiApiTokenInstance")}
                                            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {currentWhatsappMode === 'twilio' && (
                            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/40 p-4 border dark:border-slate-700 rounded-xl space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Credenciales de Twilio WhatsApp</h3>
                                <p className="text-xs text-slate-500">
                                    Nota: Si dejas estas credenciales vacías, el sistema utilizará variables de entorno del servidor o simulará el envío de manera exitosa en consola.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="twilioAccountSid" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Account SID</label>
                                        <input
                                            type="text"
                                            id="twilioAccountSid"
                                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                                            {...register("twilioAccountSid")}
                                            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="twilioAuthToken" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Auth Token</label>
                                        <input
                                            type="password"
                                            id="twilioAuthToken"
                                            placeholder="••••••••••••••••••••••••••••••••"
                                            {...register("twilioAuthToken")}
                                            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="twilioWhatsappFrom" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Número de Envío (WhatsApp de Twilio)</label>
                                        <input
                                            type="text"
                                            id="twilioWhatsappFrom"
                                            placeholder="+14155238886 o whatsapp:+14155238886"
                                            {...register("twilioWhatsappFrom")}
                                            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                        <span>💳 Configuración de Recepción de Pagos (Bizum)</span>
                    </h2>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-6 border dark:border-slate-700 rounded-xl">
                        <div className="max-w-md">
                            <label htmlFor="bizumNumber" className="block text-sm font-bold text-slate-900 dark:text-slate-300">
                                Número de Teléfono Bizum
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                Este es el número bancario que se mostrará a los alumnos al elegir la opción de pago por Bizum en la pasarela.
                            </p>
                            <input
                                type="text"
                                id="bizumNumber"
                                placeholder="Ej: 600 000 000"
                                {...register("bizumNumber", { required: "El número Bizum es obligatorio" })}
                                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 font-mono text-base font-bold"
                            />
                            {errors.bizumNumber && <p className="mt-1 text-sm text-red-600">{errors.bizumNumber.message}</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
                        <span>🎙️ Servidores de Voz (WebRTC)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded font-black uppercase">Gratuito por Defecto</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        Configura los servidores de señalización e interconexión ICE/STUN/TURN para garantizar la conexión de voz en las tutorías y chats de grupo de forma económica.
                    </p>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-6 border dark:border-slate-700 rounded-xl space-y-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="webrtcStunServers" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Servidores STUN Públicos (Separados por Comas)
                                </label>
                                <input
                                    type="text"
                                    id="webrtcStunServers"
                                    placeholder="stun:stun.l.google.com:19302, stun:stun.cloudflare.com:3478, stun:stun.services.mozilla.com"
                                    {...register("webrtcStunServers")}
                                    className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                />
                                <span className="text-[11px] text-slate-400">
                                    Se usan para establecer la conexión directa P2P (totalmente gratis e instantáneo para el 85% de las llamadas).
                                </span>
                            </div>
                            
                            <div className="flex items-center space-x-3 mt-5">
                                <label className="flex items-center cursor-pointer space-x-3">
                                    <input
                                        type="checkbox"
                                        id="webrtcUseTurn"
                                        {...register("webrtcUseTurn")}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    />
                                    <div>
                                        <span className="block text-sm font-medium text-slate-900 dark:text-slate-300">Activar Pasarela de Relevo (TURN) - Opcional</span>
                                        <span className="block text-xs text-slate-500">Solo necesario para usuarios bajo firewalls muy estrictos. Desactivado por defecto para coste $0.</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {watch("webrtcUseTurn") && (
                            <div className="border-t dark:border-slate-700 pt-4 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                                <div className="md:col-span-3">
                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Configuración del Servidor TURN de Relevo Externo</h4>
                                    <p className="text-[11px] text-slate-400 mb-2">
                                        Introduce los datos de tu servidor TURN personalizado (p. ej. coturn en VPS propio, Twilio, Metered, etc.) para retransmitir las llamadas cuando fallen.
                                    </p>
                                </div>
                                <div className="md:col-span-1">
                                    <label htmlFor="webrtcTurnUrl" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">TURN Server URL</label>
                                    <input
                                        type="text"
                                        id="webrtcTurnUrl"
                                        placeholder="turn:turn.example.com:3478?transport=udp"
                                        {...register("webrtcTurnUrl")}
                                        className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label htmlFor="webrtcTurnUsername" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">TURN Username</label>
                                    <input
                                        type="text"
                                        id="webrtcTurnUsername"
                                        placeholder="usuario"
                                        {...register("webrtcTurnUsername")}
                                        className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label htmlFor="webrtcTurnCredential" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">TURN Credential / Password</label>
                                    <input
                                        type="password"
                                        id="webrtcTurnCredential"
                                        placeholder="contraseña"
                                        {...register("webrtcTurnCredential")}
                                        className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-primary mb-4">Información de Contacto y Registro</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="supportEmail" className="block text-sm font-medium text-slate-900 dark:text-slate-300">Email de Soporte</label>
                            <input
                                type="email"
                                id="supportEmail"
                                {...register("supportEmail", { required: true })}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        <div>
                            <label htmlFor="supportPhone" className="block text-sm font-medium text-slate-900 dark:text-slate-300">WhatsApp / Teléfono de Soporte</label>
                            <input
                                type="text"
                                id="supportPhone"
                                {...register("supportPhone")}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>
                    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/40 border dark:border-slate-700 rounded-lg">
                        <label className="flex items-center cursor-pointer space-x-3">
                            <input
                                type="checkbox"
                                id="registrationsOpen"
                                {...register("registrationsOpen")}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <div>
                                <span className="block text-sm font-medium text-slate-900 dark:text-slate-300">Inscripciones Abiertas</span>
                                <span className="block text-xs text-slate-500">Permitir que nuevos estudiantes se registren en la plataforma autónomamente.</span>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div className="flex justify-end border-t dark:border-slate-700 pt-6">
                    <button type="submit" disabled={isSubmitting} className="py-2 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:bg-primary/50">
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
            
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg space-y-4">
                <h2 className="text-xl font-semibold text-primary flex items-center"><LockClosedIcon className="w-5 h-5 mr-2" /> Cambiar Contraseña de Administrador</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-900 dark:text-slate-300">Contraseña Actual</label>
                        <div className="relative mt-1">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                id="currentPassword"
                                {...registerPassword("currentPassword", { required: "La contraseña actual es obligatoria" })}
                                className="block w-full px-3 py-2 pr-10 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100"
                            />
                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary">
                                {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                        {passwordErrors.currentPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>}
                    </div>
                     <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-900 dark:text-slate-300">Nueva Contraseña</label>
                        <div className="relative mt-1">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                {...registerPassword("newPassword", { required: "La nueva contraseña es obligatoria" })}
                                className="block w-full px-3 py-2 pr-10 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100"
                            />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary">
                                {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                         {passwordErrors.newPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>}
                    </div>
                </div>
                 <div className="flex justify-end">
                    <button type="submit" disabled={isPasswordSubmitting} className="py-2 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:bg-primary/50">
                        {isPasswordSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>
                </div>
            </form>
        </div>
    );
};