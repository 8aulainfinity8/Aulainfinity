import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm, SubmitHandler } from 'react-hook-form';
import { NotificationContext } from '../../contexts/NotificationContext';
import { AppConfigContext } from '../../contexts/AppConfigContext';
import * as api from '../../services/api';
import { ChevronLeftIcon, TrophyIcon, LightBulbIcon, BookOpenIcon, SparklesIcon, WifiIcon, EyeIcon, EyeSlashIcon } from '../icons';
import { ROUTES } from '../../constants/routes';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { ConfirmationModal } from '../ConfirmationModal';
import type { AppConfig } from '../../types';

interface IConnectionFormInput {
    serverUrl: string;
    serverPort: number;
    dbHost: string;
    dbUser: string;
    dbPassword?: string;
    dbName: string;
}

interface IWhatsappFormInput {
    whatsappMode: 'direct' | 'twilio' | 'meta' | 'evolution' | 'firebase_queue' | 'greenapi';
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioWhatsappFrom: string;
    metaPhoneNumberId: string;
    metaAccessToken: string;
    evolutionInstanceUrl: string;
    evolutionApiKey: string;
    greenapiIdInstance: string;
    greenapiApiTokenInstance: string;
    greenapiApiUrl: string;
}

export const AdminConnectionPage: React.FC = () => {
    const { addToast } = useContext(NotificationContext);
    const { appConfig, updateConfig } = useContext(AppConfigContext);
    const navigate = useNavigate();

    // Forms
    const { register: registerConnection, handleSubmit: handleConnectionSubmit } = useForm<IConnectionFormInput>();
    const { register: registerWhatsapp, handleSubmit: handleWhatsappSubmit, watch: watchWhatsapp, setValue: setWhatsappValue } = useForm<IWhatsappFormInput>({
        defaultValues: {
            whatsappMode: 'direct',
            twilioAccountSid: '',
            twilioAuthToken: '',
            twilioWhatsappFrom: '',
            metaPhoneNumberId: '',
            metaAccessToken: '',
            evolutionInstanceUrl: '',
            evolutionApiKey: '',
            greenapiIdInstance: '',
            greenapiApiTokenInstance: '',
            greenapiApiUrl: ''
        }
    });

    const watchedWhatsappMode = watchWhatsapp('whatsappMode') || 'direct';

    // Tabs
    const [activeTab, setActiveTab] = useState<'whatsapp' | 'connection' | 'visual_lab'>('whatsapp');

    // Visual Lab state
    const [simulatedViewport, setSimulatedViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'standard' | 'destructive'>('standard');
    const [skeletonLoading, setSkeletonLoading] = useState(true);

    // WhatsApp Tester state
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('¡Hola! Probando la integración de notificaciones por WhatsApp en AulaInfinity. 🚀');
    const [isTestingWhatsapp, setIsTestingWhatsapp] = useState(false);
    const [testResult, setTestResult] = useState<{
        status: 'idle' | 'loading' | 'success' | 'error';
        message?: string;
        simulated?: boolean;
        sid?: string;
    }>({ status: 'idle' });

    // Password fields visibility
    const [showAuthToken, setShowAuthToken] = useState(false);
    const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);

    // Initialize values from appConfig Context
    useEffect(() => {
        if (appConfig) {
            setWhatsappValue('whatsappMode', appConfig.whatsappMode || 'direct');
            setWhatsappValue('twilioAccountSid', appConfig.twilioAccountSid || '');
            setWhatsappValue('twilioAuthToken', appConfig.twilioAuthToken || '');
            setWhatsappValue('twilioWhatsappFrom', appConfig.twilioWhatsappFrom || '');
            setWhatsappValue('metaPhoneNumberId', appConfig.metaPhoneNumberId || '');
            setWhatsappValue('metaAccessToken', appConfig.metaAccessToken || '');
            setWhatsappValue('evolutionInstanceUrl', appConfig.evolutionInstanceUrl || '');
            setWhatsappValue('evolutionApiKey', appConfig.evolutionApiKey || '');
            setWhatsappValue('greenapiIdInstance', appConfig.greenapiIdInstance || '');
            setWhatsappValue('greenapiApiTokenInstance', appConfig.greenapiApiTokenInstance || '');
            setWhatsappValue('greenapiApiUrl', appConfig.greenapiApiUrl || '');
        }
    }, [appConfig, setWhatsappValue]);

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
        }
    };

    const onConnectionSubmit: SubmitHandler<IConnectionFormInput> = (data) => {
        console.log("Connection data saved (simulated):", data);
        addToast('Datos de conexión guardados correctamente.', 'success');
    };

    const onWhatsappSubmit: SubmitHandler<IWhatsappFormInput> = async (data) => {
        if (!appConfig) return;
        
        setIsSavingWhatsapp(true);
        try {
            const updatedConfig: AppConfig = {
                ...appConfig,
                whatsappMode: data.whatsappMode,
                twilioAccountSid: data.twilioAccountSid,
                twilioAuthToken: data.twilioAuthToken,
                twilioWhatsappFrom: data.twilioWhatsappFrom,
                metaPhoneNumberId: data.metaPhoneNumberId,
                metaAccessToken: data.metaAccessToken,
                evolutionInstanceUrl: data.evolutionInstanceUrl,
                evolutionApiKey: data.evolutionApiKey,
                greenapiIdInstance: data.greenapiIdInstance,
                greenapiApiTokenInstance: data.greenapiApiTokenInstance,
                greenapiApiUrl: data.greenapiApiUrl
            };

            const response = await api.updateAppConfig(updatedConfig);
            updateConfig(response);
            addToast('Configuración de WhatsApp guardada con éxito.', 'success');
        } catch (error: any) {
            console.error("Error saving WhatsApp config:", error);
            addToast('Error al guardar la configuración de WhatsApp.', 'error');
        } finally {
            setIsSavingWhatsapp(false);
        }
    };

    const handleSendTestWhatsapp = async () => {
        if (!testPhone.trim()) {
            addToast('Por favor introduce un número de teléfono de destino.', 'error');
            return;
        }

        setIsTestingWhatsapp(true);
        setTestResult({ status: 'loading' });

        try {
            // Get form credentials currently typed so admins can test before saving!
            const twilioAccountSid = (document.getElementById('twilioAccountSid') as HTMLInputElement)?.value || '';
            const twilioAuthToken = (document.getElementById('twilioAuthToken') as HTMLInputElement)?.value || '';
            const twilioWhatsappFrom = (document.getElementById('twilioWhatsappFrom') as HTMLInputElement)?.value || '';
            const metaPhoneNumberId = (document.getElementById('metaPhoneNumberId') as HTMLInputElement)?.value || '';
            const metaAccessToken = (document.getElementById('metaAccessToken') as HTMLInputElement)?.value || '';
            const evolutionInstanceUrl = (document.getElementById('evolutionInstanceUrl') as HTMLInputElement)?.value || '';
            const evolutionApiKey = (document.getElementById('evolutionApiKey') as HTMLInputElement)?.value || '';
            const greenapiIdInstance = (document.getElementById('greenapiIdInstance') as HTMLInputElement)?.value || '';
            const greenapiApiTokenInstance = (document.getElementById('greenapiApiTokenInstance') as HTMLInputElement)?.value || '';
            const greenapiApiUrl = (document.getElementById('greenapiApiUrl') as HTMLInputElement)?.value || '';

            const res = await api.sendWhatsApp({
                to: testPhone,
                message: testMessage,
                whatsappMode: watchedWhatsappMode,
                twilioAccountSid,
                twilioAuthToken,
                twilioWhatsappFrom,
                metaPhoneNumberId,
                metaAccessToken,
                evolutionInstanceUrl,
                evolutionApiKey,
                greenapiIdInstance,
                greenapiApiTokenInstance,
                greenapiApiUrl
            });

            if (res.success) {
                setTestResult({
                    status: 'success',
                    message: res.message,
                    simulated: res.simulated,
                    sid: res.sid
                });
                addToast('¡Mensaje de prueba procesado!', 'success');
            } else {
                setTestResult({
                    status: 'error',
                    message: res.error || res.message || 'Fallo desconocido al conectar con el servicio de WhatsApp.'
                });
                addToast('Fallo en el envío del mensaje de prueba.', 'error');
            }
        } catch (err: any) {
            setTestResult({
                status: 'error',
                message: err.message || 'Error de red o excepción interna.'
            });
            addToast('Error de red al probar WhatsApp.', 'error');
        } finally {
            setIsTestingWhatsapp(false);
        }
    };

    const triggerToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
        addToast(message, type === 'warning' ? 'info' : type);
    };

    const handleOpenTestModal = (type: 'standard' | 'destructive') => {
        setModalType(type);
        setIsTestModalOpen(true);
    };

    const viewportWidths = {
        mobile: 'max-w-[360px] border-x border-slate-300 dark:border-slate-700 h-auto',
        tablet: 'max-w-[760px] border-x border-slate-300 dark:border-slate-700 h-auto',
        desktop: 'w-full h-auto',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <span>🔌 Centro de API y Laboratorio Técnico</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Configura integraciones de WhatsApp, gestiona servidores y ejecuta pruebas interactivas de interfaz.
                    </p>
                </div>
                <button onClick={handleBack} className="flex items-center self-start md:self-auto px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200 shadow-sm cursor-pointer">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" />Volver
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-700 overflow-x-auto whitespace-nowrap custom-scrollbar">
                <button
                    onClick={() => setActiveTab('whatsapp')}
                    className={`py-3 px-6 font-semibold flex items-center border-b-2 transition-all duration-150 ${
                        activeTab === 'whatsapp'
                            ? 'border-primary text-primary dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <span className="mr-2">📱</span>
                    Gestión de WhatsApp & Twilio
                </button>
                <button
                    onClick={() => setActiveTab('connection')}
                    className={`py-3 px-6 font-semibold flex items-center border-b-2 transition-all duration-150 ${
                        activeTab === 'connection'
                            ? 'border-primary text-primary dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <WifiIcon className="w-5 h-5 mr-2" />
                    Configuración de Red
                </button>
                <button
                    onClick={() => setActiveTab('visual_lab')}
                    className={`py-3 px-6 font-semibold flex items-center border-b-2 transition-all duration-150 ${
                        activeTab === 'visual_lab'
                            ? 'border-primary text-primary dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Laboratorio de Interfaz
                </button>
            </div>

            {/* 1st Tab: WhatsApp Configuration & Interactive Sandbox */}
            {activeTab === 'whatsapp' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                    {/* Left Column: Config Form (Spans 7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        <form onSubmit={handleWhatsappSubmit(onWhatsappSubmit)} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-md border border-gray-100 dark:border-slate-700/60 space-y-6">
                            <div className="flex items-center justify-between border-b dark:border-slate-700 pb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <span>⚙️ Configuración de Envío</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Elige cómo interactúa el sistema con WhatsApp al notificar clases.</p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                                    watchedWhatsappMode === 'twilio' 
                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' 
                                        : watchedWhatsappMode === 'meta'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                        : watchedWhatsappMode === 'evolution'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : watchedWhatsappMode === 'greenapi'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300'
                                        : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                }`}>
                                    {watchedWhatsappMode === 'twilio' ? 'Modo Twilio API' : watchedWhatsappMode === 'meta' ? 'Opción 1: Meta Cloud API' : watchedWhatsappMode === 'evolution' ? 'Opción 2: Instancia QR Web' : watchedWhatsappMode === 'greenapi' ? 'Opción 3: Green API' : 'Modo Directo'}
                                </span>
                            </div>

                            {/* Delivery Mode Selector */}
                            <div>
                                <label htmlFor="whatsappMode" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Método de Notificación de Tutorías</label>
                                <select
                                    id="whatsappMode"
                                    {...registerWhatsapp("whatsappMode")}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 font-medium text-sm"
                                >
                                    <option value="direct">Redirección del Navegador (Método Directo y Gratuito)</option>
                                    <option value="meta">Opción 1: Meta Cloud API Oficial (WhatsApp Business Platform)</option>
                                    <option value="evolution">Opción 2: Instancia Web / Evolution API / UltraMsg (Escaneo QR / Número Propio)</option>
                                    <option value="greenapi">Opción 3: Green API (WhatsApp de alta estabilidad)</option>
                                    <option value="firebase_queue">🔥 Opción 4: Cola en Firebase Firestore / Trigger Nativo (Recomendado Firebase)</option>
                                    <option value="twilio">Twilio API (Envío Automatizado desde Servidor)</option>
                                </select>
                                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                                    {watchedWhatsappMode === 'direct' 
                                        ? '💡 Abre ventanas de WhatsApp Web con mensajes pre-redactados para que los administradores o profesores hagan clic en "Enviar" manualmente. No tiene ningún coste y es ideal para uso inmediato.'
                                        : watchedWhatsappMode === 'meta'
                                        ? '🏢 Conexión oficial de Meta (Facebook). Requiere crear una app en Meta for Developers y obtener el ID de número de teléfono. 100% oficial y robusto sin intermediarios.'
                                        : watchedWhatsappMode === 'evolution'
                                        ? '📱 Conecta tu propio WhatsApp escaneando un código QR mediante una instancia Web (Evolution API, UltraMsg, WPPConnect o Baileys). Incluye auto-reparación inteligente para evitar el Error 404.'
                                        : watchedWhatsappMode === 'greenapi'
                                        ? '🟢 Conecta mediante Green API utilizando tu IdInstance y ApiTokenInstance. Alta estabilidad para el envío de notificaciones.'
                                        : watchedWhatsappMode === 'firebase_queue'
                                        ? '🔥 Integración nativa con tu base de datos Firebase Firestore. Guarda automáticamente cada notificación en la colección "whatsapp_queue". Ideal para conectar con la Extensión oficial "Send Messages with Twilio" en la consola de Firebase, Zapier, Make o Triggers en Cloud Functions sin preocuparte por el Error 404 ni servidores externos.'
                                        : '⚡ Envía notificaciones de forma 100% automatizada en segundo plano sin intervención humana usando tu cuenta de Twilio.'
                                    }
                                </p>
                            </div>

                            {/* Opción 3: Firebase Queue Section */}
                            {watchedWhatsappMode === 'firebase_queue' && (
                                <div className="transition-all duration-300 space-y-4 p-4 rounded-lg bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-orange-900 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>🔥 Integración Nativa con Firebase Firestore (Cola "whatsapp_queue")</span>
                                        </h3>
                                    </div>
                                    <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                        <p className="font-semibold text-orange-800 dark:text-orange-200">
                                            ✅ No necesitas configurar servidores externos en esta pantalla para empezar a usar WhatsApp con Firebase.
                                        </p>
                                        <p>
                                            Al elegir este modo, cada notificación de tutoría confirmada (o prueba de envío) creará instantáneamente un documento en la colección <code className="font-mono bg-orange-100 dark:bg-orange-900/50 px-1.5 py-0.5 rounded font-bold">whatsapp_queue</code> de tu base de datos Firestore, y registrará el historial en <code className="font-mono bg-orange-100 dark:bg-orange-900/50 px-1.5 py-0.5 rounded font-bold">whatsapp_logs</code>.
                                        </p>
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded border border-orange-200 dark:border-orange-900 space-y-1.5">
                                            <p className="font-bold text-slate-800 dark:text-slate-200">🛠️ ¿Cómo completar el envío automático en tu Firebase?</p>
                                            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                                                <li><strong>Extensión Oficial (Consola Firebase):</strong> Ve a Firebase &gt; <em>Extensions</em> &gt; instala <strong>"Send Messages with Twilio"</strong> o <strong>"MessageBird"</strong> y configúralo para escuchar la colección <code className="font-mono">whatsapp_queue</code>.</li>
                                                <li><strong>Automatización Make / Zapier:</strong> Crea un escenario en Make o Zapier que escuche nuevos documentos en tu Firestore <code className="font-mono">whatsapp_queue</code> y envíe el WhatsApp con tu número personal o comercial.</li>
                                                <li><strong>Modo Inmediato Sin Configurar:</strong> Si quieres una solución 100% gratuita y sin errores que funcione ahora mismo sin configurar Firebase ni servidores, selecciona <strong>"Redirección del Navegador (Método Directo y Gratuito)"</strong> en el desplegable de arriba.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Opción 1: Meta Cloud API Credentials Section */}
                            {watchedWhatsappMode === 'meta' && (
                                <div className="transition-all duration-300 space-y-4 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>🏢 Credenciales Meta Cloud API Oficial (Opción 1)</span>
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="metaPhoneNumberId" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Phone Number ID (ID del Número de Teléfono)</label>
                                            <input
                                                type="text"
                                                id="metaPhoneNumberId"
                                                placeholder="Ej: 104829103948201"
                                                {...registerWhatsapp("metaPhoneNumberId")}
                                                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="metaAccessToken" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Access Token (Token de Acceso Permanente / Temporal)</label>
                                            <input
                                                type="password"
                                                id="metaAccessToken"
                                                placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                {...registerWhatsapp("metaAccessToken")}
                                                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                            />
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                Obtén este token desde el panel de WhatsApp &gt; Configuración de la API en Meta for Developers.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Opción 2: Evolution API / UltraMsg Credentials Section */}
                            {watchedWhatsappMode === 'evolution' && (
                                <div className="transition-all duration-300 space-y-4 p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>📱 Instancia QR Web / Evolution API (Opción 2)</span>
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="evolutionInstanceUrl" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">URL de Instancia / Endpoint (Ej: Evolution API, UltraMsg, Green API)</label>
                                            <input
                                                type="text"
                                                id="evolutionInstanceUrl"
                                                placeholder="https://api.ultramsg.com/instance12345/messages/chat ó https://tu-evolution.com/message/sendText/myInstance"
                                                {...registerWhatsapp("evolutionInstanceUrl")}
                                                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="evolutionApiKey" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">API Key / Token de Instancia</label>
                                            <input
                                                type="password"
                                                id="evolutionApiKey"
                                                placeholder="B62910482019A8402..."
                                                {...registerWhatsapp("evolutionApiKey")}
                                                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                            />
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                Escanea tu código QR en tu proveedor y pega aquí el token de autenticación de tu instancia.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Opción Green API Credentials Section */}
                            {watchedWhatsappMode === 'greenapi' && (
                                <div className="transition-all duration-300 space-y-4 p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-green-900 dark:text-green-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>🟢 Credenciales Green API (Opción 3)</span>
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="greenapiApiUrl" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">API URL / Host (Opcional pero recomendado)</label>
                                            <input
                                                type="url"
                                                id="greenapiApiUrl"
                                                placeholder="Ej: https://7103.api.greenapi.com"
                                                {...registerWhatsapp("greenapiApiUrl")}
                                                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="greenapiIdInstance" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">ID Instance (Id de Instancia)</label>
                                            <input
                                                type="text"
                                                id="greenapiIdInstance"
                                                placeholder="Ej: 1101123456"
                                                {...registerWhatsapp("greenapiIdInstance")}
                                                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="greenapiApiTokenInstance" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">API Token Instance (Token de la Instancia)</label>
                                            <input
                                                type="password"
                                                id="greenapiApiTokenInstance"
                                                placeholder="Ej: d75b11234..."
                                                {...registerWhatsapp("greenapiApiTokenInstance")}
                                                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                            />
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                Encuentra estos datos en tu panel de control de Green API tras registrar tu número de teléfono.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Twilio Credentials Section */}
                            {watchedWhatsappMode === 'twilio' && (
                                <div className="transition-all duration-300 space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-750 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>🔑 Credenciales de la API de Twilio</span>
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="twilioAccountSid" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Account SID</label>
                                            <input
                                                type="text"
                                                id="twilioAccountSid"
                                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                                                {...registerWhatsapp("twilioAccountSid")}
                                                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="twilioAuthToken" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Auth Token</label>
                                            <div className="relative rounded-md shadow-sm">
                                                <input
                                                    type={showAuthToken ? "text" : "password"}
                                                    id="twilioAuthToken"
                                                    placeholder="••••••••••••••••••••••••••••••••"
                                                    {...registerWhatsapp("twilioAuthToken")}
                                                    className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAuthToken(!showAuthToken)}
                                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700"
                                                >
                                                    {showAuthToken ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="twilioWhatsappFrom" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Número Remitente Twilio (Con prefijo, Ej: +14155238886)</label>
                                            <input
                                                type="text"
                                                id="twilioWhatsappFrom"
                                                placeholder="+14155238886"
                                                {...registerWhatsapp("twilioWhatsappFrom")}
                                                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                            />
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                Recuerda anteponer el prefijo de país. En modo de prueba Sandbox de Twilio, el remitente suele ser <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-indigo-600 dark:text-indigo-400 font-bold">+14155238886</code>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Config */}
                            <div className="flex justify-end border-t dark:border-slate-700 pt-5">
                                <button
                                    type="submit"
                                    disabled={isSavingWhatsapp}
                                    className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-md cursor-pointer flex items-center gap-2"
                                >
                                    {isSavingWhatsapp ? (
                                        <>
                                            <Spinner className="w-4 h-4 text-white" />
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>💾 Guardar Ajustes de WhatsApp</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Setup Guide */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-150 dark:border-slate-750 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                                <span>📖 Guía Rápida de Configuración</span>
                            </h3>
                            {watchedWhatsappMode === 'meta' ? (
                                <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-400 space-y-2.5 leading-relaxed">
                                    <li>Accede a <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Meta for Developers</a> y crea una aplicación de tipo <strong>Negocios (Business)</strong>.</li>
                                    <li>Añade el producto <strong>WhatsApp</strong> a tu aplicación.</li>
                                    <li>En la sección <strong>WhatsApp &gt; Configuración de la API</strong>, copia el <strong>ID de número de teléfono (Phone Number ID)</strong>.</li>
                                    <li>Copia tu <strong>Access Token</strong> (puedes generar un token temporal para pruebas o un token de usuario del sistema permanente en tu Administrador Comercial).</li>
                                    <li>Pega ambas credenciales arriba, haz clic en <strong>Guardar Ajustes</strong> y prueba enviar un mensaje en el panel derecho.</li>
                                </ol>
                            ) : watchedWhatsappMode === 'evolution' ? (
                                <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-400 space-y-2.5 leading-relaxed">
                                    <li>Utiliza una plataforma o servidor de WhatsApp Web por código QR como <a href="https://evolution-api.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Evolution API</a>, <a href="https://ultramsg.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">UltraMsg</a> o Green API.</li>
                                    <li>Crea una instancia con tu número de teléfono escaneando el <strong>Código QR</strong> desde la app de WhatsApp en tu móvil.</li>
                                    <li>Copia la <strong>URL de envío (Endpoint HTTP POST)</strong> y la <strong>API Key / Token de Instancia</strong> proporcionada por la plataforma.</li>
                                    <li>Pega los valores arriba, haz clic en <strong>Guardar Ajustes</strong> ¡y disfruta de envíos ilimitados desde tu propio número!</li>
                                </ol>
                            ) : (
                                <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-400 space-y-2.5 leading-relaxed">
                                    <li>Inicia sesión en tu consola de <a href="https://www.twilio.com" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Twilio</a> y obtén tu <strong>Account SID</strong> y <strong>Auth Token</strong>.</li>
                                    <li>Ve a la sección de <strong>Messaging &gt; Try it out &gt; Send a WhatsApp message</strong>.</li>
                                    <li>Envía un mensaje de WhatsApp al número que se muestra en pantalla (comúnmente <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-indigo-500 font-mono font-bold">+1 415 523 8886</code>) con el texto que indique la consola para emparejar tu terminal.</li>
                                    <li>Introduce el número de remitente de Twilio en el formulario de arriba, rellena las claves, ¡y guarda los ajustes!</li>
                                </ol>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sender Tester Box (Spans 5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-slate-700/60 flex flex-col h-full space-y-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <span>🧪 Probador en Tiempo Real</span>
                                </h2>
                                <p className="text-xs text-slate-500">Envía un mensaje instantáneo para validar tu conexión con Twilio.</p>
                            </div>

                            <div className="space-y-4 flex-1">
                                {/* Destination phone input */}
                                <div>
                                    <label htmlFor="testPhone" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Número de Destinatario (Con prefijo, Ej: +34600112233)
                                    </label>
                                    <input
                                        type="tel"
                                        id="testPhone"
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                        placeholder="+34600112233"
                                        className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm font-mono"
                                    />
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        Debe ser un número móvil real. Si usas Sandbox de Twilio, el destinatario debe haber enviado previamente el mensaje <code className="font-mono bg-slate-100 dark:bg-slate-900 p-0.5 rounded">join</code> para poder recibirlo.
                                    </p>
                                </div>

                                {/* Custom Message box */}
                                <div>
                                    <label htmlFor="testMessage" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Cuerpo del Mensaje
                                    </label>
                                    <textarea
                                        id="testMessage"
                                        rows={4}
                                        value={testMessage}
                                        onChange={(e) => setTestMessage(e.target.value)}
                                        placeholder="Escribe el mensaje de prueba..."
                                        className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm leading-relaxed"
                                    />
                                </div>

                                {/* Trigger Action button */}
                                <button
                                    type="button"
                                    onClick={handleSendTestWhatsapp}
                                    disabled={isTestingWhatsapp}
                                    className="w-full py-2.5 px-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm"
                                >
                                    {isTestingWhatsapp ? (
                                        <>
                                            <Spinner className="w-4 h-4 text-white animate-spin" />
                                            <span>Enviando WhatsApp...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🚀 Enviar WhatsApp de Prueba</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Testing Status Panel */}
                            <div className="border-t dark:border-slate-700 pt-4 space-y-3">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Estado de Respuesta de la API</h4>

                                {testResult.status === 'idle' && (
                                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-750 rounded-lg p-3.5 text-center">
                                        <p className="text-xs text-slate-500">
                                            Ninguna prueba enviada en esta sesión. Introduce un número de teléfono y haz clic en el botón de arriba.
                                        </p>
                                    </div>
                                )}

                                {testResult.status === 'loading' && (
                                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-750 rounded-lg p-4 flex flex-col items-center justify-center space-y-2">
                                        <Spinner className="w-6 h-6 text-indigo-500" />
                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono animate-pulse">
                                            Estableciendo canal seguro con /api/send-whatsapp...
                                        </p>
                                    </div>
                                )}

                                {testResult.status === 'success' && (
                                    <div className={`border rounded-lg p-4 space-y-2 ${
                                        testResult.simulated 
                                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30' 
                                            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
                                    }`}>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-lg">{testResult.simulated ? '⚠️' : '✅'}</span>
                                            <span className={`text-xs font-extrabold uppercase ${
                                                testResult.simulated ? 'text-amber-800 dark:text-amber-355' : 'text-emerald-800 dark:text-emerald-400'
                                            }`}>
                                                {testResult.simulated ? 'Envío Simulado en Consola' : 'Envío Real Exitoso'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                                            {testResult.message || 'El mensaje ha sido procesado de manera satisfactoria.'}
                                        </p>
                                        {testResult.sid && (
                                            <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded border dark:border-slate-750 font-mono text-[10px] break-all">
                                                <span className="font-bold text-slate-500 dark:text-slate-400">Twilio SID:</span> <span className="text-indigo-600 dark:text-indigo-400">{testResult.sid}</span>
                                            </div>
                                        )}
                                        {testResult.simulated && (
                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-snug">
                                                💡 <strong>¿Por qué simulado?</strong> Las credenciales de Twilio no están cargadas en el servidor o se dejaron vacías. El servidor interceptó el envío e imprimió el mensaje en sus logs para evitar que la aplicación falle. Configura las claves de Twilio para envíos reales.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {testResult.status === 'error' && (
                                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-1.5 text-red-800 dark:text-red-400 font-extrabold uppercase text-xs">
                                            <span>❌ Error de Envío</span>
                                        </div>
                                        <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed font-mono">
                                            {testResult.message}
                                        </p>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                                            🔍 <strong>Consejos de diagnóstico:</strong>
                                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                                                <li>Verifica que tu Account SID y Auth Token sean correctos y estén guardados.</li>
                                                <li>Asegúrate de que el destinatario haya aceptado la invitación en el sandbox de Twilio.</li>
                                                <li>Comprueba que el número remitente tiene la forma correcta.</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2nd Tab: Router Server Configuration */}
            {activeTab === 'connection' && (
                <form onSubmit={handleConnectionSubmit(onConnectionSubmit)} className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg space-y-8 animate-fade-in border border-gray-100 dark:border-slate-700/60">
                    {/* Server Settings */}
                    <div>
                        <h2 className="text-xl font-semibold text-primary dark:text-indigo-400 mb-4 flex items-center">
                            <WifiIcon className="w-5 h-5 mr-2" /> Datos del Servidor
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="serverUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300">URL del Servidor Principal</label>
                                <input
                                    type="text"
                                    id="serverUrl"
                                    placeholder="https://api.aulainfinity.com"
                                    {...registerConnection("serverUrl")}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="serverPort" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Puerto</label>
                                <input
                                    type="number"
                                    id="serverPort"
                                    placeholder="443"
                                    {...registerConnection("serverPort", { valueAsNumber: true })}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Database Settings */}
                    <div>
                        <h2 className="text-xl font-semibold text-primary dark:text-indigo-400 mb-4 flex items-center">
                            <span className="mr-2">📁</span> Conexión con Base de Datos
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="dbHost" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Host de la Base de Datos</label>
                                <input
                                    type="text"
                                    id="dbHost"
                                    placeholder="localhost"
                                    {...registerConnection("dbHost")}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="dbUser" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Usuario</label>
                                <input
                                    type="text"
                                    id="dbUser"
                                    placeholder="admin_user"
                                    {...registerConnection("dbUser")}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="dbPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
                                <input
                                    type="password"
                                    id="dbPassword"
                                    placeholder="••••••••••••"
                                    {...registerConnection("dbPassword")}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="dbName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre de la Base de Datos</label>
                                <input
                                    type="text"
                                    id="dbName"
                                    placeholder="academia_db"
                                    {...registerConnection("dbName")}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end items-center border-t dark:border-slate-700 pt-6">
                        <button
                            type="submit"
                            className="py-2.5 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-150 shadow-md cursor-pointer text-sm"
                        >
                            Guardar Conexiones
                        </button>
                    </div>
                </form>
            )}

            {/* 3rd Tab: UI Component Test Lab */}
            {activeTab === 'visual_lab' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Viewport controls */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between border dark:border-slate-700">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-sans">Simulación de Viewports:</span>
                            <span className="text-xs font-mono text-slate-550 bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded">
                                {simulatedViewport === 'mobile' ? '360px x Máx (Celular)' : simulatedViewport === 'tablet' ? '760px x Máx (Tableta)' : 'Pantalla Completa'}
                            </span>
                        </div>
                        <div className="flex bg-white dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 space-x-1 shadow-sm">
                            <button
                                onClick={() => setSimulatedViewport('mobile')}
                                className={`px-3 py-1 text-xs rounded-md transition-all ${
                                    simulatedViewport === 'mobile' ? 'bg-primary text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                                }`}
                            >
                                Móvil
                            </button>
                            <button
                                onClick={() => setSimulatedViewport('tablet')}
                                className={`px-3 py-1 text-xs rounded-md transition-all ${
                                    simulatedViewport === 'tablet' ? 'bg-primary text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                                }`}
                            >
                                Tableta
                            </button>
                            <button
                                onClick={() => setSimulatedViewport('desktop')}
                                className={`px-3 py-1 text-xs rounded-md transition-all ${
                                    simulatedViewport === 'desktop' ? 'bg-primary text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                                }`}
                            >
                                Escritorio
                            </button>
                        </div>
                    </div>

                    {/* Outer frame to contain viewport simulator */}
                    <div className="flex justify-center w-full bg-slate-50 dark:bg-slate-950/20 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 transition-all">
                        <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg transition-all duration-300 ${viewportWidths[simulatedViewport]}`}>
                            
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-150 mb-4 border-b pb-2 flex items-center justify-between">
                                <span>🧪 Sandbox de Componentes AulaInfinity</span>
                                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-primary dark:text-indigo-300 py-0.5 px-2 rounded-full font-mono font-bold">Activo</span>
                            </h3>

                            {/* Section 1: Alerts and Toasts testing */}
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Auditor de Toasts e Interfaz</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <button
                                        onClick={() => triggerToast('success', '¡Enhorabuena! Has resuelto la ecuación correctamente.')}
                                        className="py-2 px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs shadow-md transition-colors flex items-center justify-center cursor-pointer"
                                    >
                                        Toast Success
                                    </button>
                                    <button
                                        onClick={() => triggerToast('error', 'Error al sincronizar datos del estudiante offline.')}
                                        className="py-2 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-xs shadow-md transition-colors flex items-center justify-center cursor-pointer"
                                    >
                                        Toast Error
                                    </button>
                                    <button
                                        onClick={() => triggerToast('info', 'La inteligencia artificial ha generado tu plan.')}
                                        className="py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-xs shadow-md transition-colors flex items-center justify-center cursor-pointer"
                                    >
                                        Toast Info
                                    </button>
                                    <button
                                        onClick={() => triggerToast('warning', 'Suscripción Premium requerida para esta tutoría.')}
                                        className="py-2 px-3 bg-amber-550 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-md transition-colors flex items-center justify-center cursor-pointer"
                                    >
                                        Toast Warning
                                    </button>
                                </div>
                            </div>

                            {/* Section 2: Loading State systems */}
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Carga y Marcadores Skeletons</h4>
                                    <button
                                        onClick={() => setSkeletonLoading(prev => !prev)}
                                        className="text-xs text-primary dark:text-indigo-400 font-bold hover:underline"
                                    >
                                        Alternar Estado ({skeletonLoading ? 'Cargando' : 'Listo'})
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Skeleton Loader Box */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-750">
                                        {skeletonLoading ? (
                                            <div className="space-y-3 animate-pulse">
                                                <div className="h-4 bg-gray-255 dark:bg-slate-700 rounded w-3/4"></div>
                                                <div className="space-y-2">
                                                    <div className="h-3 bg-gray-255 dark:bg-slate-700 rounded"></div>
                                                    <div className="h-3 bg-gray-255 dark:bg-slate-700 rounded w-5/6"></div>
                                                </div>
                                                <div className="pt-2 flex space-x-2">
                                                    <div className="h-8 bg-gray-255 dark:bg-slate-700 rounded w-20"></div>
                                                    <div className="h-8 bg-gray-255 dark:bg-slate-700 rounded w-28"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Contenido de Simulador Cargado</h5>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                                    Esta es la representación visual real que reemplaza a los Skeletons grises interactivos una vez que los datos del servidor completan su carga.
                                                </p>
                                                <div className="pt-2 flex space-x-2">
                                                    <span className="text-[10px] bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 py-1 px-2.5 rounded font-bold">Completado</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Spinner loading */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-755 flex flex-col items-center justify-center space-y-2">
                                        <Spinner className="w-8 h-8 text-primary" />
                                        <span className="text-xs text-slate-500 font-mono">Componente Spinner</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Badges visual animations */}
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Gamificación (Insignias de Logros)</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {/* Golden Badge achieved */}
                                    <div className="p-4 bg-gradient-to-br from-amber-450 to-yellow-500 rounded-xl text-center shadow-lg border-2 border-amber-300 transform hover:scale-105 transition duration-200 text-white relative group">
                                        <TrophyIcon className="w-8 h-8 mx-auto text-white drop-shadow-md" />
                                        <h5 className="text-xs font-bold mt-2 truncate">Olímpico</h5>
                                        <div className="absolute inset-0 rounded-xl animate-pulse bg-white/10"></div>
                                        <div className="absolute top-1 right-1 bg-white text-[8px] text-yellow-600 rounded-full w-4 h-4 flex items-center justify-center font-bold font-mono">★</div>
                                    </div>
                                    
                                    {/* Lightbulb Badge achieved */}
                                    <div className="p-4 bg-gradient-to-br from-amber-450 to-yellow-500 rounded-xl text-center shadow-lg border-2 border-amber-300 transform hover:scale-105 transition duration-200 text-white relative">
                                        <LightBulbIcon className="w-8 h-8 mx-auto text-white drop-shadow-md" />
                                        <h5 className="text-xs font-bold mt-2 truncate">Creador de Ideas</h5>
                                        <div className="absolute inset-0 rounded-xl animate-pulse bg-white/10" style={{ animationDelay: '0.4s' }}></div>
                                    </div>

                                    {/* Book Badge (unlocked status but light theme check) */}
                                    <div className="p-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-750 rounded-xl text-center transition-all duration-150">
                                        <BookOpenIcon className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-550" />
                                        <h5 className="text-xs font-bold mt-2 truncate text-slate-700 dark:text-slate-300">Lector</h5>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Modal checking options */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Dialogos Coherentes (Confirmation Modals)</h4>
                                <div className="flex space-x-3">
                                    <Button size="sm" onClick={() => handleOpenTestModal('standard')}>
                                        Modal Estándar
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => handleOpenTestModal('destructive')}>
                                        Modal Destructivo
                                    </Button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Simulated overlay modal tester */}
            <ConfirmationModal
                isOpen={isTestModalOpen}
                onClose={() => setIsTestModalOpen(false)}
                onConfirm={() => {
                    setIsTestModalOpen(false);
                    triggerToast('success', modalType === 'destructive' ? 'Elemento eliminado con éxito.' : 'Acción confirmada con éxito.');
                }}
                title={modalType === 'destructive' ? '¿Deseas eliminar este registro de prueba?' : 'Confirmar Guardado de Cambios'}
                description={
                    modalType === 'destructive' 
                        ? 'Esta acción es irreversible y removerá el usuario simulado permanentemente de la memoria.' 
                        : 'Al confirmar, el sistema de pruebas simuladas actualizará los datos del laboratorio.'
                }
                confirmText={modalType === 'destructive' ? 'Sí, eliminar' : 'Sí, continuar'}
                isDestructive={modalType === 'destructive'}
            />
        </div>
    );
};
