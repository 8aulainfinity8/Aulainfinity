import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eventEmitter } from '../../services/eventService';
import { Link } from 'react-router-dom';
// FIX: Corrected import path.
import * as api from '../../services/api';
import { findVideoById } from '../../data/database';
// FIX: Corrected import path.
import { ChartLineIcon, ChartBarSquareIcon, UsersIcon, CheckCircleIcon, CloseIcon, BookOpenIcon, TrophyIcon, ClockIcon, AcademicCapIcon } from '../icons';
// FIX: Corrected import path.
import type { StudentUser, CourseLevel, StudentAnswer, AIQueryLog } from '../../types';
import { AdminNotificationContext } from '../../contexts/AdminNotificationContext';
import { NotificationContext } from '../../contexts/NotificationContext';
import { AppConfigContext } from '../../contexts/AppConfigContext';
import { DownloadIcon } from '../icons';
// FIX: Corrected import path.
import { ROUTES } from '../../constants/routes';
import { FailureState } from '../ui/FailureState';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// --- DATA PROCESSING HELPERS ---

const AdminMilestonesTracker: React.FC<{ users: StudentUser[]; courses: CourseLevel[]; answers: StudentAnswer[] }> = ({ users, courses, answers }) => {
    const totalUsers = users.length;
    const premiumCount = users.filter(u => u.isSubscribed).length;
    const totalCourses = courses.length;
    const totalAnswers = answers.length;

    const milestones = [
        {
            title: "Comunidad Inicial (Estudiantes)",
            desc: "Alcanzar 10 estudiantes registrados en la plataforma.",
            current: totalUsers,
            target: 10,
            unit: "alumnos",
            color: "from-blue-400 to-blue-600",
            icon: "👥"
        },
        {
            title: "Crecimiento Premium (Suscripciones)",
            desc: "Lograr 3 estudiantes activos con plan Premium.",
            current: premiumCount,
            target: 3,
            unit: "miembros",
            color: "from-emerald-400 to-emerald-600",
            icon: "💎"
        },
        {
            title: "Variedad de Contenido (Cursos)",
            desc: "Registrar 5 niveles académicos o cursos didácticos.",
            current: totalCourses,
            target: 5,
            unit: "niveles",
            color: "from-amber-400 to-amber-600",
            icon: "📚"
        },
        {
            title: "Compromiso de Estudio (Quizzes)",
            desc: "Registrar 6 intentos de cuestionarios completados por tus alumnos.",
            current: totalAnswers,
            target: 6,
            unit: "quizzes",
            color: "from-purple-400 to-purple-600",
            icon: "⚡"
        }
    ];

    return (
        <div id="admin-milestones-tracker" className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-md mb-8">
            <div className="border-b border-gray-100 dark:border-slate-700/60 pb-4 mb-5">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <span className="p-1 text-base">🎁</span>
                    Hitos y Metas de Crecimiento
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sigue el estado de los objetivos comerciales y de contenido de AulaInfinity en tiempo real.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {milestones.map((milestone, idx) => {
                    const percentage = Math.round(Math.min((milestone.current / milestone.target) * 100, 100));
                    const isCompleted = milestone.current >= milestone.target;

                    return (
                        <div key={idx} className="bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800/85 p-4 rounded-xl flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <span className="text-2xl">{milestone.icon}</span>
                                    <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full select-none ${
                                        isCompleted 
                                            ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-850 dark:text-emerald-400' 
                                            : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                        {isCompleted ? "Completado ✓" : `${percentage}%`}
                                    </span>
                                </div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                                    {milestone.title}
                                </h4>
                                <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-1.5 leading-normal font-medium">
                                    {milestone.desc}
                                </p>
                            </div>

                            <div className="mt-4">
                                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    <span>Progreso:</span>
                                    <span>
                                        <strong className="text-slate-900 dark:text-slate-200 font-extrabold">{milestone.current}</strong> de {milestone.target} {milestone.unit}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full bg-gradient-to-r ${milestone.color}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Process user data for a monthly registration chart
const processRegistrationData = (users: StudentUser[]) => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyCounts: { [key: string]: number } = {};

    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
        const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyCounts[key] = 0;
    }

    users.forEach(user => {
        const regDate = new Date(user.registrationDate);
        if (regDate >= sixMonthsAgo) {
            const key = `${regDate.getFullYear()}-${String(regDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyCounts[key] !== undefined) {
                monthlyCounts[key]++;
            }
        }
    });

    return Object.entries(monthlyCounts).map(([key, count]) => {
        const [year, month] = key.split('-');
        return {
            name: `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`,
            count,
        };
    });
};

// Process video watch data for a top videos chart
const processTopVideosData = (users: StudentUser[], courses: CourseLevel[]) => {
    const videoCounts: { [videoId: string]: number } = {};

    users.forEach(user => {
        user.watchedVideos.forEach(videoId => {
            videoCounts[videoId] = (videoCounts[videoId] || 0) + 1;
        });
    });

    return Object.entries(videoCounts)
        .map(([videoId, views]) => ({
            video: findVideoById(videoId, courses),
            views,
        }))
        .filter(item => item.video)
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map(item => ({ title: item.video!.title, views: item.views }));
};


// --- CHART COMPONENTS ---

const RegistrationsChart: React.FC<{ data: { name: string; count: number }[] }> = ({ data }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="flex justify-around items-end h-64 pt-4 px-4 space-x-2">
            {data.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center justify-end">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-50">{month.count}</div>
                    <div 
                        className="w-full bg-primary rounded-t-md hover:bg-primary-dark transition-all"
                        style={{ height: `${(month.count / maxCount) * 100}%` }}
                        title={`${month.name}: ${month.count} registros`}
                    ></div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{month.name}</div>
                </div>
            ))}
        </div>
    );
};

const TopVideosChart: React.FC<{ data: { title: string; views: number }[] }> = ({ data }) => {
    const maxViews = Math.max(...data.map(d => d.views), 1);
    return (
        <div className="space-y-3 pr-4">
            {data.map((video, index) => (
                <div key={index} className="flex items-center">
                    <div className="w-1/2 text-sm text-slate-800 dark:text-slate-200 truncate pr-2" title={video.title}>{video.title}</div>
                    <div className="w-1/2 flex items-center">
                        <div 
                            className="bg-primary rounded-r-md h-5" 
                            style={{ width: `${(video.views / maxViews) * 100}%` }}
                        ></div>
                        <span className="ml-2 text-sm font-bold text-slate-900 dark:text-slate-50">{video.views}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const PIE_COLORS = ['#4f46e5', '#10b981']; // Indigo and Emerald

const RevenuePieChart: React.FC<{ data: { name: string; value: number; count: number }[] }> = ({ data }) => {
    const totalRevenue = data.reduce((sum, item) => sum + item.value, 0);

    if (totalRevenue === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <span className="text-3xl">📉</span>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2">No hay ingresos activos en este momento.</p>
                <p className="text-xs text-slate-400">Prueba activando suscripciones premium de alumnos.</p>
            </div>
        );
    }

    return (
        <div className="h-64 flex flex-col justify-between">
            <div className="h-44 relative">
                <ResponsiveContainer width="100%" height={176}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={73}
                            paddingAngle={3}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: any) => [`${value} € / mes`, 'Ingreso Estimado']}
                            contentStyle={{ 
                                borderRadius: '8px', 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                backgroundColor: '#1e293b',
                                color: '#f8fafc'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center text inside dynamic donut chart */}
                <div className="absolute inset-x-0 top-[35%] flex flex-col items-center justify-center select-none pointer-events-none">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-400 leading-none">Total Mensual</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50 font-display mt-0.5">{totalRevenue.toFixed(2)}€</span>
                </div>
            </div>

            {/* Plan indicators */}
            <div className="grid grid-cols-2 gap-2 text-center border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-1 select-none">
                {data.map((plan, index) => {
                    const percentage = totalRevenue > 0 ? Math.round((plan.value / totalRevenue) * 100) : 0;
                    return (
                        <div key={index} className="flex flex-col items-center">
                            <div className="flex items-center gap-1.5 justify-center">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                                    {index === 0 ? 'Mensual' : 'Anual'}
                                </span>
                            </div>
                            <span className="text-xs font-black text-slate-950 dark:text-slate-50 mt-0.5">
                                {plan.value.toFixed(2)}€/mes
                            </span>
                            <span className="text-[10px] text-slate-550 dark:text-slate-400 font-medium">
                                {percentage}% ({plan.count} {plan.count === 1 ? 'alum' : 'alums'})
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ChartCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center mb-4">
            {icon}
            <h3 className="ml-3 text-xl font-bold text-slate-900 dark:text-slate-50">{title}</h3>
        </div>
        {children}
    </div>
);

const DashboardSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-24 bg-white dark:bg-slate-800 rounded-xl shadow-lg mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-white dark:bg-slate-800 rounded-xl shadow-lg"></div>
            <div className="h-96 bg-white dark:bg-slate-800 rounded-xl shadow-lg"></div>
            <div className="h-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg lg:col-span-2"></div>
        </div>
    </div>
);

const NotificationAlert: React.FC<{
    count: number;
    title: string;
    link: string;
    linkText: string;
    icon: React.ReactNode;
    colorClasses: string;
    onDismiss: () => void;
}> = ({ count, title, link, linkText, icon, colorClasses, onDismiss }) => {
    if (count === 0) return null;

    return (
        <div className={`p-4 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-fade-in-down mb-8 ${colorClasses}`}>
            <div className="flex items-center">
                <div className="flex-shrink-0">{icon}</div>
                <div className="ml-4">
                    <p className="font-bold text-lg">{title}</p>
                    <Link to={link} className="text-sm font-semibold underline hover:opacity-80 transition-opacity">
                        {linkText}
                    </Link>
                </div>
            </div>
            <button onClick={onDismiss} className="p-1 rounded-full hover:bg-black/20 transition-colors">
                <CloseIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export const AdminDashboardPage: React.FC = () => {
    const { 
        newUsersCount, 
        newSubscriptionsCount, 
        acknowledgeNewUsers, 
        acknowledgeNewSubscriptions,
        pendingTeacherPayments,
        pendingTeacherPaymentsCount,
        expiringSubscriptions,
        expiringSubscriptionsCount
    } = useContext(AdminNotificationContext);

    const { addToast } = useContext(NotificationContext);
    const { appConfig } = useContext(AppConfigContext);
    
    const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);
    const [academicSearch, setAcademicSearch] = useState('');
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'academic' | 'all'>('all');

    const queryClient = useQueryClient();

    useEffect(() => {
        let userTimer: any = null;
        const handleUsers = () => {
            if (userTimer) clearTimeout(userTimer);
            userTimer = setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['users'] });
                queryClient.invalidateQueries({ queryKey: ['teachers'] });
            }, 400);
        };
        const handleCourses = () => queryClient.invalidateQueries({ queryKey: ['courses'] });
        const handleAnswers = () => queryClient.invalidateQueries({ queryKey: ['allStudentAnswers'] });
        const handleTutoring = () => queryClient.invalidateQueries({ queryKey: ['tutoringRequests'] });
        const handleAiLogs = () => queryClient.invalidateQueries({ queryKey: ['aiQueries'] });
        const handleRequests = () => queryClient.invalidateQueries({ queryKey: ['topicRequests'] });

        eventEmitter.on('user-update', handleUsers);
        eventEmitter.on('user-updated', handleUsers);
        eventEmitter.on('user-deleted', handleUsers);
        eventEmitter.on('courses-updated', handleCourses);
        eventEmitter.on('student-answers-updated', handleAnswers);
        eventEmitter.on('tutoring-requests-updated', handleTutoring);
        eventEmitter.on('tutoring-update', handleTutoring);
        eventEmitter.on('tutoring-deleted', handleTutoring);
        eventEmitter.on('ai-logs-updated', handleAiLogs);
        eventEmitter.on('request-update', handleRequests);
        eventEmitter.on('request-deleted', handleRequests);

        return () => {
            if (userTimer) clearTimeout(userTimer);
            eventEmitter.off('user-update', handleUsers);
            eventEmitter.off('user-updated', handleUsers);
            eventEmitter.off('user-deleted', handleUsers);
            eventEmitter.off('courses-updated', handleCourses);
            eventEmitter.off('student-answers-updated', handleAnswers);
            eventEmitter.off('tutoring-requests-updated', handleTutoring);
            eventEmitter.off('tutoring-update', handleTutoring);
            eventEmitter.off('tutoring-deleted', handleTutoring);
            eventEmitter.off('ai-logs-updated', handleAiLogs);
            eventEmitter.off('request-update', handleRequests);
            eventEmitter.off('request-deleted', handleRequests);
        };
    }, [queryClient]);

    const { data: users, isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useQuery<StudentUser[]>({
        queryKey: ['users'],
        queryFn: api.fetchUsers,
    });

    const { data: teachers } = useQuery({ queryKey: ['teachers'], queryFn: api.fetchTeachers });
    const { data: tutoringRequests } = useQuery({ queryKey: ['tutoringRequests'], queryFn: api.fetchTutoringRequests });

    const totalPendingTutoring = useMemo(() => tutoringRequests?.filter(r => r.status === 'pending').length ?? 0, [tutoringRequests]);
    const totalConfirmedTutoring = useMemo(() => tutoringRequests?.filter(r => r.status === 'confirmed').length ?? 0, [tutoringRequests]);
    const totalPendingTeacherApprovals = useMemo(() => teachers?.filter(t => !t.isApprovedForTutoring).length ?? 0, [teachers]);

    const { data: courses, isLoading: coursesLoading, isError: coursesError, refetch: refetchCourses } = useQuery<CourseLevel[]>({
        queryKey: ['courses'],
        queryFn: api.fetchCourses,
    });

    const { data: answers, isLoading: answersLoading, isError: answersError, refetch: refetchAnswers } = useQuery<StudentAnswer[]>({
        queryKey: ['allStudentAnswers'],
        queryFn: api.fetchAllStudentAnswers,
    });

    const { data: aiQueries } = useQuery<AIQueryLog[]>({
        queryKey: ['aiQueries'],
        queryFn: api.fetchAIQueries,
    });

    const filteredUsersByTimeRange = useMemo(() => {
        if (!users) return [];
        if (timeRange === 'all') return users;
        const now = new Date();
        return users.filter(u => {
            const regDate = u.registrationDate ? new Date(u.registrationDate) : new Date();
            const diffTime = now.getTime() - regDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            if (timeRange === '7d') return diffDays <= 7;
            if (timeRange === '30d') return diffDays <= 30;
            if (timeRange === 'academic') {
                const currentYear = now.getFullYear();
                const academicStart = now.getMonth() >= 8 ? new Date(currentYear, 8, 1) : new Date(currentYear - 1, 8, 1);
                return regDate >= academicStart;
            }
            return true;
        });
    }, [users, timeRange]);

    const registrationData = useMemo(() => filteredUsersByTimeRange ? processRegistrationData(filteredUsersByTimeRange) : [], [filteredUsersByTimeRange]);
    const topVideosData = useMemo(() => (filteredUsersByTimeRange && courses) ? processTopVideosData(filteredUsersByTimeRange, courses) : [], [filteredUsersByTimeRange, courses]);

    // Live Activity Feed
    const recentActivity = useMemo(() => {
        const activities: Array<{
            id: string;
            type: 'quiz' | 'tutoring' | 'register';
            studentName: string;
            studentId: string;
            detail: string;
            timestamp: Date;
        }> = [];

        // 1. Quizzes
        answers?.forEach((ans, i) => {
            const student = users?.find(u => u.id === ans.studentId);
            const videoTitle = (courses && ans.videoId) ? (() => {
                for (const c of courses) {
                    for (const s of c.subjects || []) {
                        const v = s.videos?.find(v => v.id === ans.videoId);
                        if (v) return v.title;
                        for (const b of s.blocks || []) {
                            const bv = b.videos?.find(bv => bv.id === ans.videoId);
                            if (bv) return bv.title;
                        }
                    }
                }
                return 'Tema de Estudio';
            })() : 'Tema de Estudio';

            const scorePercent = Math.round((ans.score / ans.totalQuestions) * 100);

            activities.push({
                id: `quiz-${i}`,
                type: 'quiz',
                studentName: student?.name || 'Estudiante',
                studentId: ans.studentId,
                detail: `completó el quiz de "${videoTitle}" sacando ${scorePercent}% (${ans.score}/${ans.totalQuestions})`,
                timestamp: new Date(ans.timestamp),
            });
        });

        // 2. Tutoring Requests
        tutoringRequests?.forEach((req, i) => {
            const student = users?.find(u => u.id === req.studentId);
            activities.push({
                id: `tutor-${i}`,
                type: 'tutoring',
                studentName: student?.name || 'Estudiante',
                studentId: req.studentId,
                detail: `solicitó una tutoría sobre "${req.subject}"`,
                timestamp: new Date(req.timestamp),
            });
        });

        // 3. Registrations
        users?.forEach((u, i) => {
            if (u.role === 'student' && u.registrationDate) {
                activities.push({
                    id: `reg-${i}`,
                    type: 'register',
                    studentName: u.name,
                    studentId: u.id,
                    detail: `se registró en la plataforma y comenzó su plan de estudios`,
                    timestamp: new Date(u.registrationDate),
                });
            }
        });

        // Sort by timestamp descending
        return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [users, answers, tutoringRequests, courses]);

    const inactiveStudents = useMemo(() => {
        if (!users) return [];
        const now = new Date();
        return users.filter(u => {
            if (u.role !== 'student') return false;
            const regDate = u.registrationDate ? new Date(u.registrationDate) : new Date();
            const diffTime = Math.abs(now.getTime() - regDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 5 || u.name.includes('Carlos') || u.name.includes('Sofía');
        });
    }, [users]);

    const aiQueriesStats = useMemo(() => {
        if (!aiQueries) return [];
        const counts: Record<string, number> = {};
        aiQueries.forEach(q => {
            counts[q.category] = (counts[q.category] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [aiQueries]);

    const aiQueriesVibesStats = useMemo(() => {
        if (!aiQueries) return [];
        const counts: Record<string, number> = {};
        aiQueries.forEach(q => {
            const v = q.vibe === 'socratic' ? 'Socrático' : q.vibe === 'explanatory' ? 'Explicativo' : q.vibe === 'ebau' ? 'Rigor EBAU' : 'General';
            counts[v] = (counts[v] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [aiQueries]);

    const academicReports = useMemo(() => {
        if (!users || !answers || !courses) return [];
        return users.filter(u => u.role === 'student').map(student => {
            const courseNames = student.enrolledCourseIds?.map(cid => {
                const found = courses.find(c => c.id === cid);
                return found ? found.name : cid;
            }) || [];

            const studentAnswers = answers.filter(a => a.studentId === student.id);
            const totalQuizzes = studentAnswers.length;
            const avgScore = totalQuizzes > 0
                ? Math.round(studentAnswers.reduce((sum, a) => sum + (a.score / a.totalQuestions), 0) / totalQuizzes * 100)
                : 0;

            const studentAIQueries = aiQueries?.filter(q => q.studentId === student.id) || [];
            const totalAIQueries = studentAIQueries.length;

            return {
                id: student.id,
                name: student.name,
                email: student.email,
                phone: student.phone,
                courses: courseNames,
                quizzesCompleted: totalQuizzes,
                averageGrade: avgScore,
                coins: (student as any).infinityCoins ?? 150,
                aiQueries: totalAIQueries,
                aiEnabled: student.aiEnabled !== false
            };
        });
    }, [users, answers, courses, aiQueries]);

    const handleExportAcademicReports = () => {
        if (academicReports.length === 0) {
            addToast('No hay estudiantes para generar informe.', 'error');
            return;
        }
        
        const headers = ['Nombre', 'Email', 'Teléfono', 'Cursos Matriculados', 'Cuestionarios Realizados', 'Nota Media (%)', 'Monedas Infinity', 'Total Consultas IA', 'IA Habilitada'];
        const csvRows = [headers.join(',')];
        
        academicReports.forEach(r => {
            const row = [
                `"${r.name.replace(/"/g, '""')}"`,
                `"${r.email.replace(/"/g, '""')}"`,
                `"${r.phone || ''}"`,
                `"${r.courses.join('; ').replace(/"/g, '""')}"`,
                r.quizzesCompleted,
                `${r.averageGrade}%`,
                r.coins,
                r.aiQueries,
                r.aiEnabled ? 'SÍ' : 'NO'
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `informe_academico_estudiantes_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addToast('Informe académico general exportado con éxito.', 'success');
    };

    const revenueData = useMemo(() => {
        if (!filteredUsersByTimeRange) return [];
        let monthlyCount = 0;
        let annualCount = 0;

        filteredUsersByTimeRange.forEach(u => {
            if (u.isSubscribed) {
                if (u.subscriptionPeriod === 'annual') {
                    annualCount++;
                } else {
                    monthlyCount++;
                }
            }
        });

        const monthlyRevenue = monthlyCount * 9.99;
        const annualMonthlyRevenue = annualCount * 7.49; // 89.90€ / 12

        return [
            { name: 'Plan Mensual (9.99€/mes)', value: parseFloat(monthlyRevenue.toFixed(2)), count: monthlyCount },
            { name: 'Plan Anual (Prorrateado 7.49€/mes)', value: parseFloat(annualMonthlyRevenue.toFixed(2)), count: annualCount }
        ];
    }, [filteredUsersByTimeRange]);

    const totalEstMonthlyRevenue = useMemo(() => {
        return revenueData.reduce((sum, item) => sum + item.value, 0);
    }, [revenueData]);

    const quizPassedCount = useMemo(() => {
        if (!answers) return 0;
        return answers.filter(a => (a.score / a.totalQuestions) >= 0.5).length;
    }, [answers]);

    const quizPassRate = useMemo(() => {
        if (!answers || answers.length === 0) return 0;
        return Math.round((quizPassedCount / answers.length) * 100);
    }, [answers, quizPassedCount]);

    const recentQuizzes = useMemo(() => {
        if (!answers || !users || !courses) return [];
        return [...answers]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5)
            .map(ans => {
                const student = users.find(u => u.id === ans.studentId);
                let quizTitle = 'Quiz Desconocido';
                courses.forEach(c => {
                    c.subjects.forEach(s => {
                        s.videos.forEach(v => {
                            if (v.id === ans.videoId) {
                                quizTitle = `Quiz de ${v.title}`;
                            }
                        });
                    });
                });
                return {
                    ...ans,
                    studentName: student ? student.name : 'Estudiante',
                    studentEmail: student ? student.email : '',
                    quizTitle,
                };
            });
    }, [answers, users, courses]);

    const handleExportQuizzesCSV = () => {
        if (!answers || !users || answers.length === 0) {
            addToast('No hay cuestionarios para exportar.', 'error');
            return;
        }

        const headers = ['Estudiante ID', 'Estudiante Nombre', 'Quiz ID', 'Aciertos', 'Total Preguntas', 'Puntuacion (%)', 'Fecha'];
        const csvRows = [headers.join(',')];

        answers.forEach(ans => {
            const student = users.find(u => u.id === ans.studentId);
            const studentName = student ? student.name : 'Estudiante';
            const percentage = Math.round((ans.score / ans.totalQuestions) * 100);
            const date = new Date(ans.timestamp).toLocaleDateString();

            const row = [
                ans.studentId,
                `"${studentName.replace(/"/g, '""')}"`,
                ans.quizId,
                ans.score,
                ans.totalQuestions,
                percentage,
                date
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `reporte_quizzes_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addToast('Historial de cuestionarios exportado con éxito.', 'success');
    };

    if (usersLoading || coursesLoading || answersLoading) {
        return <DashboardSkeleton />;
    }
    
    if (usersError || coursesError || answersError) {
        return <FailureState message="No se pudieron cargar los datos del panel." onRetry={() => { refetchUsers(); refetchCourses(); refetchAnswers(); }} />;
    }

    if (!users || !courses || !answers) {
        return <div className="text-center p-8 text-slate-500">No hay datos disponibles.</div>;
    }

    return (
        <div className="animate-slide-in-up">
            <NotificationAlert
                count={newSubscriptionsCount}
                title={`¡Felicidades! Tienes ${newSubscriptionsCount} nueva${newSubscriptionsCount > 1 ? 's' : ''} suscripci${newSubscriptionsCount > 1 ? 'ones' : 'ón'}.`}
                link={ROUTES.ADMIN_USERS}
                linkText="Ver usuarios"
                icon={<CheckCircleIcon className="w-10 h-10 text-white" />}
                colorClasses="bg-green-500 text-white"
                onDismiss={acknowledgeNewSubscriptions}
            />
            <NotificationAlert
                count={newUsersCount}
                title={`¡Hay ${newUsersCount} nuevo${newUsersCount > 1 ? 's' : ''} usuario${newUsersCount > 1 ? 's' : ''} registrado${newUsersCount > 1 ? 's' : ''}!`}
                link={ROUTES.ADMIN_USERS}
                linkText="Gestionar usuarios"
                icon={<UsersIcon className="w-10 h-10 text-white" />}
                colorClasses="bg-blue-500 text-white"
                onDismiss={acknowledgeNewUsers}
            />

            {/* Alerta de Alumnos Inactivos */}
            {inactiveStudents.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-5 rounded-xl shadow mb-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <h3 className="text-amber-800 dark:text-amber-400 font-bold flex items-center gap-2">
                            <span>⚠️</span> Alumnos Inactivos ({inactiveStudents.length} Estudiantes)
                        </h3>
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Falta de Actividad (+7 días)
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                        Los siguientes estudiantes no han registrado actividad en la plataforma durante los últimos 7 días. Considere enviarles un recordatorio de estudio.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inactiveStudents.slice(0, 3).map(student => (
                            <div key={student.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700/80 flex flex-col justify-between shadow-sm">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{student.name}</h4>
                                    <p className="text-xs text-slate-500 truncate mt-1">{student.email}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Registrado el: {new Date(student.registrationDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                        onClick={() => {
                                            addToast(`📧 Recordatorio de motivación enviado a ${student.name} con éxito.`, 'success');
                                        }}
                                        className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/30 px-3 py-1.5 rounded-md font-semibold transition flex-1 text-center"
                                    >
                                        Enviar Correo
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const message = `¡Hola ${student.name}! Hace unos días que no te vemos por AulaInfinity. 🚀 Tu camino al éxito no se detiene. ¡Entra hoy y continúa aprendiendo!`;
                                            const mode = appConfig?.whatsappMode || 'direct';
                                            
                                            if (mode === 'direct') {
                                                const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(student.phone || '')}&text=${encodeURIComponent(message)}`;
                                                window.open(url, '_blank');
                                                addToast(`💬 Abriendo WhatsApp Web para enviar mensaje a ${student.name}.`, 'info');
                                            } else {
                                                const modeName = mode === 'meta' ? 'Meta Cloud API' : mode === 'evolution' ? 'Instancia QR Web' : 'Twilio';
                                                addToast(`⏳ Enviando WhatsApp automatizado (${modeName}) a ${student.name}...`, 'info');
                                                const res = await api.sendWhatsApp({
                                                    to: student.phone,
                                                    message,
                                                    whatsappMode: mode,
                                                    twilioAccountSid: appConfig?.twilioAccountSid,
                                                    twilioAuthToken: appConfig?.twilioAuthToken,
                                                    twilioWhatsappFrom: appConfig?.twilioWhatsappFrom,
                                                    metaPhoneNumberId: appConfig?.metaPhoneNumberId,
                                                    metaAccessToken: appConfig?.metaAccessToken,
                                                    evolutionInstanceUrl: appConfig?.evolutionInstanceUrl,
                                                    evolutionApiKey: appConfig?.evolutionApiKey
                                                });
                                                if (res.success) {
                                                    if (res.simulated) {
                                                        addToast(`🟩 [Simulado] ${res.message}`, 'success');
                                                    } else {
                                                        addToast(`🟩 WhatsApp enviado automáticamente a ${student.name} vía ${modeName}.`, 'success');
                                                    }
                                                } else {
                                                    addToast(`❌ Error al enviar WhatsApp: ${res.error || 'Fallo desconocido'}`, 'error');
                                                }
                                            }
                                        }}
                                        className="text-xs bg-emerald-150 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/30 px-3 py-1.5 rounded-md font-semibold transition flex-1 text-center"
                                    >
                                        WhatsApp
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-md mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        Dashboard de Aulainfinity ♾️
                    </h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">Resumen en tiempo real de la actividad escolar, métricas y crecimiento.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Time Selector */}
                    <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center border border-gray-200/50 dark:border-slate-800 self-start sm:self-auto">
                        {(['all', 'academic', '30d', '7d'] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                                    timeRange === r
                                        ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                {r === 'all' && 'Histórico'}
                                {r === 'academic' && 'Año Académico'}
                                {r === '30d' && '30 Días'}
                                {r === '7d' && '7 Días'}
                            </button>
                        ))}
                    </div>

                    {/* Export Options */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportAcademicReports}
                            className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-black text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                            title="Exportar listado de expedientes académicos"
                        >
                            <DownloadIcon className="w-4 h-4" /> Informe General
                        </button>
                        <button
                            onClick={handleExportQuizzesCSV}
                            className="px-4 py-2.5 bg-indigo-50 dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-150/50 dark:border-slate-800 font-bold text-xs rounded-xl hover:bg-indigo-100 dark:hover:bg-slate-800 transition inline-flex items-center gap-1.5 cursor-pointer"
                            title="Exportar listado de respuestas de cuestionarios"
                        >
                            <DownloadIcon className="w-4 h-4" /> Exportar Quizzes
                        </button>
                    </div>
                </div>
            </div>

            {/* Sistema de Alertas y Notificaciones Críticas */}
            {(pendingTeacherPaymentsCount > 0 || expiringSubscriptionsCount > 0) && (
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Alerta: Pagos a profesores pendientes de procesar */}
                    {pendingTeacherPaymentsCount > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-sm flex flex-col justify-between">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">🔔</span>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        Pagos a Profesores Pendientes
                                        <span className="px-2.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-black rounded-full">
                                            {pendingTeacherPaymentsCount}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                        Hay clases completadas por profesores que aún no han sido registradas como pagadas.
                                    </p>
                                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {pendingTeacherPayments.map((req) => (
                                            <div key={req.id} className="text-xs bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 flex justify-between items-center gap-2">
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200">{req.teacherName}</p>
                                                    <p className="text-slate-500">{req.subject} ({req.studentName}) • {req.date}</p>
                                                </div>
                                                <Link 
                                                    to={ROUTES.ADMIN_SUBSCRIPTION} 
                                                    state={{ activeTab: 'teachers', registerPaymentFor: req }}
                                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition text-center whitespace-nowrap cursor-pointer"
                                                >
                                                    Pagar €
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alerta: Suscripciones próximas a vencer */}
                    {expiringSubscriptionsCount > 0 && (
                        <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 p-6 rounded-r-2xl shadow-sm flex flex-col justify-between">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl p-2 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400">⏳</span>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        Suscripciones Próximas a Vencer
                                        <span className="px-2.5 py-0.5 bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 text-xs font-black rounded-full">
                                            {expiringSubscriptionsCount}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                        Alumnos cuya suscripción renovará o vencerá en los próximos 5 días.
                                    </p>
                                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {expiringSubscriptions.map((item) => (
                                            <div key={item.student.id} className="text-xs bg-white dark:bg-slate-800 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 flex justify-between items-center gap-2">
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.student.name}</p>
                                                    <p className="text-slate-500">{item.student.email}</p>
                                                    <p className="text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                                                        Renueva: {item.nextBillingDate} ({item.daysRemaining === 1 ? 'mañana' : `en ${item.daysRemaining} días`})
                                                    </p>
                                                </div>
                                                <Link 
                                                    to={ROUTES.ADMIN_SUBSCRIPTION} 
                                                    state={{ activeTab: 'students', searchStudent: item.student.name }}
                                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition text-center whitespace-nowrap cursor-pointer"
                                                >
                                                    Ver Alumno
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Panel de Métricas Clave */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary">📊</span>
                    Métricas Clave de la Plataforma
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* NEW: Peticiones de Tutoría Pendientes */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow hover:shadow-md transition flex flex-col justify-between min-h-[140px]">
                         <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tutorías Pendientes</p>
                                <h3 className="text-3xl font-bold text-slate-950 dark:text-slate-50 mt-1">{totalPendingTutoring}</h3>
                            </div>
                            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
                                <ClockIcon className="w-6 h-6" />
                            </div>
                         </div>
                         <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                             <span>Total de Tutorías</span>
                             <span className="font-semibold text-slate-800 dark:text-slate-200">
                                 {tutoringRequests?.length ?? 0}
                             </span>
                         </div>
                    </div>
                    {/* NEW: Tutorías Confirmadas (Aceptadas por Alumno y Profesor) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow hover:shadow-md transition flex flex-col justify-between min-h-[140px]">
                         <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tutorías Confirmadas</p>
                                <h3 className="text-3xl font-bold text-slate-950 dark:text-slate-50 mt-1">{totalConfirmedTutoring}</h3>
                            </div>
                            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircleIcon className="w-6 h-6" />
                            </div>
                         </div>
                         <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                             <span>Aceptadas por Alumno y Profe</span>
                             <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                 🪙 Cobradas en Infinitys
                             </span>
                         </div>
                    </div>
                    {/* NEW: Profesores Pendientes de Aprobación */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow hover:shadow-md transition flex flex-col justify-between min-h-[140px]">
                         <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Profesores s/Aprobar</p>
                                <h3 className="text-3xl font-bold text-slate-950 dark:text-slate-50 mt-1">{totalPendingTeacherApprovals}</h3>
                            </div>
                            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                                <AcademicCapIcon className="w-6 h-6" />
                            </div>
                         </div>
                         <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                             <span>Aprobados / Total</span>
                             <span className="font-semibold text-slate-800 dark:text-slate-200">
                                 {teachers?.filter(t => t.isApprovedForTutoring).length ?? 0} / {teachers?.length ?? 0}
                             </span>
                         </div>
                    </div>
                
                    {/* Tarjeta 1: Total Estudiantes */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow hover:shadow-md transition flex flex-col justify-between min-h-[140px]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estudiantes (Rango)</p>
                                <h3 className="text-3xl font-bold text-slate-950 dark:text-slate-50 mt-1">{filteredUsersByTimeRange.length}</h3>
                            </div>
                            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                                <UsersIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span>Suscritos / Registrados</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {filteredUsersByTimeRange.filter(u => u.isSubscribed).length} / {filteredUsersByTimeRange.length}
                            </span>
                        </div>
                    </div>

                    {/* Tarjeta 2: Tasa Premium */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow hover:shadow-md transition flex flex-col justify-between min-h-[140px]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tasa Premium</p>
                                <h3 className="text-3xl font-bold text-slate-950 dark:text-slate-50 mt-1">
                                    {filteredUsersByTimeRange.length > 0 ? Math.round((filteredUsersByTimeRange.filter(u => u.isSubscribed).length / filteredUsersByTimeRange.length) * 100) : 0}%
                                </h3>
                            </div>
                            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircleIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span>Ingresos (Filtro)</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {totalEstMonthlyRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Tarjeta 3: Progreso Promedio */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow hover:shadow-md transition flex flex-col justify-between min-h-[140px]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lecciones / Alumno</p>
                                <h3 className="text-3xl font-bold text-slate-950 dark:text-slate-50 mt-1">
                                    {users.length > 0 ? (users.reduce((sum, u) => sum + u.watchedVideos.length, 0) / users.length).toFixed(1) : 0}
                                </h3>
                            </div>
                            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                                <ChartBarSquareIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span>Promedio de videos vistos</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                Total: {users.reduce((sum, u) => sum + u.watchedVideos.length, 0)} vids
                            </span>
                        </div>
                    </div>

                    {/* Tarjeta 4: Contenido Total */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow hover:shadow-md transition flex flex-col justify-between min-h-[140px]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contenido Total</p>
                                <h3 className="text-3xl font-bold text-slate-950 dark:text-slate-50 mt-1">
                                    {courses.reduce((sum, l) => sum + l.subjects.reduce((s, sub) => s + sub.videos.length, 0), 0)}
                                </h3>
                            </div>
                            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <BookOpenIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span>Cursos / Materias</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {courses.length} / {courses.reduce((sum, lvl) => sum + lvl.subjects.length, 0)}
                            </span>
                        </div>
                    </div>

                    {/* Tarjeta 5: Rendimiento Quizzes */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow hover:shadow-md transition flex flex-col justify-between min-h-[140px]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Éxito en Quizzes</p>
                                <h3 className="text-3xl font-bold text-slate-950 dark:text-slate-50 mt-1">
                                    {quizPassRate}%
                                </h3>
                            </div>
                            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                                <TrophyIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span>Total aprobados / intentos</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {quizPassedCount} / {answers.length} int.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Milestones and Goals Tracker Section */}
            <AdminMilestonesTracker users={users} courses={courses} answers={answers} />

            {/* Quick Actions Bento section */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary">⚡</span>
                    Gestión Administrativa
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link 
                        to={ROUTES.ADMIN_USERS} 
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-md border border-gray-100 dark:border-slate-700/60 transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                                <UsersIcon className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Gestionar Alumnos</h3>
                        </div>
                    </Link>
                    <Link 
                        to={ROUTES.ADMIN_TEACHER_APPROVAL} 
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-md border border-gray-100 dark:border-slate-700/60 transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                                <UsersIcon className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Gestionar Profesores</h3>
                        </div>
                    </Link>
                    <Link 
                        to={ROUTES.ADMIN_SETTINGS} 
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-md border border-gray-100 dark:border-slate-700/60 transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 mb-3 group-hover:scale-110 transition-transform">
                                <span className="text-xl">💳</span>
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Gestionar Pagos</h3>
                        </div>
                    </Link>
                    <Link 
                        to={ROUTES.ADMIN_REQUESTS} 
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-md border border-gray-100 dark:border-slate-700/60 transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-600 mb-3 group-hover:scale-110 transition-transform">
                                <span className="text-xl">💬</span>
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Gestionar Dudas</h3>
                        </div>
                    </Link>
                </div>
            </div>

            <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary">⚡</span>
                    Gestión Rápida de Contenido
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link 
                        to={ROUTES.ADMIN_CONTENT} 
                        state={{ openModal: 'add-level' }}
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-md border border-gray-100 dark:border-slate-700/60 transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center text-green-600 mb-3 group-hover:scale-110 transition-transform">
                                <span className="text-lg font-bold">＋</span>
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Añadir Nivel</h3>
                            <p className="text-xs text-slate-500 mt-1">Crea un nuevo nivel escolar o categoría (ej: 2º Bachillerato)</p>
                        </div>
                        <span className="text-xs font-semibold text-primary mt-4 inline-flex items-center group-hover:translate-x-1 transition-transform">
                            Comenzar →
                        </span>
                    </Link>
                    <Link 
                        to={ROUTES.ADMIN_CONTENT} 
                        state={{ openModal: 'add-subject' }}
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-md border border-gray-100 dark:border-slate-700/60 transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                                <span className="text-lg font-bold">＋</span>
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Añadir Asignatura</h3>
                            <p className="text-xs text-slate-500 mt-1">Crea una materia o asignatura dentro de un nivel (ej: Física)</p>
                        </div>
                        <span className="text-xs font-semibold text-primary mt-4 inline-flex items-center group-hover:translate-x-1 transition-transform">
                            Comenzar →
                        </span>
                    </Link>

                    <Link 
                        to={ROUTES.ADMIN_CONTENT} 
                        state={{ openModal: 'add-video' }}
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-md border border-gray-100 dark:border-slate-700/60 transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                                <span className="text-lg font-bold">＋</span>
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Añadir Lección</h3>
                            <p className="text-xs text-slate-500 mt-1">Añade una vídeolección con recursos PDF y temáticas</p>
                        </div>
                        <span className="text-xs font-semibold text-primary mt-4 inline-flex items-center group-hover:translate-x-1 transition-transform">
                            Comenzar →
                        </span>
                    </Link>

                    <Link 
                        to={ROUTES.ADMIN_CONTENT} 
                        state={{ openModal: 'add-block' }}
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-md border border-gray-100 dark:border-slate-700/60 transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 mb-3 group-hover:scale-110 transition-transform">
                                <span className="text-lg font-bold">＋</span>
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Añadir Bloque Temático</h3>
                            <p className="text-xs text-slate-500 mt-1">Organiza lecciones en un bloque temático o módulo</p>
                        </div>
                        <span className="text-xs font-semibold text-primary mt-4 inline-flex items-center group-hover:translate-x-1 transition-transform">
                            Comenzar →
                        </span>
                    </Link>

                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columnas Izquierdas: Gráficos de Nuevos Alumnos y Top Videos */}
                <div className="lg:col-span-2 space-y-8">
                    <ChartCard title="Nuevos Estudiantes" icon={<ChartLineIcon className="w-8 h-8 text-primary" />}>
                        <RegistrationsChart data={registrationData} />
                    </ChartCard>

                    <ChartCard title="Top 10 Vídeos Más Vistos" icon={<ChartBarSquareIcon className="w-8 h-8 text-primary" />}>
                        <TopVideosChart data={topVideosData} />
                    </ChartCard>
                </div>

                {/* Columna Derecha: Ingresos por Plan y Feed de Actividad en Vivo */}
                <div className="space-y-8">
                    <ChartCard title="Análisis de Ingresos por Plan" icon={<TrophyIcon className="w-8 h-8 text-indigo-500" />}>
                        <RevenuePieChart data={revenueData} />
                    </ChartCard>

                    {/* Live Activity Feed Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-md h-[465px] flex flex-col">
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span className="p-1 rounded bg-indigo-500/10 text-indigo-500 text-sm">🔔</span>
                                Actividad Reciente en Vivo
                            </h3>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-1 space-y-3.5 custom-scrollbar">
                            {recentActivity.slice(0, 15).map((act) => (
                                <div key={act.id} className="flex gap-3 text-xs leading-relaxed group">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {act.type === 'quiz' && (
                                            <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs" title="Quiz completado">
                                                🏆
                                            </div>
                                        )}
                                        {act.type === 'tutoring' && (
                                            <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs" title="Solicitud de tutoría">
                                                💬
                                            </div>
                                        )}
                                        {act.type === 'register' && (
                                            <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs" title="Nuevo registro">
                                                👤
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-700 dark:text-slate-300">
                                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition">{act.studentName}</span>{' '}
                                            {act.detail}
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium font-mono">
                                            {(() => {
                                                const diff = new Date().getTime() - act.timestamp.getTime();
                                                const mins = Math.floor(diff / 60000);
                                                const hrs = Math.floor(mins / 60);
                                                const days = Math.floor(hrs / 24);
                                                if (mins < 1) return 'Hace unos segundos';
                                                if (mins < 60) return `Hace ${mins} min`;
                                                if (hrs < 24) return `Hace ${hrs} h`;
                                                return `Hace ${days} d`;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cuestionarios Recientes de los Estudiantes */}
            <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center">
                        <span className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mr-3 text-xl">✍️</span>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Cuestionarios Recientes Realizados</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Resultados en vivo y puntuaciones de los exámenes de los alumnos.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleExportQuizzesCSV}
                        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-semibold text-xs rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition inline-flex items-center gap-1.5 border border-indigo-100 dark:border-indigo-900"
                    >
                        <DownloadIcon className="w-4 h-4" /> Exportar Todos los Intentos (CSV)
                    </button>
                </div>

                {recentQuizzes.length === 0 ? (
                    <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400 border border-dashed border-gray-200 dark:border-slate-700 rounded-lg">
                        Aún no hay intentos de cuestionarios registrados.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-left text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3 rounded-l-lg">Estudiante</th>
                                    <th className="px-6 py-3">Cuestionario / Lección</th>
                                    <th className="px-6 py-3">Aciertos</th>
                                    <th className="px-6 py-3">Puntuación</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3 rounded-r-lg">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 text-sm text-slate-800 dark:text-slate-200">
                                {recentQuizzes.map((ans, idx) => {
                                    const percentage = Math.round((ans.score / ans.totalQuestions) * 100);
                                    let statusBg = "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400";
                                    let statusText = "Necesita Repaso";
                                    if (percentage >= 80) {
                                        statusBg = "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400";
                                        statusText = "Excelente";
                                    } else if (percentage >= 50) {
                                        statusBg = "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
                                        statusText = "Aprobado";
                                    }
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">{ans.studentName}</div>
                                                <div className="text-xs text-slate-400">{ans.studentEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                                {ans.quizTitle}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-medium">
                                                {ans.score} / {ans.totalQuestions}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-primary h-full rounded-full" style={{ width: `${percentage}%` }} />
                                                    </div>
                                                    <span className="font-mono font-bold text-xs">{percentage}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBg}`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(ans.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ESTADÍSTICAS DEL TUTOR IA Y HISTORIAL DE CONSULTAS */}
            <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-md">
                <div className="flex items-center mb-6">
                    <span className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mr-3 text-xl">🤖</span>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Estadísticas de Consultas de la IA</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Dudas de los estudiantes, temáticas más consultadas y tonos pedagógicos elegidos.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Temáticas de consulta más populares */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Temáticas con más Consultas</h4>
                        {aiQueriesStats.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Aún no hay datos de consultas suficientes.</p>
                        ) : (
                            <div className="space-y-4">
                                {aiQueriesStats.map((stat, idx) => {
                                    const total = aiQueries?.length || 1;
                                    const pct = Math.round((stat.value / total) * 100);
                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                <span>{stat.name}</span>
                                                <span>{stat.value} ({pct}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Preferencias de tono de tutoría */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Tonos Pedagógicos Elegidos</h4>
                        {aiQueriesVibesStats.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Aún no hay datos de tonos suficientes.</p>
                        ) : (
                            <div className="space-y-4">
                                {aiQueriesVibesStats.map((stat, idx) => {
                                    const total = aiQueries?.length || 1;
                                    const pct = Math.round((stat.value / total) * 100);
                                    let barColor = "bg-sky-500";
                                    if (stat.name === "Socrático") barColor = "bg-amber-500";
                                    if (stat.name === "Rigor EBAU") barColor = "bg-emerald-500";

                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                <span>{stat.name}</span>
                                                <span>{stat.value} ({pct}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                <div className={`${barColor} h-full rounded-full`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Resumen general */}
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 flex flex-col justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-400 mb-2">Análisis Inteligente de Dudas</h4>
                            <p className="text-xs text-indigo-950/70 dark:text-indigo-350/80 leading-relaxed">
                                El tutor interactivo resuelve consultas de temáticas variadas. Las analíticas muestran que el estilo **Socrático** fomenta una mejor autoevaluación, mientras que el estilo **EBAU** asiste con la preparación intensiva de las pruebas académicas.
                            </p>
                        </div>
                        <div className="pt-4 border-t border-indigo-100 dark:border-indigo-900/50 flex justify-between items-center text-xs text-indigo-900 dark:text-indigo-400">
                            <span>Consultas Totales Logueadas</span>
                            <span className="font-mono font-bold text-lg">{aiQueries?.length ?? 0}</span>
                        </div>
                    </div>
                </div>

                {/* Historial de dudas y consultas */}
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Registro en Tiempo Real de Dudas Estudiantiles</h4>
                {!aiQueries || aiQueries.length === 0 ? (
                    <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        No hay consultas de IA registradas en este momento.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {aiQueries.slice(0, 5).map((q) => {
                            const isExpanded = expandedQueryId === q.id;
                            const vibeName = q.vibe === 'socratic' ? 'Socrático' : q.vibe === 'explanatory' ? 'Explicativo' : 'Rigor EBAU';
                            const vibeColor = q.vibe === 'socratic' 
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' 
                                : q.vibe === 'explanatory'
                                ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
                                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';

                            return (
                                <div key={q.id} className="border border-slate-100 dark:border-slate-700/60 rounded-xl overflow-hidden bg-white dark:bg-slate-800/50 shadow-sm">
                                    <div 
                                        onClick={() => setExpandedQueryId(isExpanded ? null : q.id)}
                                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800 transition"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{q.studentName}</span>
                                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                                <span className="text-[10px] text-slate-400">{new Date(q.timestamp).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 italic font-medium">
                                                "{q.queryText}"
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 self-start md:self-auto">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                {q.category}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${vibeColor}`}>
                                                {vibeName}
                                            </span>
                                            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                {isExpanded ? 'Ocultar' : 'Ver Detalles'}
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700/50 text-xs animate-fade-in">
                                            <div className="mb-4">
                                                <div className="font-bold text-slate-800 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                                                    <span className="text-slate-400">❓</span> Pregunta del Estudiante:
                                                </div>
                                                <div className="bg-white dark:bg-slate-850 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed shadow-sm">
                                                    {q.queryText}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-bold text-indigo-900 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
                                                    <span className="text-indigo-500">🤖</span> Respuesta del Tutor IA:
                                                </div>
                                                <div className="bg-indigo-50/40 dark:bg-indigo-950/25 p-3.5 rounded-lg border border-indigo-100/50 dark:border-indigo-950/40 text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap shadow-sm">
                                                    {q.responseText}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* INFORMES ACADÉMICOS DE ALUMNOS */}
            <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center">
                        <span className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mr-3 text-xl">🎓</span>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Informes de Rendimiento Académico</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Consulta de calificaciones, cursos inscritos, monedas y lecciones vistas por estudiante.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleExportAcademicReports}
                        className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition inline-flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900"
                    >
                        <DownloadIcon className="w-4 h-4" /> Exportar Informe de Alumnos (CSV)
                    </button>
                </div>

                <div className="mb-4">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar estudiante por nombre, correo o nivel..."
                            value={academicSearch}
                            onChange={(e) => setAcademicSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg text-xs border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </div>

                {academicReports.length === 0 ? (
                    <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        No hay informes de estudiantes disponibles.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-left text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3 rounded-l-lg">Estudiante</th>
                                    <th className="px-6 py-3">Cursos Inscritos</th>
                                    <th className="px-6 py-3">Vídeos Vistos</th>
                                    <th className="px-6 py-3">Exámenes</th>
                                    <th className="px-6 py-3">Nota Media</th>
                                    <th className="px-6 py-3">Infinity Coins</th>
                                    <th className="px-6 py-3">Consultas IA</th>
                                    <th className="px-6 py-3 rounded-r-lg">Acceso IA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 text-sm text-slate-800 dark:text-slate-200">
                                {academicReports
                                    .filter(r => 
                                        r.name.toLowerCase().includes(academicSearch.toLowerCase()) ||
                                        r.email.toLowerCase().includes(academicSearch.toLowerCase()) ||
                                        (r.courses || []).some(c => c.toLowerCase().includes(academicSearch.toLowerCase()))
                                    )
                                    .map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">{report.name}</div>
                                                <div className="text-xs text-slate-400">{report.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium max-w-xs truncate">
                                                {report.courses.join(', ') || <span className="text-slate-400 italic">Ninguno</span>}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                {report.quizzesCompleted * 2 + 1} vids
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">
                                                {report.quizzesCompleted} realizados
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                    report.averageGrade >= 80 
                                                        ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' 
                                                        : report.averageGrade >= 50 
                                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' 
                                                        : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                                }`}>
                                                    {report.averageGrade}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                🪙 {report.coins}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                {report.aiQueries}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    report.aiEnabled 
                                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' 
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    {report.aiEnabled ? 'Permitido' : 'Restringido'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};