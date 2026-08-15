import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
// FIX: Corrected react-router-dom import for router hooks.
import { useLocation, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { AuthContext } from '../contexts/AuthContext';
import { AppConfigContext } from '../contexts/AppConfigContext';
// FIX: Corrected import paths.
import * as api from '../services/api';
import { auth } from '../services/firebase';
import type { ChatMessage, StudentUser, CourseLevel } from '../types';
import {
    ChevronLeftIcon,
    PaperclipIcon,
    SparklesIcon,
    CloseIcon,
    PaperAirplaneIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon
} from './icons';
import { SubscriptionGate } from './SubscriptionGate';
import { ROUTES } from '../constants/routes';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../hooks/useI18n';

// Helper to render markdown content safely with premium mathematical equations styling support
const MarkdownContent: React.FC<{ content: string }> = React.memo(({ content }) => {
    const navigate = useNavigate();
    
    // Smoothly pre-process standard LaTeX equations formatting (both block and inline)
    // to render them as gorgeous typography boxes, bypassing markdown parser limitations.
    const processedContent = useMemo(() => {
        let text = content;
        
        // Block math formulas ($...$$)
        text = text.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, equation) => {
            return `<div class="math-block my-4 p-4 border-l-4 border-indigo-600 dark:border-indigo-500 bg-slate-100/80 dark:bg-slate-900/40 rounded-r-xl font-serif italic text-center text-base sm:text-lg tracking-wide shadow-sm select-all text-slate-800 dark:text-slate-100 leading-relaxed font-semibold">${equation}</div>`;
        });
        
        // Inline math formulas ($...$) (avoiding noise like email addresses or double-dollar)
        text = text.replace(/(?<!\$)\$\s*([^$\n]+?)\s*\$(?!\$)/g, (_, inlineEquation) => {
            return `<span class="math-inline font-serif italic font-semibold text-sm bg-slate-100/90 dark:bg-slate-900/50 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 select-all mx-0.5">${inlineEquation}</span>`;
        });
        
        return text;
    }, [content]);

    const html = useMemo(() => {
        return marked.parse(processedContent, { gfm: true, breaks: true }) as any;
    }, [processedContent]);
    
    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest('a');
        if (anchor) {
            const href = anchor.getAttribute('href');
            if (href && href.startsWith('/app/')) {
                e.preventDefault();
                navigate(href);
            }
        }
    };

    return (
        <div 
            className="prose dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 font-sans text-sm leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: html }} 
            onClick={handleContainerClick}
        />
    );
});

const vibes = [
    { id: 'socratic', name: 'Socrático', emoji: '🧠', desc: 'Te guía paso a paso con preguntas' },
    { id: 'explanatory', name: 'Explicativo', emoji: '💡', desc: 'Usa ejemplos prácticos y analogías cotidianas' },
    { id: 'ebau', name: 'Modo EBAU', emoji: '🎯', desc: 'Máximo rigor y criterios reales de examen' }
];

const vibePrompts: Record<'socratic' | 'explanatory' | 'ebau', { text: string; icon: string }[]> = {
    socratic: [
        { text: "Guíame socráticamente paso a paso para resolver una derivada o límite de función.", icon: "📈" },
        { text: "¿Por qué la derivada de x² es 2x? Ayúdame a deducirlo haciéndome preguntas.", icon: "🧭" },
        { text: "¿Cómo puedo balancear una ecuación química de óxido-reducción? Ayúdame a razonarlo.", icon: "🧪" }
    ],
    explanatory: [
        { text: "Explícame qué son los enlaces químicos utilizando una analogía cotidiana y divertida.", icon: "💡" },
        { text: "Dame una metáfora práctica de la vida diaria para comprender vectores moleculares.", icon: "🍎" },
        { text: "Explícame la ley de conservación de la masa como si tuviera 10 años.", icon: "🌍" }
    ],
    ebau: [
        { text: "¿Cuáles son los errores más típicos cometidos en la EBAU al derivar funciones?", icon: "🎯" },
        { text: "Dame criterios formales reales del examen de selectividad sobre estequiometría.", icon: "📑" },
        { text: "Repasemos los teoremas más preguntados de Química y Física en la EBAU.", icon: "📐" }
    ]
};

