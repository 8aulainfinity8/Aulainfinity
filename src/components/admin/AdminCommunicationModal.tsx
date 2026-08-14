import React, { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle, Sparkles, Users, UserCheck, Phone, ExternalLink, Copy, HelpCircle, X, FlaskConical, ShieldAlert, Check } from 'lucide-react';
import type { StudentUser, TeacherUser } from '../../types';
import * as api from '../../services/api';
import { NotificationContext } from '../../contexts/NotificationContext';
import { AppConfigContext } from '../../contexts/AppConfigContext';

interface AdminCommunicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: StudentUser[];
    teachers: TeacherUser[];
    initialRecipient?: {
        type: 'specific';
        userId: string;
        userType: 'student' | 'teacher';
    } | null;
    initialTab?: 'message' | 'test_whatsapp';
}

export const AdminCommunicationModal: React.FC<AdminCommunicationModalProps> = ({
    isOpen,
    onClose,
    students,
    teachers,
    initialRecipient,
    initialTab = 'message'
}) => {
    const { addToast } = useContext(NotificationContext);
    const { appConfig } = useContext(AppConfigContext);

    const [activeTab, setActiveTab] = useState<'message' | 'test_whatsapp'>(initialTab);
    
    // Tab 1 state: Direct Messaging
    const [recipientGroup, setRecipientGroup] = useState<'all_students' | 'all_teachers' | 'premium_students' | 'free_students' | 'specific'>('all_students');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
    const [subject, setSubject] = useState<string>('Aviso importante de AulaInfinity');
    const [body, setBody] = useState<string>('¡Hola! Te recordamos que tienes disponibles tus clases y recursos en AulaInfinity. Entra hoy a tu panel para seguir avanzando y aprovechando tus horas de tutoría. 🚀');
    const [isSendingBulk, setIsSendingBulk] = useState<boolean>(false);
    const [bulkResults, setBulkResults] = useState<{ sent: number; failed: number; details: string[] } | null>(null);

    // Tab 2 state: WhatsApp Test Sandbox
    const [testPhone, setTestPhone] = useState<string>('');
    const [testMessage, setTestMessage] = useState<string>('¡Hola! 🚀 Este es un mensaje de prueba desde el sistema de Gestión de Alumnos de AulaInfinity para confirmar que las notificaciones de WhatsApp están funcionando correctamente.');
    const [isTestingWhatsapp, setIsTestingWhatsapp] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<{
        status: 'idle' | 'loading' | 'success' | 'error';
        message?: string;
        simulated?: boolean;
        sid?: string;
    }>({ status: 'idle' });

    // Sync initial state when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab || 'message');
            setBulkResults(null);
            setTestResult({ status: 'idle' });
            
            if (initialRecipient && initialRecipient.userId) {
                setRecipientGroup('specific');
                setSelectedUserId(initialRecipient.userId);
            } else if (!selectedUserId && students.length > 0) {
                setSelectedUserId(students[0].id);
            }

            if (!testPhone && appConfig?.twilioWhatsappFrom) {
                setTestPhone(appConfig.twilioWhatsappFrom);
            }
        }
    }, [isOpen, initialRecipient, initialTab, students, appConfig]);

    if (!isOpen) return null;

    // Helper to get selected contacts
    const getSelectedContacts = () => {
        if (recipientGroup === 'all_students') {
            return students.map(s => ({ id: s.id, name: s.name, email: s.email, phone: s.phone, type: 'Estudiante', isSubscribed: s.isSubscribed }));
        }
        if (recipientGroup === 'all_teachers') {
            return teachers.map(t => ({ id: t.id, name: t.name, email: t.email, phone: t.phone, type: 'Profesor', isSubscribed: false }));
        }
        if (recipientGroup === 'premium_students') {
            return students.filter(s => s.isSubscribed).map(s => ({ id: s.id, name: s.name, email: s.email, phone: s.phone, type: 'Estudiante Premium', isSubscribed: true }));
        }
        if (recipientGroup === 'free_students') {
            return students.filter(s => !s.isSubscribed).map(s => ({ id: s.id, name: s.name, email: s.email, phone: s.phone, type: 'Estudiante Gratis', isSubscribed: false }));
        }
        if (recipientGroup === 'specific') {
            const st = students.find(s => s.id === selectedUserId);
            if (st) return [{ id: st.id, name: st.name, email: st.email, phone: st.phone, type: 'Estudiante', isSubscribed: st.isSubscribed }];
            const tc = teachers.find(t => t.id === selectedUserId);
            if (tc) return [{ id: tc.id, name: tc.name, email: tc.email, phone: tc.phone, type: 'Profesor', isSubscribed: false }];
        }
        return [];
    };

    const contacts = getSelectedContacts();
    const validEmails = contacts.map(c => c.email).filter(Boolean) as string[];
    const validPhones = contacts.filter(c => Boolean(c.phone));
    const activeWhatsappMode = appConfig?.whatsappMode || 'direct';

    // Apply quick template
    const handleApplyTemplate = (tpl: { subject: string; body: string }) => {
        setSubject(tpl.subject);
        setBody(tpl.body);
        addToast('Plantilla aplicada con éxito.', 'info');
    };

    // Tab 1 Action: Send Email
    const handleSendEmail = (mode: 'mailto' | 'simulate') => {
        if (validEmails.length === 0) {
            addToast('⚠️ No hay correos electrónicos válidos en la selección actual.', 'error');
            return;
        }

        if (mode === 'mailto') {
            const firstEmail = validEmails[0];
            const bccEmails = validEmails.slice(1);
            let url = `mailto:${encodeURIComponent(firstEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            if (bccEmails.length > 0) {
                url += `&bcc=${encodeURIComponent(bccEmails.join(','))}`;
            }
            window.open(url, '_blank');
            addToast(`📧 Abriendo cliente de correo para ${validEmails.length} destinatario(s)...`, 'success');
        } else {
            addToast(`✅ Notificación interna registrada y enviada a ${validEmails.length} destinatario(s).`, 'success');
        }
    };

    // Tab 1 Action: Send WhatsApp Direct or Automated
    const handleSendWhatsapp = async (mode: 'web' | 'automated', contact?: { name: string; phone?: string }) => {
        if (mode === 'web') {
            const targetPhone = contact?.phone || (validPhones.length > 0 ? validPhones[0].phone : '');
            const targetName = contact?.name || (validPhones.length > 0 ? validPhones[0].name : 'Usuario');
            if (!targetPhone) {
                addToast('⚠️ El usuario seleccionado no tiene un número de teléfono registrado.', 'error');
                return;
            }
            const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(targetPhone)}&text=${encodeURIComponent(body)}`;
            window.open(url, '_blank');
            addToast(`💬 Abriendo WhatsApp Web para enviar mensaje a ${targetName}.`, 'info');
            return;
        }

        // Automated batch sending
        if (validPhones.length === 0) {
            addToast('⚠️ No se encontraron números de teléfono válidos en el grupo seleccionado.', 'error');
            return;
        }

        setIsSendingBulk(true);
        setBulkResults(null);
        let sent = 0;
        let failed = 0;
        const details: string[] = [];

        try {
            for (const c of validPhones) {
                const res = await api.sendWhatsApp({
                    to: c.phone || '',
                    message: body,
                    whatsappMode: activeWhatsappMode,
                    twilioAccountSid: appConfig?.twilioAccountSid,
                    twilioAuthToken: appConfig?.twilioAuthToken,
                    twilioWhatsappFrom: appConfig?.twilioWhatsappFrom,
                    metaPhoneNumberId: appConfig?.metaPhoneNumberId,
                    metaAccessToken: appConfig?.metaAccessToken,
                    evolutionInstanceUrl: appConfig?.evolutionInstanceUrl,
                    evolutionApiKey: appConfig?.evolutionApiKey
                });

                if (res.success) {
                    sent++;
                    details.push(`✅ ${c.name} (${c.phone}): ${res.message || 'Enviado'}`);
                } else {
                    failed++;
                    details.push(`❌ ${c.name} (${c.phone}): ${res.error || 'Falló'}`);
                }
            }
            setBulkResults({ sent, failed, details });
            if (failed === 0) {
                addToast(`🟩 Envío masivo por WhatsApp completado (${sent} exitosos).`, 'success');
            } else {
                addToast(`⚠️ Envío completado con ${failed} errores (${sent} exitosos).`, 'error');
            }
        } catch (e: any) {
            addToast(`Error en el envío automatizado: ${e.message}`, 'error');
        } finally {
            setIsSendingBulk(false);
        }
    };

    // Tab 2 Action: Send Test WhatsApp
    const handleSendTestWhatsapp = async () => {
        if (!testPhone.trim()) {
            addToast('Por favor introduce un número de teléfono de prueba.', 'error');
            return;
        }

        setIsTestingWhatsapp(true);
        setTestResult({ status: 'loading' });

        try {
            if (activeWhatsappMode === 'direct') {
                const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(testPhone.trim())}&text=${encodeURIComponent(testMessage)}`;
                window.open(url, '_blank');
                setTestResult({
                    status: 'success',
                    message: 'Se ha abierto una pestaña nueva con WhatsApp Web/Desktop hacia el número especificado con el mensaje preconfigurado.',
                    simulated: false
                });
                addToast('💬 Abriendo WhatsApp Web para prueba...', 'info');
                return;
            }

            const res = await api.sendWhatsApp({
                to: testPhone.trim(),
                message: testMessage,
                whatsappMode: activeWhatsappMode,
                twilioAccountSid: appConfig?.twilioAccountSid,
                twilioAuthToken: appConfig?.twilioAuthToken,
                twilioWhatsappFrom: appConfig?.twilioWhatsappFrom,
                metaPhoneNumberId: appConfig?.metaPhoneNumberId,
                metaAccessToken: appConfig?.metaAccessToken,
                evolutionInstanceUrl: appConfig?.evolutionInstanceUrl,
                evolutionApiKey: appConfig?.evolutionApiKey
            });

            if (res.success) {
                setTestResult({
                    status: 'success',
                    message: res.message || 'Mensaje de prueba enviado y verificado correctamente en el canal activo.',
                    simulated: res.simulated,
                    sid: res.sid
                });
                addToast('¡Prueba de WhatsApp exitosa!', 'success');
            } else {
                setTestResult({
                    status: 'error',
                    message: res.error || res.message || 'Fallo en la verificación del mensaje con el proveedor activo.'
                });
                addToast('Fallo en la prueba de WhatsApp.', 'error');
            }
        } catch (err: any) {
            setTestResult({
                status: 'error',
                message: err.message || 'Error de red o excepción interna al ejecutar la prueba.'
            });
            addToast('Error al probar la integración de WhatsApp.', 'error');
        } finally {
            setIsTestingWhatsapp(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 md:p-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">Centro de Comunicaciones de AulaInfinity</h2>
                            <p className="text-xs text-indigo-100 mt-0.5">Envío de correos, notificaciones por WhatsApp y herramientas de verificación en vivo</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-indigo-100 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                        title="Cerrar modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab('message')}
                        className={`py-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'message'
                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-850'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        }`}
                    >
                        <Mail className="w-4 h-4" />
                        <span>📬 Enviar a Alumnos / Profesores</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('test_whatsapp')}
                        className={`py-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                            activeTab === 'test_whatsapp'
                                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-white dark:bg-slate-850'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        }`}
                    >
                        <FlaskConical className="w-4 h-4 text-emerald-500" />
                        <span>🧪 WhatsApp de Prueba (Verificar)</span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-black">TEST</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 dark:text-slate-100">
                    
                    {/* TAB 1: DIRECT MESSAGING */}
                    {activeTab === 'message' && (
                        <div className="space-y-6 animate-fade-in">
                            
                            {/* Step 1: Select Recipients & Channel */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-750">
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">1. Seleccionar Destinatarios</label>
                                    <select
                                        value={recipientGroup}
                                        onChange={(e) => setRecipientGroup(e.target.value as any)}
                                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                                    >
                                        <option value="all_students">🎓 Todos los Alumnos ({students.length})</option>
                                        <option value="all_teachers">👨‍🏫 Todos los Profesores ({teachers.length})</option>
                                        <option value="premium_students">🌟 Alumnos Premium ({students.filter(s => s.isSubscribed).length})</option>
                                        <option value="free_students">🆓 Alumnos Gratis ({students.filter(s => !s.isSubscribed).length})</option>
                                        <option value="specific">👤 Usuario Específico (Seleccionar individual)</option>
                                    </select>

                                    {recipientGroup === 'specific' && (
                                        <div className="mt-3">
                                            <select
                                                value={selectedUserId}
                                                onChange={(e) => setSelectedUserId(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                                            >
                                                <optgroup label="Alumnos">
                                                    {students.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name} - {s.email} {s.phone ? `(${s.phone})` : ''}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Profesores">
                                                    {teachers.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name} (Profesor) - {t.email} {t.phone ? `(${t.phone})` : ''}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </div>
                                    )}

                                    <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
                                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Seleccionados: <strong className="text-slate-800 dark:text-slate-200">{contacts.length} persona(s)</strong></span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">2. Canal de Envío</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setChannel('email')}
                                            className={`p-3 rounded-xl border text-left font-bold transition cursor-pointer flex items-center gap-2.5 ${
                                                channel === 'email'
                                                    ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-500'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                                            }`}
                                        >
                                            <Mail className="w-5 h-5 text-indigo-500 shrink-0" />
                                            <div>
                                                <div className="text-sm leading-tight">Correo Electrónico</div>
                                                <div className="text-[10px] font-normal opacity-80 mt-0.5">{validEmails.length} válidos</div>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setChannel('whatsapp')}
                                            className={`p-3 rounded-xl border text-left font-bold transition cursor-pointer flex items-center gap-2.5 ${
                                                channel === 'whatsapp'
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                                            }`}
                                        >
                                            <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                                            <div>
                                                <div className="text-sm leading-tight">WhatsApp</div>
                                                <div className="text-[10px] font-normal opacity-80 mt-0.5">{validPhones.length} con teléfono</div>
                                            </div>
                                        </button>
                                    </div>

                                    {channel === 'whatsapp' && (
                                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] bg-emerald-50/80 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-medium">
                                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            <span>Modo configurado en Ajustes: <strong className="uppercase font-extrabold">{activeWhatsappMode}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Quick Templates */}
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">💡 Plantillas Rápidas Predefinidas</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleApplyTemplate({
                                            subject: 'Recordatorio de tutorías y avance en AulaInfinity',
                                            body: '¡Hola! Te recordamos que tienes disponibles tus clases y recursos en AulaInfinity. Entra hoy a tu panel para seguir avanzando y aprovechando tus horas de tutoría. 🚀'
                                        })}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700"
                                    >
                                        📚 Recordatorio Clases
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleApplyTemplate({
                                            subject: '¡Sigue brillando en tu aprendizaje en AulaInfinity!',
                                            body: '¡Hola! Hemos notado tu gran esfuerzo y queremos motivarte a continuar. No dejes pasar el día sin repasar una lección o resolver un reto en AulaInfinity. 💡'
                                        })}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700"
                                    >
                                        🚀 Motivación Estudio
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleApplyTemplate({
                                            subject: 'Novedades y actualizaciones en la plataforma AulaInfinity',
                                            body: '¡Hola! Te informamos que estamos incorporando nuevas mejoras y contenidos en AulaInfinity para ofrecerte la mejor experiencia educativa. ¡Échale un vistazo a las novedades! 🌟'
                                        })}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700"
                                    >
                                        🛠️ Novedades Plataforma
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleApplyTemplate({
                                            subject: '¡Gracias por ser parte de la comunidad Premium de AulaInfinity!',
                                            body: '¡Hola! Queremos agradecerte tu confianza en AulaInfinity Premium. Recuerda que tienes acceso ilimitado a inteligencia artificial, resoluciones paso a paso y prioridad en tutorías. ¡Aprovéchalo al máximo! 🎓'
                                        })}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700"
                                    >
                                        🌟 Saludo Premium
                                    </button>
                                </div>
                            </div>

                            {/* Step 3: Message Editor */}
                            <div className="space-y-4">
                                {channel === 'email' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Asunto del Correo</label>
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Escribe el asunto..."
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        {channel === 'email' ? 'Cuerpo del Correo' : 'Mensaje de WhatsApp'}
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="Escribe el mensaje que quieres enviar..."
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-normal focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 leading-relaxed"
                                    />
                                </div>
                            </div>

                            {/* Channel Specific Help / Contacts preview */}
                            {channel === 'email' ? (
                                <div className="bg-indigo-50/60 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2.5">
                                    <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Seguridad y Privacidad de Correo (BCC)</p>
                                        <p className="opacity-90 mt-0.5">
                                            Al hacer clic en "Abrir en Cliente de Correo", se abrirá tu aplicación de correo por defecto (Gmail, Outlook, Apple Mail). Si hay varios destinatarios ({validEmails.length}), se añadirán automáticamente en copia oculta (BCC) para proteger la privacidad de los usuarios.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                                        <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold">Comportamiento de Envío de WhatsApp ({activeWhatsappMode === 'direct' ? 'Modo Directo Web' : 'Modo Automatizado API'})</p>
                                            <p className="opacity-90 mt-0.5">
                                                {activeWhatsappMode === 'direct' 
                                                    ? 'En Modo Directo Web, puedes abrir chats individuales de WhatsApp Web o enviar en lote utilizando nuestra simulación integrada. Para envíos 100% automáticos en segundo plano, cambia a Meta, Evolution API o Firebase Queue en Ajustes.'
                                                    : `El envío en lote utilizará el proveedor configurado (${activeWhatsappMode}) para enviar el mensaje automáticamente a cada contacto sin abrir pestañas individuales.`}
                                            </p>
                                        </div>
                                    </div>

                                    {validPhones.length > 0 && validPhones.length <= 5 && (
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                                            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Destinatarios con teléfono listo ({validPhones.length}):</span>
                                            <div className="flex flex-wrap gap-2">
                                                {validPhones.map(vp => (
                                                    <span key={vp.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                                                        <span>{vp.name} ({vp.phone})</span>
                                                        {activeWhatsappMode === 'direct' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSendWhatsapp('web', vp)}
                                                                className="text-emerald-600 hover:text-emerald-700 font-black text-[10px] bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded cursor-pointer"
                                                            >
                                                                Abrir Web 💬
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Bulk Results feedback */}
                            {bulkResults && (
                                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 space-y-2 max-h-40 overflow-y-auto text-xs font-mono">
                                    <div className="font-bold flex items-center justify-between text-slate-800 dark:text-slate-200 border-b pb-2">
                                        <span>📊 Resultado de Envío Masivo: {bulkResults.sent} Exitosos | {bulkResults.failed} Fallidos</span>
                                        <button onClick={() => setBulkResults(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                                    </div>
                                    {bulkResults.details.map((det, i) => (
                                        <div key={i} className={det.startsWith('✅') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                            {det}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons for Tab 1 */}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition cursor-pointer"
                                >
                                    Cancelar
                                </button>

                                {channel === 'email' ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleSendEmail('simulate')}
                                            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition cursor-pointer flex items-center gap-2 shadow-xs"
                                        >
                                            <Check className="w-4 h-4 text-emerald-500" />
                                            <span>Simular / Registrar Aviso In-App</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleSendEmail('mailto')}
                                            disabled={validEmails.length === 0}
                                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-black rounded-xl text-sm transition cursor-pointer flex items-center gap-2 shadow-md"
                                        >
                                            <Mail className="w-4 h-4" />
                                            <span>Abrir en Cliente de Correo (`mailto:`) ({validEmails.length})</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {activeWhatsappMode === 'direct' && (
                                            <button
                                                type="button"
                                                onClick={() => handleSendWhatsapp('web')}
                                                disabled={validPhones.length === 0}
                                                className="px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-extrabold rounded-xl text-sm transition cursor-pointer flex items-center gap-2 shadow-xs"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                <span>Abrir WhatsApp Web (`wa.me`)</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => handleSendWhatsapp('automated')}
                                            disabled={validPhones.length === 0 || isSendingBulk}
                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-xl text-sm transition cursor-pointer flex items-center gap-2 shadow-md"
                                        >
                                            {isSendingBulk ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                    <span>Enviando por Lote...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    <span>Enviar Automático por Lote ({validPhones.length})</span>
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>

                        </div>
                    )}

                    {/* TAB 2: WHATSAPP TEST SANDBOX */}
                    {activeTab === 'test_whatsapp' && (
                        <div className="space-y-6 animate-fade-in">
                            
                            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-indigo-500/10 p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-3">
                                <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                                    <FlaskConical className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>Herramienta de Verificación en Vivo de WhatsApp</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Esta utilidad te permite enviar un mensaje de prueba al número de teléfono que desees (por ejemplo, tu propio móvil personal o número de admin) para comprobar al instante que la integración de notificaciones por WhatsApp de AulaInfinity funciona perfectamente y sin errores.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Left column: Test Inputs */}
                                <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                                            Teléfono de Destino de Prueba
                                        </label>
                                        <input
                                            type="text"
                                            value={testPhone}
                                            onChange={(e) => setTestPhone(e.target.value)}
                                            placeholder="ej. +34 600 000 000"
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 font-mono"
                                        />
                                        <span className="text-[11px] text-slate-400 mt-1 block">
                                            Asegúrate de incluir el prefijo internacional (ej. +34 para España, +52 para México).
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                                            Mensaje de Prueba
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={testMessage}
                                            onChange={(e) => setTestMessage(e.target.value)}
                                            placeholder="Escribe tu mensaje de prueba..."
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 leading-relaxed"
                                        />
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                        <div className="text-xs">
                                            <span className="text-slate-400 font-bold uppercase text-[10px] block">Modo Activo</span>
                                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase text-sm">{activeWhatsappMode}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleSendTestWhatsapp}
                                            disabled={isTestingWhatsapp || !testPhone.trim()}
                                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-xl text-sm transition cursor-pointer flex items-center gap-2 shadow-md shrink-0"
                                        >
                                            {isTestingWhatsapp ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                    <span>Probando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    <span>🚀 Probar Ahora</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Right column: Live Status & Feedback */}
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
                                            <span>📊 Resultado de la Prueba en Tiempo Real</span>
                                        </h4>

                                        {testResult.status === 'idle' && (
                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center text-slate-400 my-4 space-y-2">
                                                <FlaskConical className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                                                <p className="text-xs font-medium">
                                                    Introduce un número de teléfono y haz clic en <strong>"🚀 Probar Ahora"</strong> para verificar la conexión.
                                                </p>
                                            </div>
                                        )}

                                        {testResult.status === 'loading' && (
                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center space-y-3 my-4">
                                                <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono animate-pulse font-bold">
                                                    Estableciendo conexión y enviando mensaje...
                                                </p>
                                            </div>
                                        )}

                                        {testResult.status === 'success' && (
                                            <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3 animate-fade-in">
                                                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                                    <span>¡Prueba Completada con Éxito!</span>
                                                </div>
                                                <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                                                    {testResult.message}
                                                </p>
                                                {testResult.simulated && (
                                                    <div className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 p-2 rounded-lg text-[11px] font-semibold border border-amber-300/60 dark:border-amber-800">
                                                        💡 Nota: El envío se ha realizado en modo simulado/sandbox local. Si deseas conectar con una API oficial en vivo (Meta, Twilio o Evolution), configúrala en Ajustes de Conexión.
                                                    </div>
                                                )}
                                                {testResult.sid && (
                                                    <div className="text-[10px] font-mono text-slate-500 bg-white/70 dark:bg-slate-900/60 p-2 rounded border break-all">
                                                        ID de Referencia / SID: <strong>{testResult.sid}</strong>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {testResult.status === 'error' && (
                                            <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4 space-y-3 animate-fade-in">
                                                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-black text-sm">
                                                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                                    <span>Error en la Verificación</span>
                                                </div>
                                                <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                                                    {testResult.message}
                                                </p>
                                                <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded border">
                                                    💡 <strong>Recomendación:</strong> Si usas WhatsApp Web directo, verifica los permisos emergentes de tu navegador. Si usas API, revisa tus claves en Conexión.
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center justify-between">
                                        <span>Canal de verificación activo</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">Estado: Listo 🟢</span>
                                    </div>
                                </div>

                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl text-sm transition cursor-pointer"
                                >
                                    Cerrar Ventana de Prueba
                                </button>
                            </div>

                        </div>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
};
