import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { syncAllUsersToFirestore } from '../services/firestoreSync';
import { Database, RefreshCw, CheckCircle2, UserCheck, Layers, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const FirestoreTestViewer: React.FC = () => {
    const { user } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'agenda' | 'comments' | 'topics' | 'answers' | 'infinity'>('users');
    const [usersList, setUsersList] = useState<any[]>([]);
    const [coursesList, setCoursesList] = useState<any[]>([]);
    const [agendaList, setAgendaList] = useState<any[]>([]);
    const [commentsList, setCommentsList] = useState<any[]>([]);
    const [topicsList, setTopicsList] = useState<any[]>([]);
    const [answersList, setAnswersList] = useState<any[]>([]);
    const [infinityList, setInfinityList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || user?.role !== 'admin') return;
        setLoading(true);

        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsersList(docs);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching users from Firestore:", err);
            setLoading(false);
        });

        const unsubscribeCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCoursesList(docs);
        }, (err) => console.error("Error fetching courses from Firestore:", err));

        const unsubscribeAgenda = onSnapshot(collection(db, 'firestore_agenda_events'), (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAgendaList(docs);
        }, (err) => console.error("Error fetching agenda from Firestore:", err));

        const unsubscribeComments = onSnapshot(collection(db, 'firestore_comments'), (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCommentsList(docs);
        }, (err) => console.error("Error fetching comments from Firestore:", err));

        const unsubscribeTopics = onSnapshot(collection(db, 'firestore_topic_requests'), (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTopicsList(docs);
        }, (err) => console.error("Error fetching topics from Firestore:", err));

        const unsubscribeAnswers = onSnapshot(collection(db, 'firestore_student_answers'), (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAnswersList(docs);
        }, (err) => console.error("Error fetching answers from Firestore:", err));

        const unsubscribeInfinity = onSnapshot(collection(db, 'infinity_transactions'), (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInfinityList(docs);
        }, (err) => console.error("Error fetching infinity txs from Firestore:", err));

        return () => {
            unsubscribeUsers();
            unsubscribeCourses();
            unsubscribeAgenda();
            unsubscribeComments();
            unsubscribeTopics();
            unsubscribeAnswers();
            unsubscribeInfinity();
        };
    }, [isOpen]);

    const handleForceSync = async () => {
        setSyncing(true);
        try {
            await syncAllUsersToFirestore();
            setLastSyncTime(new Date().toLocaleTimeString());
        } catch (e) {
            console.error('Error during manual sync:', e);
        } finally {
            setSyncing(false);
        }
    };

    if (user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 font-sans">
            {/* Toggle Button */}
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white dark:bg-emerald-600 dark:text-white px-4 py-2.5 rounded-full shadow-2xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all text-xs font-semibold border border-slate-700/50"
                    id="firestore-inspector-toggle"
                >
                    <Database className="w-4 h-4 text-emerald-400 dark:text-emerald-100 animate-pulse" />
                    <span>Firestore Monitor</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                        {usersList.length > 0 ? `${usersList.length} docs` : 'Live'}
                    </span>
                </button>
            ) : (
                /* Inspector Panel */
                <div className="w-[92vw] max-w-xl bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col max-h-[80vh]">
                    {/* Header */}
                    <div className="p-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                                <Database className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                    Firestore Live Inspector
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                </h3>
                                <p className="text-[11px] text-slate-400">Colecciones sincronizadas en tiempo real</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleForceSync}
                                disabled={syncing}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                                title="Sincronizar base de datos local con Firestore"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Sincronizando...' : 'Sincronizar Todo'}
                            </button>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-800 bg-slate-900/60 px-3 pt-2 gap-1 overflow-x-auto text-xs scrollbar-none">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'users'
                                    ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>users ({usersList.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('courses')}
                            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'courses'
                                    ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>courses ({coursesList.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('agenda')}
                            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'agenda'
                                    ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>agenda ({agendaList.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'comments'
                                    ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>comentarios ({commentsList.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('topics')}
                            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'topics'
                                    ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>solicitudes ({topicsList.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('answers')}
                            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'answers'
                                    ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>exámenes ({answersList.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('infinity')}
                            className={`px-3 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'infinity'
                                    ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>infinitys ({infinityList.length})</span>
                        </button>
                    </div>

                    {/* Content View */}
                    <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs font-mono">
                        {lastSyncTime && (
                            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-[11px] flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Última sincronización completada a las {lastSyncTime}</span>
                            </div>
                        )}

                        {loading ? (
                            <div className="py-8 text-center text-slate-400">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                                Conectando a Firestore...
                            </div>
                        ) : activeTab === 'users' ? (
                            usersList.length === 0 ? (
                                <div className="py-8 text-center text-slate-400">
                                    No se encontraron usuarios en la colección `users`. Haga clic en "Sincronizar Todo".
                                </div>
                            ) : (
                                usersList.map((usr) => (
                                    <div key={usr.id} className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-1.5">
                                        <div className="flex items-center justify-between font-sans">
                                            <span className="font-bold text-slate-100 text-sm">{usr.name || 'Sin Nombre'}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                usr.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                                usr.role === 'teacher' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            }`}>
                                                {usr.role || 'estudiante'}
                                            </span>
                                        </div>
                                        <div className="text-slate-400 text-[11px] font-mono break-all">
                                            <div><strong className="text-slate-300">ID:</strong> {usr.id}</div>
                                            <div><strong className="text-slate-300">Email:</strong> {usr.email}</div>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : activeTab === 'courses' ? (
                            coursesList.length === 0 ? (
                                <div className="py-8 text-center text-slate-400">
                                    No se encontraron cursos en Firestore.
                                </div>
                            ) : (
                                coursesList.map((crs) => (
                                    <div key={crs.id} className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-1">
                                        <div className="font-bold text-slate-100 text-sm font-sans">{crs.title || crs.id}</div>
                                        <div className="text-slate-400 text-[11px] break-all">
                                            <div>ID: {crs.id}</div>
                                            <div>Categoría: {crs.category || 'General'}</div>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : activeTab === 'agenda' ? (
                            agendaList.length === 0 ? (
                                <div className="py-8 text-center text-slate-400">
                                    No hay eventos en `firestore_agenda_events`.
                                </div>
                            ) : (
                                agendaList.map((item) => (
                                    <div key={item.id} className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-1">
                                        <div className="font-bold text-slate-100 text-sm font-sans">{item.title}</div>
                                        <div className="text-slate-400 text-[11px]">
                                            <div>Fecha: {item.date} {item.time}</div>
                                            <div>Estudiante: {item.studentId}</div>
                                            <div>Tipo: {item.type}</div>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : activeTab === 'comments' ? (
                            commentsList.length === 0 ? (
                                <div className="py-8 text-center text-slate-400">
                                    No hay comentarios en `firestore_comments`.
                                </div>
                            ) : (
                                commentsList.map((c) => (
                                    <div key={c.id} className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-1">
                                        <div className="font-bold text-slate-100 text-xs font-sans">{c.author?.name || 'Usuario'}</div>
                                        <div className="text-slate-300 text-[11px]">{c.text}</div>
                                        <div className="text-slate-500 text-[10px]">Vídeo ID: {c.videoId}</div>
                                    </div>
                                ))
                            )
                        ) : activeTab === 'topics' ? (
                            topicsList.length === 0 ? (
                                <div className="py-8 text-center text-slate-400">
                                    No hay solicitudes en `firestore_topic_requests`.
                                </div>
                            ) : (
                                topicsList.map((top) => (
                                    <div key={top.id} className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-1">
                                        <div className="font-bold text-slate-100 text-sm font-sans">{top.topic}</div>
                                        <div className="text-slate-400 text-[11px]">
                                            <div>Alumno: {top.studentName || top.studentId}</div>
                                            <div>Estado: <span className="text-amber-400 font-semibold">{top.status}</span></div>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : activeTab === 'answers' ? (
                            answersList.length === 0 ? (
                                <div className="py-8 text-center text-slate-400">
                                    No hay cuestionarios guardados en `firestore_student_answers`.
                                </div>
                            ) : (
                                answersList.map((ans) => (
                                    <div key={ans.id} className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-1">
                                        <div className="font-bold text-emerald-400 text-xs font-sans">Resultado Cuestionario: {ans.score} / {ans.totalQuestions}</div>
                                        <div className="text-slate-400 text-[11px]">
                                            <div>Alumno ID: {ans.studentId}</div>
                                            <div>Vídeo ID: {ans.videoId}</div>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            infinityList.length === 0 ? (
                                <div className="py-8 text-center text-slate-400">
                                    No hay transacciones en `infinity_transactions`.
                                </div>
                            ) : (
                                infinityList.map((tx) => (
                                    <div key={tx.id} className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-1">
                                        <div className="font-bold text-slate-100 text-xs font-sans">{tx.description}</div>
                                        <div className="text-slate-400 text-[11px] flex justify-between">
                                            <span>Monto: <strong className={tx.amount > 0 ? "text-emerald-400" : "text-rose-400"}>{tx.amount > 0 ? `+${tx.amount}` : tx.amount}</strong></span>
                                            <span>Estudiante: {tx.studentId}</span>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
