import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Users, 
    MessageSquare, 
    Send, 
    Plus, 
    BookOpen, 
    Clock, 
    ChevronLeft, 
    Volume2, 
    Video, 
    Sparkles, 
    Smile, 
    Trash2,
    Check,
    MessageCircle
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { NotificationContext } from '../contexts/NotificationContext';
import * as api from '../services/api';
import { SubscriptionGate } from './SubscriptionGate';
import { VoiceGroupCall } from './VoiceGroupCall';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { useI18n } from '../hooks/useI18n';
import type { StudentUser, CourseLevel, Subject } from '../types';

interface TemporaryStudyGroup {
    id: string;
    subjectId: string;
    courseId: string;
    name: string;
    objective: string;
    createdAt: string;
    creatorName: string;
    creatorId: string;
    activeStudentCount: number;
}

interface GroupChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
    isSimulated?: boolean;
}

// Pre-seeded messages for simulation depending on subject
const SEED_SIMULATED_RESPONSES: Record<string, string[]> = {
    mat: [
        "¡Hola! Estaba atascado en el ejercicio 4 del bloque de límites.",
        "Yo creo que se resuelve multiplicando por el conjugado, ¿no?",
        "Sí, así sale una indeterminación de cero partido por cero más fácil.",
        "¿Alguien tiene a mano las fórmulas de las derivadas inmediatas?",
        "¡Gracias! Ya me ha quedado muchísimo más claro.",
        "¡Buenas! ¿Alguien ha empezado a repasar las matrices para el examen?",
        "Yo sí, me sé bien el método de Gauss pero me cuesta el de la matriz inversa.",
        "Para la matriz inversa recuerda que: A^-1 = 1/|A| * Adj(A)^t."
    ],
    fyq: [
        "¡Hola a todos! ¿Alguien entiende bien el principio de conservación de la energía?",
        "La energía cinética inicial más la potencial tiene que ser igual a la final si no hay rozamiento.",
        "¡Exacto! Y si hay rozamiento, restas el trabajo de la fuerza de rozamiento.",
        "¿Hay que saberse de memoria las constantes de la ley de gravitación universal?",
        "Normalmente te las dan en el enunciado del problema, pero G = 6.67e-11.",
        "Genial. ¿Cómo lleváis la formulación orgánica? Los ésteres se me resisten.",
        "Recuerda que los ésteres siempre terminan en '-oato de ...-ilo'."
    ],
    bio: [
        "Hola chicos, ¿cómo os va lo del ciclo celular?",
        "Tengo un jaleo mental con la diferencia entre mitosis y meiosis.",
        "Mitosis da dos células diploides idénticas, meiosis da cuatro células haploides con variabilidad genética.",
        "¡Excelente explicación, Lucía! Me la apunto para el examen.",
        "¿Alguien tiene un resumen limpio sobre la replicación del ADN?"
    ],
    default: [
        "¡Hola! ¿Qué tal lleváis este tema?",
        "A mí me parece un poco denso, pero con los vídeos se entiende mucho mejor.",
        "¿Queréis que hagamos algún ejercicio juntos por aquí?",
        "Sí, por favor, resolvamos las dudas que tengamos.",
        "¡Vaya, qué buen grupo de estudio hemos montado!"
    ]
};

const SEED_MOCK_COMPANION_NAMES = [
    "Sofía Martín",
    "Alejandro Ruiz",
    "Lucía Fernández",
    "Marc Gómez",
    "Daniela Torres",
    "Javier Serrano",
    "Marta Beltrán"
];

const SEED_COMPANION_STATUSES = [
    "Estudiando ahora mismo 📝",
    "Resolviendo cuestionarios ✨",
    "Repasando ejercicios difíciles 🤔",
    "Viendo videotutoriales 🎥",
    "Conectado hace poco 🟢",
    "Preparando examen EBAU 🎯"
];