// High fidelity dynamic Thinking Indicator showing active intelligence tasks
const ThinkingIndicator: React.FC<{ vibe: 'socratic' | 'explanatory' | 'ebau' }> = ({ vibe }) => {
    const [stepIndex, setStepIndex] = useState(0);
    
    const steps = useMemo(() => {
        if (vibe === 'socratic') {
            return [
                "Analizando tu planteamiento...",
                "Buscando el siguiente paso lógico...",
                "Formulando pregunta interactiva..."
            ];
        } else if (vibe === 'explanatory') {
            return [
                "Analizando conceptos difíciles...",
                "Buscando analogía cotidiana relacionada...",
                "Estructurando explicación incremental..."
            ];
        } else {
            return [
                "Consultando criterios oficiales EBAU...",
                "Revisando errores comunes de selectividad...",
                "Consolidando rigor académico máximo..."
            ];
        }
    }, [vibe]);

    useEffect(() => {
        const interval = setInterval(() => {
            setStepIndex(prev => (prev + 1) % steps.length);
        }, 1500);
        return () => clearInterval(interval);
    }, [steps]);

    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-750/50 rounded-xl border border-slate-200/50 dark:border-slate-700/60 max-w-xs animate-pulse select-none">
            <div className="relative flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Tutor Pensando</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold transition-all duration-300 truncate max-w-[180px]">
                    {steps[stepIndex]}
                </span>
            </div>
        </div>
    );
};

