import React, { useEffect, useMemo, useState, useContext, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { marked } from 'marked';
import { createPortal } from 'react-dom';
// FIX: Corrected import path.
import * as api from '../services/api';
import { findSubjectAndVideoById } from '../data/database';
// FIX: Corrected import path.
import type { Video, Comment as CommentType, StudentUser, CourseLevel, Subject, YouTubeLink } from '../types';

import { StudentProgressContext } from '../contexts/StudentProgressContext';
import { AuthContext } from '../contexts/AuthContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { AppConfigContext } from '../contexts/AppConfigContext';

import { SubscriptionGate } from './SubscriptionGate';
import { isTeacherCourseAssigned, isTeacherSubjectAssigned } from '../utils/teacherPermissions';
import { FREE_VIDEO_IDS } from '../constants/content';
// FIX: Corrected import path.
import { ROUTES, generateCourseLevelPath, generateVideoPath } from '../constants/routes';
import { QuizPlayer } from './QuizPlayer';

import {
    ChevronLeftIcon,
    ChevronRightIcon,
    DocumentDownloadIcon,
    SparklesIcon,
    LightBulbIcon,
    PaperAirplaneIcon,
    QuestionMarkCircleIcon,
    PlayIcon,
    CheckCircleIcon,
    ExternalLinkIcon,
    CloseIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    ChatBubbleLeftRightIcon,
    VideoCameraIcon,
    PencilIcon,
    LockClosedIcon,
} from './icons';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { EmptyState } from './ui/EmptyState';
import { useI18n } from '../hooks/useI18n';

// --- HELPER & UTILITY COMPONENTS ---

const MarkdownContent: React.FC<{ content: string }> = React.memo(({ content }) => {
    const html = marked.parse(content, { gfm: true, breaks: true }) as any;
    return <div className="prose dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2" dangerouslySetInnerHTML={{ __html: html }} />;
});

// --- NEW: MODAL FOR AI SUMMARY ---

const SummaryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    summary: string;
    videoTitle: string;
}> = ({ isOpen, onClose, summary, videoTitle }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-slate-800 shadow-2xl w-full flex flex-col transition-all duration-300 ${isFullscreen ? 'h-full w-full rounded-none' : 'max-w-3xl rounded-xl'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center"><LightBulbIcon className="w-6 h-6 mr-2 text-primary"/>Resumen con IA</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Para el vídeo: {videoTitle}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setIsFullscreen(!isFullscreen)} 
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                        >
                            {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                           <CloseIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>
                </div>
                <div className={`p-6 flex-1 overflow-y-auto ${isFullscreen ? '' : 'max-h-[70vh]'}`}>
                    {summary ? (
                         <MarkdownContent content={summary} />
                    ) : (
                        <div className="text-center text-slate-500">
                            <p>No hay resumen disponible. Genéralo primero desde la página del vídeo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PracticeQuestionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    video: Video;
    levelId: string;
    subjectId: string;
}> = ({ isOpen, onClose, video, levelId, subjectId }) => {
    const { t } = useI18n();
    const [question, setQuestion] = useState<string | null>(null);
    const [answer, setAnswer] = useState<string | null>(null);
    const [isQuestionLoading, setIsQuestionLoading] = useState(false);
    const [isAnswerLoading, setIsAnswerLoading] = useState(false);
    const [difficulty, setDifficulty] = useState<'fácil' | 'medio' | 'difícil'>('medio');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleGenerateQuestion = async () => {
        setIsQuestionLoading(true);
        setQuestion(null);
        setAnswer(null);
        try {
            const result = await api.generatePracticeQuestionWithAI(video.topic, difficulty, levelId, subjectId);
            setQuestion(result.question);
        } catch (error) {
            setQuestion(t('videoPage.errorSummary'));
        } finally {
            setIsQuestionLoading(false);
        }
    };

    const handleGenerateAnswer = async () => {
        if (!question) return;
        setIsAnswerLoading(true);
        try {
            const result = await api.generatePracticeAnswerWithAI(question, video.topic, levelId, subjectId);
            setAnswer(result.answer);
        } catch (error) {
            setAnswer(t('videoPage.errorSummary'));
        } finally {
            setIsAnswerLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-slate-800 shadow-2xl w-full flex flex-col transition-all duration-300 ${isFullscreen ? 'h-full w-full rounded-none' : 'max-w-3xl rounded-xl'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center"><QuestionMarkCircleIcon className="w-6 h-6 mr-2 text-primary"/>{t('videoPage.testYourKnowledge')}</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('videoPage.forVideo', { title: video.title })}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setIsFullscreen(!isFullscreen)} 
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                        >
                            {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                           <CloseIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className={`p-6 flex-1 overflow-y-auto ${isFullscreen ? '' : 'max-h-[70vh]'}`}>
                    <div className="flex justify-center my-4 space-x-2">
                        {(['fácil', 'medio', 'difícil'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                    difficulty === level
                                        ? 'bg-primary text-white shadow'
                                        : 'bg-gray-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600'
                                }`}
                            >
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[8rem] p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-center">
                        {isQuestionLoading ? (
                            <Spinner className="text-primary"/>
                        ) : question ? (
                            <div className="w-full">
                                <MarkdownContent content={question} />
                            </div>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400 text-center">{t('videoPage.selectDifficulty')}</p>
                        )}
                    </div>

                    {question && !answer && (
                        <div className="mt-4 text-center">
                            <Button onClick={handleGenerateAnswer} isLoading={isAnswerLoading} variant="secondary">
                                {isAnswerLoading ? t('videoPage.revealing') : t('videoPage.revealSolution')}
                            </Button>
                        </div>
                    )}
                    
                    {answer && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/40 border-l-4 border-blue-400 rounded-r-lg animate-fade-in">
                            <h4 className="font-bold text-blue-800 dark:text-blue-300">{t('videoPage.solution')}</h4>
                            <div className="mt-1 text-blue-700 dark:text-blue-300">
                                <MarkdownContent content={answer} />
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleGenerateQuestion}
                        isLoading={isQuestionLoading}
                        className="w-full mt-6"
                    >
                        {question ? t('videoPage.generateAnotherQuestion') : t('videoPage.generateQuestion')}
                    </Button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN PAGE SECTIONS ---

const VideoPlayer: React.FC<{ youtubeId?: string, videoUrl?: string, videoTitle: string }> = React.memo(({ youtubeId, videoUrl, videoTitle }) => {
    if (videoUrl) {
        return (
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl h-full w-full flex items-center justify-center relative">
                <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                >
                    Tu navegador no soporta el formato de vídeo.
                </video>
            </div>
        );
    }

    if (!youtubeId || youtubeId.trim() === '') {
        return (
            <div className="aspect-video bg-slate-900 text-slate-400 rounded-xl overflow-hidden shadow-2xl h-full w-full flex flex-col items-center justify-center p-6 text-center">
                <svg className="w-12 h-12 mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="font-bold text-slate-300">Vídeo no disponible</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">Esta clase no dispone actualmente de un archivo en Firebase Storage o enlace de YouTube asignado.</p>
            </div>
        );
    }

    const id = youtubeId || '';
    const isPlaylist = id.includes('list=');
    const embedUrl = isPlaylist 
        ? `https://www.youtube.com/embed/videoseries?list=${id.split('list=')[1]}`
        : `https://www.youtube.com/embed/${id}`;

    return (
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl h-full w-full">
            <iframe
                width="100%"
                height="100%"
                src={embedUrl}
                title={videoTitle}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        </div>
    );
});

const VideoHeader: React.FC<{ video: Video; levelName: string; levelId: string; }> = React.memo(({ video, levelName, levelId }) => (
    <div>
        <nav className="flex items-center text-sm text-slate-600 dark:text-slate-400 mb-2">
            <Link to={ROUTES.DASHBOARD} className="hover:text-primary">Dashboard</Link>
            <ChevronRightIcon className="w-4 h-4 mx-1" />
            <Link to={generateCourseLevelPath(levelId)} className="hover:text-primary" title={levelName}>{levelName}</Link>
            <ChevronRightIcon className="w-4 h-4 mx-1" />
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={video.title}>{video.title}</span>
        </nav>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">{video.title}</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">{video.description}</p>
    </div>
));

const VideoResources: React.FC<{ video: Video }> = React.memo(({ video }) => {
    if (!video.resources || video.resources.length === 0) return null;
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">Recursos Adicionales</h3>
            <ul className="space-y-3">
                {video.resources.map((res, index) => (
                    <li key={index}>
                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
                            <DocumentDownloadIcon className="w-6 h-6 text-primary flex-shrink-0" />
                            <span className="ml-3 text-slate-600 dark:text-slate-300 group-hover:underline">{res.name}</span>
                            <ExternalLinkIcon className="w-4 h-4 text-slate-400 ml-auto opacity-50"/>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
});

const CommentsSection: React.FC<{ videoId: string }> = React.memo(({ videoId }) => {
    const { user } = useContext(AuthContext);
    const { addToast } = useContext(NotificationContext);
    const queryClient = useQueryClient();
    const [newComment, setNewComment] = useState('');
    const parentRef = useRef<HTMLDivElement>(null);

    const { data: comments, isLoading } = useQuery<CommentType[]>({
        queryKey: ['comments', videoId],
        queryFn: () => api.fetchComments(videoId),
    });

    const mutation = useMutation({
        mutationFn: (text: string) => api.postComment(videoId, { author: { id: (user as any).id, name: (user as any).name }, text }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
            setNewComment('');
            addToast('Comentario publicado', 'success');
        },
        onError: () => {
            addToast('Error al publicar el comentario', 'error');
        }
    });
    
    const rowVirtualizer = useVirtualizer({
        count: comments?.length ?? 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 76,
        overscan: 5,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() && user) {
            mutation.mutate(newComment.trim());
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mt-8">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">{comments?.length ?? 0} Comentarios</h3>
            
            {user && (
                <form onSubmit={handleSubmit} className="flex items-start gap-4 mb-8">
                     <img
                        loading="lazy"
                        width="40"
                        height="40"
                        className="h-10 w-10 rounded-full object-cover bg-gray-200"
                        src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.role === 'student' ? user.name : 'Admin'}`}
                        alt="Tu avatar"
                    />
                    <div className="flex-1">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Añade un comentario..."
                            className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            rows={2}
                        />
                        <button type="submit" disabled={!newComment.trim() || mutation.isPending} className="mt-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:bg-primary/50">
                            {mutation.isPending ? 'Publicando...' : 'Publicar'}
                        </button>
                    </div>
                </form>
            )}
            
            <div ref={parentRef} className="max-h-[500px] overflow-y-auto pr-2">
                {isLoading ? (
                    <p>Cargando comentarios...</p>
                ) : comments && comments.length > 0 ? (
                     <div
                        className="w-full relative"
                        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                    >
                        {rowVirtualizer.getVirtualItems().map(virtualRow => {
                            const comment = comments[virtualRow.index];
                            return (
                                <div
                                    key={comment.id}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    className="py-2"
                                >
                                     <div className="flex items-start gap-4">
                                        <img
                                            loading="lazy"
                                            width="40"
                                            height="40"
                                            className="h-10 w-10 rounded-full object-cover bg-gray-200"
                                            src={`https://api.dicebear.com/8.x/initials/svg?seed=${comment.author.name}`}
                                            alt={`Avatar de ${comment.author.name}`}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <p className="font-bold text-slate-900 dark:text-slate-100">{comment.author.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(comment.timestamp).toLocaleString()}</p>
                                            </div>
                                            <p className="mt-1 text-slate-600 dark:text-slate-300">{comment.text}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon={<ChatBubbleLeftRightIcon />}
                        title="Sé el primero en comentar"
                        description="No hay comentarios todavía. ¡Tu opinión es importante!"
                        size="small"
                    />
                )}
            </div>
        </div>
    );
});

const YouTubeLinksList: React.FC<{
    links: YouTubeLink[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    isFullScreen: boolean;
}> = ({ links, selectedIndex, onSelect, isFullScreen }) => {
    const baseClasses = 'w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors';
    const selectedClasses = isFullScreen ? 'bg-primary/20 text-white' : 'bg-primary/10 text-primary';
    const unselectedClasses = isFullScreen ? 'text-slate-300 hover:bg-white/10' : 'text-slate-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700';

    return (
        <ul className="space-y-2 flex-1 overflow-y-auto">
            {links.map((link, index) => (
                <li key={index}>
                    <button
                        onClick={() => onSelect(index)}
                        className={`${baseClasses} ${selectedIndex === index ? selectedClasses : unselectedClasses}`}
                    >
                        <PlayIcon className={`w-6 h-6 mt-0.5 flex-shrink-0 ${selectedIndex === index ? 'text-primary' : 'text-slate-400'}`} />
                        <span className="font-semibold">{link.title}</span>
                    </button>
                </li>
            ))}
        </ul>
    );
};


// --- MAIN VIDEO PAGE COMPONENT ---
export const VideoPage: React.FC = () => {
    const { videoId } = useParams<{ videoId: string }>();
    const { markVideoAsWatched } = useContext(StudentProgressContext);
    const { user } = useContext(AuthContext);
    const { appConfig } = useContext(AppConfigContext);
    const navigate = useNavigate();
    const location = useLocation();
    const handleBack = useBackNavigation();
    const { t } = useI18n();
    
    const isVideosAllowed = user?.role === 'admin' || ((appConfig?.videosEnabled !== false) && ((user as any)?.videosEnabled !== false));
    const isAiAllowed = user?.role === 'admin' || ((appConfig?.aiEnabled !== false) && ((user as any)?.aiEnabled !== false));
    
    const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // AI States
    const [summary, setSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
    
    const { data: courses, isLoading: coursesLoading } = useQuery<CourseLevel[]>({
        queryKey: ['courses'],
        queryFn: api.fetchCourses
    });
    
    useEffect(() => {
        if (videoId) {
            markVideoAsWatched(videoId);
        }
    }, [videoId, markVideoAsWatched]);

    const videoData = useMemo(() => {
        if (!videoId || !courses) return null;
        return findSubjectAndVideoById(videoId, courses);
    }, [videoId, courses]);
    
    useEffect(() => {
        // Reset selected video when navigating to a new lesson page
        setSelectedLinkIndex(0);
    }, [videoId]);

    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isFullscreen]);


    const handleGenerateSummary = useCallback(async () => {
        if (!videoData) return;
        setIsSummaryLoading(true);
        try {
            const result = await api.summarizeTopicWithAI(videoData.video.title, videoData.video.description);
            setSummary(result);
        } catch (error) {
            setSummary("Error al generar el resumen. Inténtalo de nuevo.");
        } finally {
            setIsSummaryLoading(false);
        }
    }, [videoData]);

    const handleAskTutor = useCallback(() => {
        if (!videoData) return;
        navigate(ROUTES.TUTOR_IA, {
            state: {
                topic: videoData.video.topic,
                videoTitle: videoData.video.title
            }
        });
    }, [navigate, videoData]);

    const handleChatWithClassmates = useCallback(() => {
        if (!videoData) return;
        navigate(ROUTES.STUDENT_CHAT, {
            state: {
                activeConvoId: videoData.level.id,
                activeChatType: 'group'
            }
        });
    }, [navigate, videoData]);

    if (coursesLoading) {
        return <div className="text-center p-8">{t('videoPage.loadingVideo')}</div>;
    }

    if (!videoData) {
        return <div className="text-center p-8">{t('videoPage.videoNotFound')}</div>;
    }

    if (!isVideosAllowed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white dark:bg-slate-800 rounded-xl shadow-lg border dark:border-slate-700 max-w-xl mx-auto my-8 animate-fade-in">
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-full text-red-600 dark:text-red-400 mb-4">
                    <VideoCameraIcon className="w-12 h-12 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 italic mb-2">{t('videoPage.videosDisabledTitle')}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
                    {t('videoPage.suspendedAccess')}
                </p>
                <button
                    onClick={() => navigate(ROUTES.DASHBOARD)}
                    className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition cursor-pointer"
                >
                    {t('dashboard.backToPanel')}
                </button>
            </div>
        );
    }

    const { video, level, subject } = videoData;

    if (user?.role === 'teacher') {
        const hasCourseAccess = isTeacherCourseAssigned(user, level.id, level.name);
        const hasSubjectAccess = isTeacherSubjectAssigned(user, subject.id, subject.name);

        if (!hasCourseAccess || !hasSubjectAccess) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-red-200 dark:border-red-900/40 max-w-xl mx-auto my-8 animate-fade-in">
                    <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-full text-red-600 dark:text-red-400 mb-4">
                        <LockClosedIcon className="w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">{t('coursePage.accessDenied')}</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
                        {!hasCourseAccess
                            ? <>{t('coursePage.noCourseAssignedDesc', { courseName: level.name })}</>
                            : <>{t('coursePage.noSubjectAssignedDesc', { subjectName: subject.name })}</>
                        } {t('videoPage.teacherSubjectAccess')}
                    </p>
                    <button
                        onClick={() => navigate(ROUTES.DASHBOARD)}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-md"
                    >
                        {t('dashboard.backToPanel')}
                    </button>
                </div>
            );
        }
    }
    const isFree = FREE_VIDEO_IDS.includes(video.id);
    
    const currentLink = video.youtubeLinks?.[selectedLinkIndex] || { youtubeId: '', title: video.title };

    return (
        <SubscriptionGate isFreeContent={isFree}>
              {isFullscreen && createPortal(
                <div className="fixed inset-0 z-50 bg-black flex flex-col lg:flex-row gap-4 p-4 animate-fade-in">
                    <div className="relative flex-1">
                        <VideoPlayer youtubeId={currentLink.youtubeId} videoUrl={currentLink.videoUrl} videoTitle={currentLink.title} />
                    </div>
                    <div className="w-full lg:w-80 bg-slate-900 p-4 rounded-xl flex flex-col flex-shrink-0">
                        <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white">{t('videoPage.lessonParts')}</h3>
                            <button
                                onClick={() => setIsFullscreen(false)}
                                className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                                title="Salir de pantalla completa"
                                aria-label="Salir de pantalla completa"
                            >
                                <ArrowsPointingInIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <YouTubeLinksList links={video.youtubeLinks} selectedIndex={selectedLinkIndex} onSelect={setSelectedLinkIndex} isFullScreen={true} />
                    </div>
                </div>,
                document.body
            )}
            <div className="animate-slide-in-up">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <button onClick={handleBack} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200">
                        <ChevronLeftIcon className="w-5 h-5 mr-2" />{t('common.goBack')}
                    </button>
                    {isVideosAllowed && (user?.role === 'admin' || user?.role === 'teacher') && (
                        <button
                            onClick={() => navigate(user?.role === 'teacher' ? ROUTES.TEACHER_CONTENT : ROUTES.ADMIN_CONTENT, {
                                state: {
                                    openModal: 'edit-video',
                                    levelId: level.id,
                                    subjectId: subject.id,
                                    videoId: video.id
                                }
                            })}
                            className="flex items-center px-4 py-2 bg-primary/10 text-primary border border-primary/30 font-semibold rounded-lg hover:bg-primary/20 transition-colors duration-200 text-sm shadow-sm"
                            title="Editar esta lección y sincronizar en Firebase"
                        >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            {t('videoPage.editLessonFirebase')}
                        </button>
                    )}
                </div>
                <div className="space-y-8">
                    <VideoHeader video={video} levelName={level.name} levelId={level.id} />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3">
                             <div className="relative">
                                <VideoPlayer youtubeId={currentLink.youtubeId} videoUrl={currentLink.videoUrl} videoTitle={currentLink.title} />
                                <button
                                    onClick={() => setIsFullscreen(true)}
                                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors z-10"
                                    title="Pantalla completa"
                                    aria-label="Ver vídeo en pantalla completa"
                                >
                                    <ArrowsPointingOutIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col">
                             <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b dark:border-slate-700 pb-2 mb-2">{t('videoPage.lessonParts')}</h3>
                             <div className="max-h-[48vh] overflow-y-auto">
                                <YouTubeLinksList links={video.youtubeLinks} selectedIndex={selectedLinkIndex} onSelect={setSelectedLinkIndex} isFullScreen={false} />
                             </div>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        <VideoResources video={video} />
                        
                        {isAiAllowed ? (
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center">
                                        <LightBulbIcon className="w-8 h-8 text-primary" />
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 ml-3">{t('videoPage.aiSummary')}</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsSummaryModalOpen(true)}
                                        disabled={!summary || isSummaryLoading}
                                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Ver en pantalla completa"
                                    >
                                        <ArrowsPointingOutIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                                <div className="text-slate-600 dark:text-slate-50 mb-4 min-h-[4rem]">
                                    <MarkdownContent content={summary || t('videoPage.askAiSummaryPrompt')} />
                                </div>
                                <Button
                                    onClick={handleGenerateSummary}
                                    isLoading={isSummaryLoading}
                                    className="w-full mt-2"
                                >
                                    {isSummaryLoading ? t('common.submitting') : (summary ? t('videoPage.regenerateSummary') : t('videoPage.generateSummary'))}
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 text-center flex flex-col items-center justify-center py-8">
                                <SparklesIcon className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2 animate-pulse" />
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">{t('videoPage.aiSummariesDisabled')}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-500 max-w-sm mt-1">
                                    {t('videoPage.aiDisabledDesc')}
                                </p>
                            </div>
                        )}
                        
                        {isAiAllowed ? (
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                                <div className="flex items-center mb-4">
                                    <QuestionMarkCircleIcon className="w-8 h-8 text-primary" />
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 ml-3">{t('videoPage.testYourKnowledge')}</h3>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    {t('videoPage.practiceQuestionsPrompt')}
                                </p>
                                <Button onClick={() => setIsPracticeModalOpen(true)} className="w-full">
                                    {t('videoPage.openInteractivePractice')}
                                </Button>
                            </div>
                        ) : null}
 
                        <QuizPlayer videoId={video.id} />
                    </div>
 
                    <div className="bg-gradient-to-r from-primary to-indigo-600 text-white p-8 rounded-xl shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-6 text-center xl:text-left">
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold">{t('videoPage.leftWithDoubts')}</h2>
                            <p className="mt-2 text-indigo-100 max-w-2xl">
                               {isAiAllowed 
                                ? t('videoPage.doubtsSubtitleStudent')
                                : t('videoPage.doubtsSubtitleTeacher')}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            {isAiAllowed && (
                                <button
                                    onClick={handleAskTutor}
                                    className="bg-white text-primary font-bold py-3 px-6 rounded-xl hover:bg-gray-100 transition-transform transform hover:scale-102 flex items-center justify-center shadow-lg text-base flex-shrink-0 cursor-pointer"
                                >
                                    <SparklesIcon className="w-5 h-5 mr-2 inline" />
                                    {t('videoPage.askTutor')}
                                </button>
                            )}
                            <button
                                onClick={handleChatWithClassmates}
                                className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-3 px-6 rounded-xl border border-indigo-500/35 transition-transform transform hover:scale-102 flex items-center justify-center shadow-lg text-base flex-shrink-0 cursor-pointer"
                            >
                                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 inline" />
                                {t('videoPage.askPeers')}
                            </button>
                        </div>
                    </div>
                </div>

                <CommentsSection videoId={video.id} />
                <SummaryModal
                    isOpen={isSummaryModalOpen}
                    onClose={() => setIsSummaryModalOpen(false)}
                    summary={summary}
                    videoTitle={video.title}
                />
                <PracticeQuestionModal
                    isOpen={isPracticeModalOpen}
                    onClose={() => setIsPracticeModalOpen(false)}
                    video={video}
                    levelId={level.id}
                    subjectId={subject.id}
                />
            </div>
        </SubscriptionGate>
    );
};