export const StudyGroupsPage: React.FC = () => {
    const { t } = useI18n();
    const { user } = useContext(AuthContext);
    const { addToast } = useContext(NotificationContext);
    const handleBack = useBackNavigation();
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- STATE MANAGER ---
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [groups, setGroups] = useState<TemporaryStudyGroup[]>([]);
    const [activeGroup, setActiveGroup] = useState<TemporaryStudyGroup | null>(null);
    const [messages, setMessages] = useState<GroupChatMessage[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isVoiceConnected, setIsVoiceConnected] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form states
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupObjective, setNewGroupObjective] = useState('');

    // --- QUERIES ---
    const { data: courses = [], isLoading: loadingCourses } = useQuery<CourseLevel[]>({
        queryKey: ['courses'],
        queryFn: api.fetchCourses
    });

    const { data: classmates = [], isLoading: loadingClassmates } = useQuery({
        queryKey: ['classmates-same-level', user?.id],
        queryFn: () => api.fetchClassmatesOfSameLevel(user?.id || ''),
        enabled: !!user?.id,
    });

    const student = user as StudentUser;

    // Filter enrolled course and subjects
    const enrolledSubjectsAndCourses = useMemo(() => {
        if (!courses || !student || student.role !== 'student') return [];
        
        return courses
            .filter(c => student.enrolledCourseIds && student.enrolledCourseIds.includes(c.id))
            .flatMap(c => (c.subjects || []).map(s => ({
                ...s,
                courseId: c.id,
                courseName: c.name
            })));
    }, [courses, student]);

    // Set default subject on load
    useEffect(() => {
        if (enrolledSubjectsAndCourses.length > 0 && !selectedSubject) {
            setSelectedSubject(enrolledSubjectsAndCourses[0]);
            setSelectedCourseId(enrolledSubjectsAndCourses[0].courseId);
        }
    }, [enrolledSubjectsAndCourses, selectedSubject]);

    // Retrieve temporary study groups from localStorage for selected subject
    useEffect(() => {
        if (!selectedSubject) return;

        const storedGroupsKey = `aula_study_groups_${selectedSubject.id}`;
        const storedStr = localStorage.getItem(storedGroupsKey);
        
        if (storedStr) {
            setGroups(JSON.parse(storedStr));
        } else {
            // Seed a realistic default temporary study group for this subject
            const defaultGroup: TemporaryStudyGroup = {
                id: `group_default_${selectedSubject.id}`,
                subjectId: selectedSubject.id,
                courseId: selectedCourseId,
                name: `Dudas del Tema 1: ${selectedSubject.name}`,
                objective: "Repasar las dudas de las fichas de problemas y compartir apuntes de clase.",
                createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                creatorName: "Sofía Martín",
                creatorId: "user_seed_sofia",
                activeStudentCount: 3
            };
            const seeded = [defaultGroup];
            localStorage.setItem(storedGroupsKey, JSON.stringify(seeded));
            setGroups(seeded);
        }
        // Reset active group chat when changing subject
        setActiveGroup(null);
    }, [selectedSubject, selectedCourseId]);

    // Load messages of selected group chat
    useEffect(() => {
        if (!activeGroup) {
            setMessages([]);
            return;
        }

        const storedMessagesKey = `aula_study_group_msgs_${activeGroup.id}`;
        const storedStr = localStorage.getItem(storedMessagesKey);
        if (storedStr) {
            setMessages(JSON.parse(storedStr));
        } else {
            // Seed welcome messages
            const seededMsgs: GroupChatMessage[] = [
                {
                    id: `msg_seed_1_${activeGroup.id}`,
                    senderId: "user_seed_sofia",
                    senderName: "Sofía Martín",
                    text: `¡Hola a todos! He creado este grupo temporal para resolver dudas sobre ${selectedSubject?.name}.`,
                    timestamp: new Date(Date.now() - 60000).toISOString()
                },
                {
                    id: `msg_seed_2_${activeGroup.id}`,
                    senderId: "user_seed_ale",
                    senderName: "Alejandro Ruiz",
                    text: "Buenas 👋. Yo me uno también, que el examen está al caer.",
                    timestamp: new Date(Date.now() - 30000).toISOString()
                }
            ];
            localStorage.setItem(storedMessagesKey, JSON.stringify(seededMsgs));
            setMessages(seededMsgs);
        }
        setIsVoiceConnected(false);
    }, [activeGroup, selectedSubject]);

    // Scroll chat to end
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Dynamic Classmates filter: Classmates studying the same Subject
    const filteredClassmates = useMemo(() => {
        if (!classmates || !selectedSubject) return [];

        // Distribute realistic mock activities and online statuses
        return classmates.map((c, index) => {
            const statusIndex = (index + selectedSubject.name.length) % SEED_COMPANION_STATUSES.length;
            const status = SEED_COMPANION_STATUSES[statusIndex];
            const isOnline = index % 3 !== 2; // ~66% online

            return {
                ...c,
                isOnline,
                activityText: isOnline ? status : "Desconectado"
            };
        });
    }, [classmates, selectedSubject]);

    // Simulation simulation: simulated user answers when the user sends a message or stays in group
    useEffect(() => {
        if (!activeGroup) return;

        const interval = setInterval(() => {
            // Random chance (20%) that an inactive peer sends a reply simulation
            if (Math.random() > 0.2) return;

            const subjectKey = selectedSubject?.id.includes("mat") ? "mat" : 
                               selectedSubject?.id.includes("fis") || selectedSubject?.id.includes("fyq") ? "fyq" :
                               selectedSubject?.id.includes("bio") ? "bio" : "default";
            
            const responses = SEED_SIMULATED_RESPONSES[subjectKey];
            const randomText = responses[Math.floor(Math.random() * responses.length)];
            const randomName = SEED_MOCK_COMPANION_NAMES[Math.floor(Math.random() * SEED_MOCK_COMPANION_NAMES.length)];
            const companionId = `peer_sim_${randomName.replace(/\s+/g, '_')}`;

            const simulatedMsg: GroupChatMessage = {
                id: `msg_sim_${Date.now()}`,
                senderId: companionId,
                senderName: randomName,
                text: randomText,
                timestamp: new Date().toISOString(),
                isSimulated: true
            };

            setMessages(prev => {
                const updated = [...prev, simulatedMsg];
                localStorage.setItem(`aula_study_group_msgs_${activeGroup.id}`, JSON.stringify(updated));
                return updated;
            });

        }, 15000); // Check every 15 seconds

        return () => clearInterval(interval);
    }, [activeGroup, selectedSubject]);

    // Send Message
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !activeGroup || !student) return;

        const newMsg: GroupChatMessage = {
            id: `msg_user_${Date.now()}`,
            senderId: student.id,
            senderName: student.name,
            text: messageText.trim(),
            timestamp: new Date().toISOString()
        };

        const updated = [...messages, newMsg];
        setMessages(updated);
        localStorage.setItem(`aula_study_group_msgs_${activeGroup.id}`, JSON.stringify(updated));
        setMessageText('');

        // Simulate an answering message after 1-2 seconds for true real-time interactivity
        setTimeout(() => {
            const subjectKey = selectedSubject?.id.includes("mat") ? "mat" : 
                               selectedSubject?.id.includes("fis") || selectedSubject?.id.includes("fyq") ? "fyq" :
                               selectedSubject?.id.includes("bio") ? "bio" : "default";
            
            const responses = SEED_SIMULATED_RESPONSES[subjectKey];
            const randomText = responses[Math.floor(Math.random() * responses.length)];
            const randomName = SEED_MOCK_COMPANION_NAMES[Math.floor(Math.random() * SEED_MOCK_COMPANION_NAMES.length)];
            const companionId = `peer_sim_${randomName.replace(/\s+/g, '_')}`;

            const simulatedMsg: GroupChatMessage = {
                id: `msg_sim_reply_${Date.now()}`,
                senderId: companionId,
                senderName: randomName,
                text: randomText[0] === '¡' ? `¡Oye ${student.name.split(' ')[0]}! ` + randomText.substring(0) : `A mí también me pasa, ` + randomText,
                timestamp: new Date().toISOString(),
                isSimulated: true
            };

            setMessages(prev => {
                const refreshed = [...prev, simulatedMsg];
                localStorage.setItem(`aula_study_group_msgs_${activeGroup.id}`, JSON.stringify(refreshed));
                return refreshed;
            });
        }, 1800);

    };

    // Create Temporary Study Group
    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim() || !selectedSubject) return;

        const newGroup: TemporaryStudyGroup = {
            id: `group_temp_${Date.now()}`,
            subjectId: selectedSubject.id,
            courseId: selectedCourseId,
            name: newGroupName.trim(),
            objective: newGroupObjective.trim() || "Resolver dudas generales en tiempo real.",
            createdAt: new Date().toISOString(),
            creatorName: student.name,
            creatorId: student.id,
            activeStudentCount: 1
        };

        const updatedGroups = [newGroup, ...groups];
        setGroups(updatedGroups);
        localStorage.setItem(`aula_study_groups_${selectedSubject.id}`, JSON.stringify(updatedGroups));
        
        setActiveGroup(newGroup);
        setShowCreateModal(false);
        setNewGroupName('');
        setNewGroupObjective('');
        addToast(`¡Tu grupo "${newGroup.name}" se ha abierto con éxito!`, 'success');
    };

    // Close temporary group (only if you were the creator)
    const handleCloseGroup = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedSubject) return;

        const filtered = groups.filter(g => g.id !== groupId);
        setGroups(filtered);
        localStorage.setItem(`aula_study_groups_${selectedSubject.id}`, JSON.stringify(filtered));
        localStorage.removeItem(`aula_study_group_msgs_${groupId}`);

        if (activeGroup?.id === groupId) {
            setActiveGroup(null);
        }
        addToast('Grupo de estudio temporal cerrado.', 'info');
    };

    return (
        <SubscriptionGate>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 animate-slide-in-up">
                
                {/* Header Page */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            aria-label="Volver atrás"
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                                {t('studyGroups.title')}
                            </h1>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                {t('studyGroups.subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* New Group Button */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus className="w-5 h-5 border border-white/30 rounded-full" />
                        <span>Abrir Grupo Temporal</span>
                    </button>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Left Column: Subjects list & Classmates level (3 cols) */}
                    <div className="lg:col-span-3 space-y-6 flex flex-col">
                        
                        {/* Selected Matter Card */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-150 dark:border-slate-750 shadow-sm">
                            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">
                                Selecciona materia:
                            </h2>
                            <div className="space-y-1.5">
                                {enrolledSubjectsAndCourses.map((subj) => {
                                    const isSelected = selectedSubject?.id === subj.id;
                                    return (
                                        <button
                                            key={`${subj.courseId}_${subj.id}`}
                                            onClick={() => {
                                                setSelectedSubject(subj);
                                                setSelectedCourseId(subj.courseId);
                                            }}
                                            className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                                                isSelected 
                                                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/10' 
                                                    : 'bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200'
                                            }`}
                                        >
                                            <div className="min-w-0 pr-2">
                                                <p className="text-sm font-semibold truncate leading-snug" title={subj.name}>{subj.name}</p>
                                                <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`} title={subj.courseName}>
                                                    {subj.courseName}
                                                </p>
                                            </div>
                                            <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${isSelected ? 'bg-indigo-500/50' : 'bg-slate-200/50 dark:bg-slate-700/50'}`}>
                                                <BookOpen className="w-3.5 h-3.5" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* peers of the same subject */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-150 dark:border-slate-750 shadow-sm flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                                    Estudiando esta materia
                                </h2>
                                <span className="bg-indigo-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                                    {filteredClassmates.filter(c => c.isOnline).length} Activos
                                </span>
                            </div>

                            <div className="space-y-3 overflow-y-auto max-h-[300px] lg:max-h-[350px] pr-1 flex-1">
                                {loadingClassmates ? (
                                    <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                                        Cargando alumnos de tu nivel...
                                    </div>
                                ) : filteredClassmates.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-slate-400">
                                        No hay alumnos registrados en esta materia todavía.
                                    </div>
                                ) : (
                                    filteredClassmates.map((cl) => (
                                        <div 
                                            key={cl.id} 
                                            className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors"
                                        >
                                            <div className="relative flex-shrink-0">
                                                <img 
                                                    src={cl.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${cl.name}`} 
                                                    alt={cl.name} 
                                                    className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-150"
                                                />
                                                <span className={`absolute -bottom-1 -right-1 block h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 ${cl.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={cl.name}>
                                                    {cl.name}
                                                </h3>
                                                <p className="text-[10px] text-slate-500 truncate mt-0.5" title={cl.activityText}>
                                                    {cl.activityText}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Middle Column: Active Temporary groups of the subject (4 cols) */}
                    <div className="lg:col-span-4 space-y-6 flex flex-col">
                        
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-150 dark:border-slate-750 shadow-sm flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-750 pb-3">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                        Salas de Estudio
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Salas temporales activas para resolver dudas
                                    </p>
                                </div>
                                <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs px-2.5 py-1 rounded-lg">
                                    {groups.length} Salas
                                </span>
                            </div>

                            <div className="space-y-4 overflow-y-auto max-h-[400px] lg:max-h-[500px] pr-1 flex-1">
                                {groups.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                                        <MessageCircle className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
                                        <p className="text-sm font-semibold">No hay salas de estudio abiertas</p>
                                        <p className="text-xs text-slate-400 max-w-[200px] mt-1">
                                            ¡Sé el primero e inicia un grupo para resolver dudas!
                                        </p>
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="mt-4 px-3.5 py-1.5 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-xs hover:bg-indigo-100 dark:hover:bg-slate-650 transition-colors"
                                        >
                                            Abrir sala nueva
                                        </button>
                                    </div>
                                ) : (
                                    groups.map((group) => {
                                        const isActive = activeGroup?.id === group.id;
                                        const isMyGroup = group.creatorId === student.id;

                                        return (
                                            <div
                                                key={group.id}
                                                onClick={() => setActiveGroup(group)}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer relative group/item hover:shadow-md ${
                                                    isActive 
                                                        ? 'bg-indigo-500/5 dark:bg-indigo-500/5 border-indigo-500/50 ring-1 ring-indigo-500/30' 
                                                        : 'bg-slate-50/50 dark:bg-slate-850 border-slate-150 dark:border-slate-750'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                            {group.name}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                                                            {group.objective}
                                                        </p>
                                                    </div>
                                                    
                                                    {isMyGroup && (
                                                        <button
                                                            onClick={(e) => handleCloseGroup(group.id, e)}
                                                            aria-label="Cerrar esta sala de estudio temporal"
                                                            className="p-1 px-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors flex-shrink-0"
                                                            title="Cerrar sala"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <span className="flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
                                                        <Users className="w-3 h-3 text-indigo-500" />
                                                        <span>Por {group.creatorName}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{new Date(group.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Chat panel for selected Temporary room (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col">
                        
                        {activeGroup ? (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-750 shadow-sm overflow-hidden flex flex-col h-[550px]">
                                
                                {/* Chat Header */}
                                <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/10 dark:from-slate-800/20 dark:to-slate-850/30 border-b border-indigo-100/50 dark:border-slate-750 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-indigo-600 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                Temporal
                                            </span>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={activeGroup.name}>
                                                {activeGroup.name}
                                            </h3>
                                        </div>
                                        <p className="text-[10px] text-slate-500 truncate mt-0.5" title={activeGroup.objective}>
                                            Obj: {activeGroup.objective}
                                        </p>
                                    </div>

                                    {/* Action items inside call */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                            onClick={() => setIsVoiceConnected(!isVoiceConnected)}
                                            className={`p-2 rounded-xl border flex items-center justify-center gap-1 text-xs font-bold transition-all ${
                                                isVoiceConnected 
                                                    ? 'bg-emerald-500 text-white border-emerald-500 animate-pulse'
                                                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-650 hover:bg-slate-100'
                                            }`}
                                            title="Unirse a llamada de estudio"
                                        >
                                            <Volume2 className="w-4 h-4" />
                                            {isVoiceConnected && <span className="hidden sm:inline font-bold">Llamada</span>}
                                        </button>
                                        <a
                                            href="#/app/student-chat"
                                            className="p-2 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 flex items-center justify-center"
                                            title="Ir al whiteboard de la sesión"
                                        >
                                            <Video className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>

                                {/* Active voice call component synced with Firebase */}
                                {isVoiceConnected && (
                                    <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                                        <VoiceGroupCall courseId={`studygroup_${activeGroup.id}`} onClose={() => setIsVoiceConnected(false)} />
                                    </div>
                                )}

                                {/* Chat Messages list */}
                                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/70 dark:bg-slate-900/40">
                                    {messages.map((msg, index) => {
                                        const isMe = msg.senderId === student.id;
                                        
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {!isMe && (
                                                    <img 
                                                        src={`https://api.dicebear.com/8.x/initials/svg?seed=${msg.senderName}`}
                                                        alt={msg.senderName} 
                                                        className="w-7 h-7 rounded-lg border border-slate-150 flex-shrink-0"
                                                    />
                                                )}
                                                <div className="max-w-[75%]">
                                                    {!isMe && (
                                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 ml-1">
                                                            {msg.senderName}
                                                        </span>
                                                    )}
                                                    <div 
                                                        className={`p-3 rounded-2xl shadow-sm text-sm relative mt-0.5 ${
                                                            isMe 
                                                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-150 border border-slate-150 dark:border-slate-700/60 rounded-tl-none'
                                                        }`}
                                                    >
                                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                        
                                                        <p className={`text-[8.5px] font-medium mt-1.5 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input form */}
                                <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-150 dark:border-slate-750 flex gap-2">
                                    <input
                                        type="text"
                                        aria-label="Escribe tu mensaje en la sala de estudio"
                                        placeholder="Pregunta o comenta tu duda..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-750 text-slate-900 dark:text-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageText.trim()}
                                        className="p-2.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors"
                                        aria-label="Enviar mensaje"
                                    >
                                        <Send className="w-5.5 h-5.5" />
                                    </button>
                                </form>

                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-750 flex flex-col items-center justify-center text-center p-8 h-[550px]">
                                <MessageSquare className="w-16 h-16 text-indigo-400/40 mb-3 stroke-1 animate-pulse" />
                                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                                    Ninguna Sala Seleccionada
                                </h3>
                                <p className="text-xs text-slate-450 dark:text-slate-400 max-w-[280px] mt-1.5 leading-relaxed">
                                    Haz clic en cualquiera de las salas temporales de la izquierda o crea una nueva para entrar al canal grupal de dudas de {selectedSubject?.name}.
                                </p>
                            </div>
                        )}

                    </div>

                </div>

            </div>

            {/* CREATE TEMPORARY STUDY GROUP MODAL */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-150 dark:border-slate-750 max-w-md w-full p-6 relative overflow-hidden"
                        >
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-50 mb-1 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" />
                                <span>Abrir Sala de Estudio Temporal</span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                Esta sala estará dedicada a resolver dudas sobre <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{selectedSubject?.name}</span> para alumnos de tu nivel.
                            </p>

                            <form onSubmit={handleCreateGroup} className="space-y-4">
                                <div>
                                    <label htmlFor="groupName" className="block text-xs font-bold text-slate-650 dark:text-slate-300 uppercase tracking-widest mb-1.5">
                                        Tema o Dudas de la Sala
                                    </label>
                                    <input
                                        type="text"
                                        id="groupName"
                                        required
                                        placeholder="Ej: Dudas del bloque de límites y asíntotas"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-950 dark:text-slate-50 rounded-xl text-sm border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="groupObjective" className="block text-xs font-bold text-slate-650 dark:text-slate-300 uppercase tracking-widest mb-1.5">
                                        Objetivo o Foco (Opcional)
                                    </label>
                                    <textarea
                                        id="groupObjective"
                                        rows={3}
                                        placeholder="Ej: Repasar el ejercicio de optimización del examen de septiembre"
                                        value={newGroupObjective}
                                        onChange={(e) => setNewGroupObjective(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-950 dark:text-slate-50 rounded-xl text-sm border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    />
                                </div>

                                <div className="flex gap-2.5 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-150 font-bold rounded-xl text-sm transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/10"
                                    >
                                        Crear Sala
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </SubscriptionGate>
    );
};