export const TutorIAPage: React.FC = () => {
    const { t } = useI18n();
    const { user } = useContext(AuthContext);
    const { appConfig } = useContext(AppConfigContext);
    const location = useLocation();
    const navigate = useNavigate();

    const isAiAllowed = user?.role === 'admin' || ((appConfig?.aiEnabled !== false) && ((user as any)?.aiEnabled !== false));

    const { data: courses } = useQuery<CourseLevel[]>({ queryKey: ['courses'], queryFn: api.fetchCourses });

    const enrolledCourse = useMemo(() => {
        if (!user || user.role !== 'student' || !courses) return null;
        // FIX: Corrected property from 'enrolledCourseId' to 'enrolledCourseIds' and safely access the first course for context.
        const student = user as StudentUser;
        if (!student.enrolledCourseIds || student.enrolledCourseIds.length === 0) return null;
        return courses.find(c => c.id === student.enrolledCourseIds[0]);
    }, [user, courses]);

    const initialMessage = useMemo(() => {
        if (enrolledCourse) {
            return `¡Hola! Soy tu Tutor IA. Estoy aquí para ayudarte con tus asignaturas de ${enrolledCourse.name}: ${enrolledCourse.subjects.map(s => s.name).join(', ')}. ¿En qué puedo ayudarte hoy?`;
        }
        return '¡Hola! Soy tu Tutor IA. ¿En qué puedo ayudarte hoy con Matemáticas, Física o Química? Si tienes una foto de un ejercicio, ¡también puedes adjuntarla!';
    }, [enrolledCourse]);

    const [selectedVibe, setSelectedVibe] = useState<'socratic' | 'explanatory' | 'ebau'>('socratic');
    const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'model', text: initialMessage }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [image, setImage] = useState<{ file: File, preview: string, base64: string } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const streamController = useRef<{ abort: boolean }>({ abort: false });
    const initialTopicHandled = useRef(false);

    // Get topic from navigation state if available
    const initialTopic = location.state?.topic;

    if (!isAiAllowed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white dark:bg-slate-800 rounded-xl shadow-lg border dark:border-slate-700 max-w-xl mx-auto my-8 animate-fade-in">
                <div className="p-4 bg-amber-50 dark:bg-amber-955/20 rounded-full text-amber-500 dark:text-amber-400 mb-4">
                    <SparklesIcon className="w-12 h-12 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 italic mb-2">Tutor IA Desactivado</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
                    El acceso a las funciones del Tutor de Inteligencia Artificial ha sido desactivado temporalmente para tu cuenta o a nivel global por los administradores.
                </p>
                <button
                    onClick={() => navigate(ROUTES.DASHBOARD)}
                    className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition cursor-pointer"
                >
                    Volver al Panel
                </button>
            </div>
        );
    }
    const initialVideoTitle = location.state?.videoTitle;

    useEffect(() => {
        // Scroll to the bottom of the chat on new messages
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = useCallback(async (e: React.FormEvent | null, initialMessageText?: string, forcedVibe?: 'socratic' | 'explanatory' | 'ebau') => {
        e?.preventDefault();
        const currentInput = initialMessageText || input;
        if (!currentInput.trim() && !image) return;

        setIsLoading(true);
        streamController.current.abort = false;

        const userMessage: ChatMessage = { role: 'user', text: currentInput, image: image?.preview };
        const imagePayload = image ? { mimeType: image.file.type, data: image.base64 } : undefined;
        
        // Add course context & selected vibe style context to the history for the API call
        const activeVibe = forcedVibe || selectedVibe;
        const courseContext = enrolledCourse ? `El estudiante está en el curso '${enrolledCourse.name}' y sus asignaturas son ${enrolledCourse.subjects.map(s => s.name).join(', ')}. Adapta tus respuestas a este nivel de educación.` : '';
        
        let vibeInstructions = '';
        if (activeVibe === 'socratic') {
            vibeInstructions = "Actúa estrictamente como un Tutor Socrático. No des la respuesta directa al estudiante. En su lugar, guíale pacientemente formulando preguntas cortas de forma incremental para que él mismo descubra y deduzca la solución paso a paso.";
        } else if (activeVibe === 'explanatory') {
            vibeInstructions = "Actúa estrictamente como un Tutor Explicativo. Enfócate primordialmente en analogías prácticas de la vida diaria, metáforas cotidianas y explicaciones sencillas y visuales para aclarar conceptos complejos.";
        } else if (activeVibe === 'ebau') {
            vibeInstructions = "Actúa estrictamente como un Tutor Experto en Preparación EBAU (Selectividad) en España. Prioriza el máximo rigor en el enunciado de teoremas, las fórmulas científicas/matemáticas precisas, los criterios formales reales de examen de selectividad y advierte sobre fallos comunes cometidos por estudiantes que anulan puntos.";
        }

        const videoLinksInstructions = "Si el alumno pregunta sobre derivar, derivadas, o límites de funciones, puedes opcionalmente invitarle a ver de forma interactiva el vídeo: [Derivadas: Reglas y Aplicaciones](/app/video/bach_c_m_2) o [Estudio de Funciones: Monotonía y Curvatura](/app/video/bach_c2_m_v8) de la plataforma. Si pregunta sobre química, enlaces, enlaces químicos o estructura atómica, invítale a repasar el vídeo: [Enlaces Químicos](/app/video/eso_4_fyq_v7) o [Estructura Atómica y Enlaces](/app/video/eso_3_fyq_b2_v3). Usa exactamente este formato Markdown relativo de enlace para que se renderice como un link interno dinámico.";

        const combinedContext = [courseContext, vibeInstructions, videoLinksInstructions].filter(Boolean).join('. ');

        // FIX: Explicitly type the historyForApi array to ensure type compatibility with the ChatMessage type.
        const historyForApi: ChatMessage[] = [
            { role: 'user', text: combinedContext }, 
            { role: 'model', text: 'Entendido. Adaptaré mi tono por completo y recomendaré los vídeos si el alumno menciona estos temas.' },
            ...messages, 
            userMessage
        ];
        
        setMessages(prev => [...prev, userMessage, { role: 'model', text: '' }]);

        if (!initialMessageText) {
            setInput('');
            setImage(null);
            if(fileInputRef.current) fileInputRef.current.value = '';
            if(textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }

        try {
            let accumulatedText = '';
            
            // 1. Tutor IA Cost Control & Rate Limiting Backend Call
            const idToken = auth?.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (idToken) {
                headers['Authorization'] = `Bearer ${idToken}`;
            }

            const res = await fetch('/api/tutor-ia/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId: user?.id || auth?.currentUser?.uid || 'guest',
                    message: currentInput,
                    history: historyForApi,
                    subject: activeVibe || 'General'
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Error del servidor (${res.status})`);
            }

            const data = await res.json();
            accumulatedText = data.reply || 'Lo siento, no he podido generar una respuesta.';

            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === 'model') {
                    lastMessage.text = accumulatedText;
                }
                return newMessages;
            });

            // Once streaming ends successfully, log the query in the background
            if (user && accumulatedText) {
                const textForCat = currentInput.toLowerCase();
                let category = 'Duda General';
                if (initialVideoTitle) {
                    category = initialVideoTitle.split(':')[0] || 'Temario';
                } else {
                    if (textForCat.includes('derivada') || textForCat.includes('límite') || textForCat.includes('integral') || textForCat.includes('matemática') || textForCat.includes('funciones') || textForCat.includes('ecuación')) {
                        category = 'Matemáticas';
                    } else if (textForCat.includes('enlace') || textForCat.includes('átomo') || textForCat.includes('química') || textForCat.includes('física') || textForCat.includes('reacción') || textForCat.includes('molécula') || textForCat.includes('quimica') || textForCat.includes('fisica')) {
                        category = 'Física y Química';
                    } else if (textForCat.includes('sujeto') || textForCat.includes('sintaxis') || textForCat.includes('oración') || textForCat.includes('verbo') || textForCat.includes('complemento') || textForCat.includes('analizar') || textForCat.includes('oraciones')) {
                        category = 'Sintaxis';
                    } else if (textForCat.includes('célula') || textForCat.includes('fotosíntesis') || textForCat.includes('biología') || textForCat.includes('genética') || textForCat.includes('adn') || textForCat.includes('fotosintesis') || textForCat.includes('biologia')) {
                        category = 'Biología';
                    }
                }
                api.logAIQuery(user.id, currentInput, accumulatedText, category, activeVibe || 'general');
            }
        } catch (error) {
            if (!streamController.current.abort) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.role === 'model') {
                        lastMessage.text = 'Lo siento, ha ocurrido un error. Inténtalo de nuevo.';
                    }
                    return newMessages;
                });
            }
        } finally {
            setIsLoading(false);
            streamController.current.abort = false;
        }
    }, [input, image, messages, enrolledCourse, selectedVibe]);
    
    // This effect runs only once to handle the case where the user navigates from a video
    useEffect(() => {
        if (initialTopic && !initialTopicHandled.current) {
            initialTopicHandled.current = true;
            const initialMessageText = `Hola, tengo una duda sobre el vídeo "${initialVideoTitle}". El concepto principal es "${initialTopic}". ¿Podrías ayudarme?`;
            handleSendMessage(null, initialMessageText);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [initialTopic, initialVideoTitle, handleSendMessage, navigate, location.pathname]);


    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate(ROUTES.DASHBOARD, { replace: true });
        }
    };

    const handleClearChat = useCallback(() => {
        setMessages([{ role: 'model', text: initialMessage }]);
        setInput('');
        setImage(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
        if(textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [initialMessage]);

    const handleStopGenerating = () => {
        streamController.current.abort = true;
        setIsLoading(false);
    };
    
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${e.target.scrollHeight}px`;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                 setImage({
                    file,
                    preview: URL.createObjectURL(file),
                    base64: base64String,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImage(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }

    return (
        <SubscriptionGate>
            <div className={`animate-slide-in-up ${
                isFullscreen
                ? "fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-800"
                : "flex flex-col h-full w-full max-w-4xl mx-auto bg-white dark:bg-slate-800 md:rounded-xl md:shadow-2xl md:border dark:border-slate-700"
            }`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 flex-shrink-0">
                    <div className='flex items-center'>
                         <SparklesIcon className="w-10 h-10 text-primary mr-3"/>
                         <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t('tutorIa.title')}</h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{t('tutorIa.subtitle')}</p>
                         </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <button
                            onClick={handleClearChat}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-600 dark:text-rose-450 font-bold rounded-lg border border-rose-500/20 transition-all duration-200 text-xs sm:text-sm mr-1 cursor-pointer select-none"
                            title="Limpiar historial de conversación"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Limpiar Chat</span>
                        </button>
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer select-none"
                            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                        >
                            {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
                        </button>
                        <button onClick={handleBack} className="flex items-center px-3 py-1.5 bg-transparent border border-gray-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer select-none">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Vibe Selector Ribbon */}
                <div className="bg-slate-100 dark:bg-slate-800 border-b dark:border-slate-700 p-2 text-xs flex flex-wrap md:flex-row gap-2 items-center justify-between flex-shrink-0">
                    <span className="font-bold text-slate-700 dark:text-slate-300 px-2">Estilo de Tutoría:</span>
                    <div className="flex flex-wrap gap-1.5 p-1 bg-white/50 dark:bg-slate-900/40 rounded-lg">
                        {vibes.map(v => (
                            <button
                                key={v.id}
                                type="button"
                                onClick={() => setSelectedVibe(v.id as any)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-semibold select-none transition-all cursor-pointer ${
                                    selectedVibe === v.id
                                    ? 'bg-primary border-primary text-white shadow-sm font-bold'
                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-755'
                                }`}
                                title={v.desc}
                            >
                                <span className="text-sm">{v.emoji}</span>
                                <span>{v.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-slate-900">
                    {messages.map((msg, index) => (
                        <div key={index} className="space-y-4">
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className={`flex gap-3 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'model' && (
                                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                        <SparklesIcon className="w-6 h-6 text-white" />
                                    </div>
                                )}
                                <div className={`mobile-responsive-bubble shadow-sm relative text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-primary text-white rounded-br-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 rounded-bl-none border dark:border-slate-700'
                                }`}>
                                    {isLoading && msg.role === 'model' && !msg.text && index === messages.length - 1 ? (
                                        <ThinkingIndicator vibe={selectedVibe} />
                                    ) : (
                                        <MarkdownContent content={msg.text} />
                                    )}
                                    {msg.image && <img src={msg.image} alt="User upload" className="mt-2 rounded-lg max-w-xs" />}
                                </div>
                                 {msg.role === 'user' && user && (
                                    <img
                                        loading="lazy"
                                        width="40"
                                        height="40"
                                        className="w-10 h-10 rounded-full object-cover bg-gray-200 flex-shrink-0"
                                        src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.role === 'student' ? user.name : 'Admin'}`}
                                        alt="User avatar"
                                    />
                                )}
                            </motion.div>
                            
                            {index === 0 && messages.length === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="pl-0 sm:pl-13 py-3 grid grid-cols-1 md:grid-cols-3 gap-3"
                                >
                                    {vibePrompts[selectedVibe].map((prompt, pIdx) => (
                                        <button
                                            key={pIdx}
                                            type="button"
                                            onClick={() => handleSendMessage(null, prompt.text)}
                                            className="text-left p-3.5 rounded-xl border border-dashed border-indigo-200 hover:border-indigo-400 dark:border-slate-700 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/20 dark:hover:bg-slate-755 text-xs text-slate-700 dark:text-slate-300 font-semibold transition-all shadow-sm flex items-start gap-2.5 cursor-pointer"
                                        >
                                            <span className="text-base select-none leading-none">{prompt.icon}</span>
                                            <span className="leading-snug">{prompt.text}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700 flex-shrink-0">
                    {image && (
                         <div className="relative inline-block mb-2">
                             <img src={image.preview} alt="Preview" className="h-24 w-24 object-cover rounded-lg"/>
                             <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                                 <CloseIcon className="w-4 h-4" />
                             </button>
                         </div>
                    )}
                    <div className="flex items-end gap-2 p-2 border rounded-xl bg-gray-50 dark:bg-slate-700 focus-within:ring-2 focus-within:ring-primary transition-shadow dark:border-slate-600">
                        <textarea 
                            id="tutor-chat-input"
                            aria-label="Escribe tu pregunta o duda para el Tutor IA"
                            ref={textareaRef}
                            value={input}
                            onChange={handleInput}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder="Escribe tu duda aquí..."
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 resize-none p-0 text-slate-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 max-h-40"
                        />
                         <label htmlFor="file-input" className="p-2 text-gray-500 dark:text-slate-400 hover:text-primary rounded-full hover:bg-primary/10 cursor-pointer transition-colors">
                            <PaperclipIcon className="w-6 h-6" />
                        </label>
                        <input type="file" id="file-input" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        {isLoading ? (
                            <button 
                                type="button" 
                                onClick={handleStopGenerating}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                aria-label="Detener generación"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"></path></svg>
                            </button>
                        ) : (
                            <button 
                                type="submit" 
                                disabled={!input.trim() && !image}
                                className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Enviar mensaje"
                            >
                                <PaperAirplaneIcon className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </SubscriptionGate>
    );
};
