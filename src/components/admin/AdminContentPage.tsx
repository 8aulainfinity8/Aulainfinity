import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import { eventEmitter } from '../../services/eventService';
import { AuthContext } from '../../contexts/AuthContext';
import type { CourseLevel, Subject, Video, VideoBlock, TeacherUser } from '../../types';
import { Lock } from 'lucide-react';
import { iconMap } from '../iconMap';
import { ChevronLeftIcon, PlusCircleIcon, PencilIcon, TrashIcon, BookOpenIcon, QuestionMarkCircleIcon, ChevronRightIcon, FolderPlusIcon, VideoCameraIcon } from '../icons';
import { ContentModal } from './ContentModal';
import { ConfirmationModal } from '../ConfirmationModal';
import { NotificationContext } from '../../contexts/NotificationContext';
import { QuizModal } from './QuizModal';
import { FilterButton } from '../ui/FilterButton';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { ROUTES } from '../../constants/routes';
import { filterCoursesForTeacher } from '../../utils/teacherPermissions';
import { FailureState } from '../ui/FailureState';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

type ModalState = 
    | { type: 'add-level' }
    | { type: 'edit-level', data: CourseLevel }
    | { type: 'add-subject', data: { levelId: string } }
    | { type: 'edit-subject', data: { levelId: string, subject: Subject } }
    | { type: 'add-video', data: { levelId: string, subjectId: string, blockId?: string } }
    | { type: 'edit-video', data: { levelId: string, subjectId: string, video: Video, blockId?: string } }
    | { type: 'add-block', data: { levelId: string, subjectId: string } }
    | { type: 'edit-block', data: { levelId: string, subjectId: string, block: VideoBlock } }
    | null;

type DeletionState = {
    type: 'level' | 'subject' | 'video' | 'block';
    ids: { levelId: string; subjectId?: string; videoId?: string, blockId?: string };
    name: string;
} | null;

const ContentSkeleton = () => (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-4 h-[75vh]">
        <div className="border dark:border-slate-700 rounded-lg p-4 space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded opacity-75"></div>
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded opacity-50"></div>
        </div>
        <div className="border dark:border-slate-700 rounded-lg p-4 space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
        </div>
        <div className="border dark:border-slate-700 rounded-lg p-4 space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
        </div>
    </div>
);

// Helper to determine if content is new
const isNew = (createdAt?: string) => {
    if (!createdAt) return false;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(createdAt) > sevenDaysAgo;
};

// Extracted ListItem component to prevent re-renders
const ListItem: React.FC<{
    item: { id: string; name: string; createdAt?: string };
    isSelected: boolean;
    onSelect: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    iconName?: string;
    onManageQuiz?: () => void;
}> = React.memo(({ item, isSelected, onSelect, onEdit, onDelete, iconName, onManageQuiz }) => {
    const Icon = iconName ? iconMap[iconName] ?? BookOpenIcon : null;
    return (
        <div className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'text-slate-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
            <div className="flex items-center flex-1 min-w-0" onClick={onSelect}>
                {Icon && <Icon className="w-5 h-5 mr-3 flex-shrink-0" />}
                <span className="truncate flex-1">{item.name}</span>
                {isNew(item.createdAt) && <span className="ml-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">Nuevo</span>}
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0 pl-2">
                {onManageQuiz && <button onClick={onManageQuiz} className="p-1 text-slate-400 hover:text-green-600" title="Gestionar Quiz"><QuestionMarkCircleIcon className="w-5 h-5" /></button>}
                {onEdit && <button onClick={onEdit} className="p-1 text-slate-400 hover:text-blue-600" title="Editar"><PencilIcon className="w-5 h-5" /></button>}
                {onDelete && <button onClick={onDelete} className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors" title="Eliminar"><TrashIcon className="w-5 h-5" /></button>}
            </div>
        </div>
    );
});

const ColumnHeader: React.FC<{ title: string; children?: React.ReactNode; onAdd?: () => void, onAddVideo?: () => void; onAddBlock?: () => void; }> = ({ title, children, onAdd, onAddVideo, onAddBlock }) => (
    <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
            {children}
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 truncate" title={title}>{title}</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            {onAdd && <button onClick={onAdd} className="p-1 text-primary hover:bg-primary/10 rounded-full" title="Añadir"><PlusCircleIcon className="w-6 h-6" /></button>}
            {onAddVideo && (
                <button onClick={onAddVideo} className="p-1 text-primary hover:bg-primary/10 rounded-full" title="Añadir Vídeo(s)">
                    <PlusCircleIcon className="w-6 h-6" />
                </button>
            )}
            {onAddBlock && (
                <button onClick={onAddBlock} className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full" title="Añadir Bloque">
                    <FolderPlusIcon className="w-6 h-6" />
                </button>
            )}
        </div>
    </div>
);

export const AdminContentPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const isTeacher = user?.role === 'teacher';
    const teacherUser = isTeacher ? (user as TeacherUser) : null;
    const isContentEditingRestricted = isTeacher && teacherUser?.canEditContent === false;
    const queryClient = useQueryClient();
    const defaultBackRoute = isTeacher ? ROUTES.DASHBOARD : ROUTES.ADMIN_DASHBOARD;
    const handleBack = useBackNavigation(defaultBackRoute);
    const { addToast } = useContext(NotificationContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [modalState, setModalState] = useState<ModalState>(null);
    const [itemToDelete, setItemToDelete] = useState<DeletionState>(null);
    const [quizModalState, setQuizModalState] = useState<{ videoId: string, topic: string } | null>(null);
    const [filter, setFilter] = useState<'new' | 'all'>('all');
    const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});

    const { data: courses, isLoading, isError, refetch } = useQuery<CourseLevel[]>({
        queryKey: ['courses'],
        queryFn: api.fetchCourses,
    });

    useEffect(() => {
        const handleSync = () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        };
        eventEmitter.on('courses-updated', handleSync);
        return () => {
            eventEmitter.off('courses-updated', handleSync);
        };
    }, [queryClient]);
    
    // --- FILTERING LOGIC ---
    const newContentCount = useMemo(() => {
        if (!courses) return 0;
        let count = 0;
        courses.forEach(level => {
            if (isNew(level.createdAt)) count++;
            level.subjects.forEach(subject => {
                if (isNew(subject.createdAt)) count++;
                (subject.videos || []).forEach(video => {
                    if (isNew(video.createdAt)) count++;
                });
                (subject.blocks || []).forEach(block => {
                    block.videos.forEach(video => {
                         if (isNew(video.createdAt)) count++;
                    });
                });
            });
        });
        return count;
    }, [courses]);

    // Filter courses for teacher based on assigned taughtCourseIds / coursesTaughtIds / levels
    const teacherFilteredLevels = useMemo(() => {
        if (!courses) return [];
        if (!isTeacher || !user) return courses;
        return filterCoursesForTeacher(courses, user);
    }, [courses, isTeacher, user]);
    
    const displayedLevels = useMemo(() => {
        if (!teacherFilteredLevels) return [];
        if (filter === 'all') return teacherFilteredLevels;
        
        return teacherFilteredLevels.filter(level => 
            isNew(level.createdAt) || 
            (level.subjects || []).some(subject => 
                isNew(subject.createdAt) || 
                (subject.videos || []).some(video => isNew(video.createdAt)) ||
                (subject.blocks || []).some(block => (block.videos || []).some(video => isNew(video.createdAt)))
            )
        );
    }, [teacherFilteredLevels, filter]);
    
    const selectedLevel = useMemo(() => courses?.find(c => c.id === selectedLevelId), [courses, selectedLevelId]);

    const subjectsForSelectedLevel = useMemo(() => {
        const rawSubjects = selectedLevel?.subjects ?? [];
        if (!isTeacher || !user) return rawSubjects;

        const tUser = user as TeacherUser;
        const teacherSubjects = Array.isArray(tUser.subjects) ? tUser.subjects : [];

        if (teacherSubjects.length > 0) {
            const filtered = rawSubjects.filter(sub => {
                return teacherSubjects.some(s => 
                    s.toLowerCase() === sub.id.toLowerCase() || 
                    sub.name.toLowerCase().includes(s.toLowerCase()) ||
                    s.toLowerCase().includes(sub.name.toLowerCase()) ||
                    sub.id.toLowerCase().includes(s.toLowerCase())
                );
            });
            if (filtered.length > 0) return filtered;
        }

        const cat = tUser.category?.toLowerCase().trim();
        if (!cat || cat === 'general') return rawSubjects;

        const filteredByCat = rawSubjects.filter(sub => {
            return sub.name.toLowerCase().includes(cat) || cat.includes(sub.name.toLowerCase()) || sub.id.toLowerCase().includes(cat);
        });

        return filteredByCat.length > 0 ? filteredByCat : rawSubjects;
    }, [selectedLevel, isTeacher, user]);
    const displayedSubjects = useMemo(() => {
        if (filter === 'all') return subjectsForSelectedLevel;
        return subjectsForSelectedLevel.filter(subject => 
            isNew(subject.createdAt) || 
            (subject.videos || []).some(video => isNew(video.createdAt)) ||
            (subject.blocks || []).some(block => (block.videos || []).some(video => isNew(video.createdAt)))
        );
    }, [subjectsForSelectedLevel, filter]);

    const selectedSubject = useMemo(() => (selectedLevel?.subjects || []).find(s => s.id === selectedSubjectId), [selectedLevel, selectedSubjectId]);
    
    // Reset selections if they disappear after filtering
    React.useEffect(() => {
        if (selectedLevelId && !(displayedLevels || []).some(l => l.id === selectedLevelId)) {
            setSelectedLevelId(null);
            setSelectedSubjectId(null);
        }
    }, [displayedLevels, selectedLevelId]);
    
     React.useEffect(() => {
        if (selectedSubjectId && !(displayedSubjects || []).some(s => s.id === selectedSubjectId)) {
            setSelectedSubjectId(null);
        }
    }, [displayedSubjects, selectedSubjectId]);

    useEffect(() => {
        if (location.state && typeof location.state === 'object' && 'openModal' in location.state) {
            const state = location.state as { openModal: string; levelId?: string; subjectId?: string; blockId?: string };
            if (state.openModal === 'add-level') {
                setModalState({ type: 'add-level' });
            } else if (state.openModal === 'add-subject') {
                const targetLevelId = state.levelId || selectedLevelId || (courses && courses[0]?.id);
                if (targetLevelId) {
                    setSelectedLevelId(targetLevelId);
                    setModalState({ type: 'add-subject', data: { levelId: targetLevelId } });
                } else {
                    addToast('Por favor, selecciona o crea un nivel primero.', 'info');
                }
            } else if (state.openModal === 'add-video') {
                const targetLevelId = state.levelId || selectedLevelId || (courses && courses[0]?.id);
                const targetSubjectId = state.subjectId || selectedSubjectId || (courses?.find(c => c.id === targetLevelId)?.subjects?.[0]?.id);
                if (targetLevelId && targetSubjectId) {
                    setSelectedLevelId(targetLevelId);
                    setSelectedSubjectId(targetSubjectId);
                    setModalState({ type: 'add-video', data: { levelId: targetLevelId, subjectId: targetSubjectId, blockId: state.blockId } });
                } else {
                    addToast('Por favor, selecciona o crea una asignatura primero.', 'info');
                }
            } else if (state.openModal === 'add-block') {
                const targetLevelId = state.levelId || selectedLevelId || (courses && courses[0]?.id);
                const targetSubjectId = state.subjectId || selectedSubjectId || (courses?.find(c => c.id === targetLevelId)?.subjects?.[0]?.id);
                if (targetLevelId && targetSubjectId) {
                    setSelectedLevelId(targetLevelId);
                    setSelectedSubjectId(targetSubjectId);
                    setModalState({ type: 'add-block', data: { levelId: targetLevelId, subjectId: targetSubjectId } });
                } else {
                    addToast('Por favor, selecciona o crea una asignatura primero.', 'info');
                }
            } else if (state.openModal === 'edit-video' && state.levelId && state.subjectId && (state as any).videoId) {
                const targetLevel = courses?.find(c => c.id === state.levelId);
                const targetSubject = targetLevel?.subjects?.find(s => s.id === state.subjectId);
                const targetVideo = state.blockId 
                    ? targetSubject?.blocks?.find(b => b.id === state.blockId)?.videos?.find(v => v.id === (state as any).videoId)
                    : targetSubject?.videos?.find(v => v.id === (state as any).videoId);
                if (targetVideo) {
                    setSelectedLevelId(state.levelId);
                    setSelectedSubjectId(state.subjectId);
                    setModalState({ type: 'edit-video', data: { levelId: state.levelId, subjectId: state.subjectId, video: targetVideo, blockId: state.blockId } });
                }
            }
            // Clear the location state to prevent triggering again
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, courses, selectedLevelId, selectedSubjectId, addToast, navigate, location.pathname]);

    // --- MUTATIONS ---
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            addToast('Elemento eliminado con éxito.', 'success');
            setItemToDelete(null);
        },
        onError: (err: Error) => {
            addToast(`Error al eliminar: ${err.message}`, 'error');
            setItemToDelete(null);
        }
    };

    const deleteLevelMutation = useMutation({ mutationFn: api.deleteLevel, ...mutationOptions });
    const deleteSubjectMutation = useMutation({ mutationFn: (data: {levelId: string, subjectId: string}) => api.deleteSubject(data.levelId, data.subjectId), ...mutationOptions });
    const deleteVideoMutation = useMutation({ mutationFn: (data: {levelId: string, subjectId: string, videoId: string, blockId?: string}) => api.deleteVideo(data.levelId, data.subjectId, data.videoId, data.blockId), ...mutationOptions });
    const deleteBlockMutation = useMutation({ mutationFn: (data: {levelId: string, subjectId: string, blockId: string}) => api.deleteBlock(data.levelId, data.subjectId, data.blockId), ...mutationOptions });

    const confirmDelete = () => {
        if (!itemToDelete) return;
        const { type, ids } = itemToDelete;
        if (type === 'level') deleteLevelMutation.mutate(ids.levelId!);
        if (type === 'subject') deleteSubjectMutation.mutate({ levelId: ids.levelId!, subjectId: ids.subjectId! });
        if (type === 'video') deleteVideoMutation.mutate({ levelId: ids.levelId!, subjectId: ids.subjectId!, videoId: ids.videoId!, blockId: ids.blockId });
        if (type === 'block') deleteBlockMutation.mutate({ levelId: ids.levelId!, subjectId: ids.subjectId!, blockId: ids.blockId! });
    };
    
    if (isLoading) return <ContentSkeleton />;
    if (isError) return <FailureState message="No se pudo cargar el contenido de los cursos." onRetry={refetch} />;

    const deletionInProgress = deleteLevelMutation.isPending || deleteSubjectMutation.isPending || deleteVideoMutation.isPending || deleteBlockMutation.isPending;

    return (
        <div className="animate-slide-in-up">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Gestionar Contenido</h1>
                <button onClick={handleBack} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" />Volver
                </button>
            </div>
            
            <div className="flex space-x-2 border-b dark:border-slate-700 mb-4">
                <FilterButton view="new" label="Nuevos" count={newContentCount} setFilter={setFilter} currentFilter={filter} />
                <FilterButton view="all" label="Todos" count={(courses || []).reduce((acc, l) => acc + 1 + (l.subjects?.length || 0) + (l.subjects?.reduce((sAcc, s) => sAcc + (s.videos?.length || 0) + (s.blocks?.length ?? 0) + (s.blocks?.reduce((bAcc, b) => bAcc + (b.videos?.length || 0), 0) ?? 0), 0) || 0), 0)} setFilter={setFilter} currentFilter={filter} />
            </div>

            {isContentEditingRestricted && (
                <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-3 text-xs text-rose-800 dark:text-rose-300 font-semibold shadow-sm">
                    <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>El administrador ha restringido tus permisos para añadir, editar o eliminar niveles, asignaturas, bloques y vídeos. Dispones de acceso únicamente de lectura.</span>
                </div>
            )}

            <div className="flex flex-col lg:flex-row lg:gap-6 h-[calc(100vh-18rem)]">
                {/* Levels Column */}
                <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex-col lg:w-1/3 ${selectedLevelId ? 'hidden lg:flex' : 'flex'}`}>
                    <ColumnHeader title="Niveles" onAdd={isContentEditingRestricted ? undefined : () => setModalState({ type: 'add-level' })} />
                    <div className="overflow-y-auto space-y-1">
                        {displayedLevels.map(level => (
                            <ListItem
                                key={level.id}
                                item={level}
                                isSelected={selectedLevelId === level.id}
                                onSelect={() => { setSelectedLevelId(level.id); setSelectedSubjectId(null); }}
                                onEdit={isContentEditingRestricted ? undefined : () => setModalState({ type: 'edit-level', data: level })}
                                onDelete={isContentEditingRestricted ? undefined : () => setItemToDelete({ type: 'level', ids: { levelId: level.id }, name: level.name })}
                            />
                        ))}
                    </div>
                </div>

                {/* Subjects Column */}
                {selectedLevelId && (
                    <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex-col lg:w-1/3 ${selectedSubjectId ? 'hidden lg:flex' : 'flex'}`}>
                        <ColumnHeader title={selectedLevel?.name ?? 'Asignaturas'} onAdd={isContentEditingRestricted ? undefined : () => setModalState({ type: 'add-subject', data: { levelId: selectedLevel!.id } })}>
                             <button onClick={() => setSelectedLevelId(null)} className="lg:hidden p-1 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                                <ChevronLeftIcon className="w-6 h-6" />
                              </button>
                        </ColumnHeader>
                        <div className="overflow-y-auto space-y-1">
                            {displayedSubjects.length > 0 ? (
                                displayedSubjects.map(subject => (
                                    <ListItem
                                        key={subject.id}
                                        item={subject}
                                        isSelected={selectedSubjectId === subject.id}
                                        onSelect={() => setSelectedSubjectId(subject.id)}
                                        onEdit={isContentEditingRestricted ? undefined : () => setModalState({ type: 'edit-subject', data: { levelId: selectedLevel!.id, subject } })}
                                        onDelete={isContentEditingRestricted ? undefined : () => setItemToDelete({ type: 'subject', ids: { levelId: selectedLevel!.id, subjectId: subject.id }, name: subject.name })}
                                        iconName={subject.icon}
                                    />
                                ))
                            ) : (
                                <EmptyState
                                    icon={<BookOpenIcon />}
                                    title="No hay asignaturas"
                                    description={filter === 'new' ? "No hay asignaturas nuevas. Cambia el filtro para ver todas." : "Añade una asignatura para empezar a organizar el contenido."}
                                >
                                    {filter === 'all' && selectedLevel && (
                                        <Button onClick={() => setModalState({ type: 'add-subject', data: { levelId: selectedLevel.id } })}>
                                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                                            Añadir Asignatura
                                        </Button>
                                    )}
                                </EmptyState>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Videos and Blocks Column */}
                {selectedSubjectId && selectedSubject && (
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col lg:w-1/3">
                        <ColumnHeader 
                            title={selectedSubject?.name ?? 'Contenido'}
                            onAddVideo={isContentEditingRestricted ? undefined : (selectedSubject ? () => setModalState({ type: 'add-video', data: { levelId: selectedLevel!.id, subjectId: selectedSubject.id } }) : undefined)}
                            onAddBlock={isContentEditingRestricted ? undefined : (selectedSubject ? () => setModalState({ type: 'add-block', data: { levelId: selectedLevel!.id, subjectId: selectedSubject.id } }) : undefined)}
                        >
                            <button onClick={() => setSelectedSubjectId(null)} className="lg:hidden p-1 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                                <ChevronLeftIcon className="w-6 h-6" />
                            </button>
                        </ColumnHeader>
                        <div className="overflow-y-auto space-y-4">
                            {selectedSubject.videos && selectedSubject.videos.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2 px-2">Vídeos Principales</h3>
                                    <div className="space-y-1">
                                        {selectedSubject.videos.map(video => (
                                            <ListItem
                                                key={video.id}
                                                item={{ id: video.id, name: video.title, createdAt: video.createdAt }}
                                                isSelected={false} onSelect={() => {}}
                                                onEdit={isContentEditingRestricted ? undefined : () => setModalState({ type: 'edit-video', data: { levelId: selectedLevel!.id, subjectId: selectedSubject.id, video } })}
                                                onDelete={isContentEditingRestricted ? undefined : () => setItemToDelete({ type: 'video', ids: { levelId: selectedLevel!.id, subjectId: selectedSubject.id, videoId: video.id }, name: video.title })}
                                                onManageQuiz={() => setQuizModalState({ videoId: video.id, topic: video.topic })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedSubject.blocks && selectedSubject.blocks.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2 px-2">Bloques Temáticos</h3>
                                    {selectedSubject.blocks.map(block => (
                                        <div key={block.id} className="border dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50 overflow-hidden">
                                            <div className="group flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-slate-700">
                                                <button onClick={() => setExpandedBlocks(prev => ({...prev, [block.id]: !prev[block.id]}))} className="flex items-center flex-1 text-left font-semibold text-slate-800 dark:text-slate-200">
                                                    <ChevronRightIcon className={`w-5 h-5 mr-2 transition-transform ${expandedBlocks[block.id] ? 'rotate-90' : ''}`} />
                                                    <span className="truncate">{block.name}</span>
                                                </button>
                                                {!isContentEditingRestricted && (
                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setModalState({ type: 'edit-block', data: { levelId: selectedLevel!.id, subjectId: selectedSubject.id, block } })} className="p-1 hover:text-blue-600" title="Editar Bloque"><PencilIcon className="w-5 h-5" /></button>
                                                        <button onClick={() => setItemToDelete({ type: 'block', ids: { levelId: selectedLevel!.id, subjectId: selectedSubject.id, blockId: block.id }, name: block.name })} className="p-1 hover:text-red-600" title="Eliminar Bloque"><TrashIcon className="w-5 h-5" /></button>
                                                    </div>
                                                )}
                                            </div>
                                            {expandedBlocks[block.id] && (
                                                <div className="pl-6 pr-2 pb-2 border-t dark:border-slate-700">
                                                    {block.videos.map(video => (
                                                        <ListItem
                                                            key={video.id}
                                                            item={{ id: video.id, name: video.title, createdAt: video.createdAt }}
                                                            isSelected={false} onSelect={()=>{}}
                                                            onEdit={isContentEditingRestricted ? undefined : () => setModalState({ type: 'edit-video', data: { levelId: selectedLevel!.id, subjectId: selectedSubject.id, video, blockId: block.id } })}
                                                            onDelete={isContentEditingRestricted ? undefined : () => setItemToDelete({ type: 'video', ids: { levelId: selectedLevel!.id, subjectId: selectedSubject.id, videoId: video.id, blockId: block.id }, name: video.title })}
                                                            onManageQuiz={() => setQuizModalState({ videoId: video.id, topic: video.topic })}
                                                        />
                                                    ))}
                                                    {!isContentEditingRestricted && (
                                                        <button onClick={() => setModalState({ type: 'add-video', data: { levelId: selectedLevel!.id, subjectId: selectedSubject.id, blockId: block.id } })} className="text-sm p-2 flex items-center w-full text-primary hover:bg-primary/10 rounded-md">
                                                            <PlusCircleIcon className="w-4 h-4 mr-2"/> Añadir Vídeo a este bloque
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(!selectedSubject.videos || selectedSubject.videos.length === 0) && (!selectedSubject.blocks || selectedSubject.blocks.length === 0) && (
                                <EmptyState
                                    icon={<VideoCameraIcon />}
                                    title="Sin contenido"
                                    description={filter === 'new' ? "No hay vídeos o bloques nuevos. Cambia el filtro para ver todo." : "Esta asignatura no tiene contenido. ¡Añade vídeos o bloques!"}
                                >
                                    {filter === 'all' && selectedLevel && (
                                        <div className="flex justify-center gap-4">
                                            <Button onClick={() => setModalState({ type: 'add-video', data: { levelId: selectedLevel.id, subjectId: selectedSubject.id } })}>
                                                <PlusCircleIcon className="w-5 h-5 mr-2" />
                                                Añadir Vídeo(s)
                                            </Button>
                                            <Button variant="secondary" onClick={() => setModalState({ type: 'add-block', data: { levelId: selectedLevel.id, subjectId: selectedSubject.id } })}>
                                                <FolderPlusIcon className="w-5 h-5 mr-2" />
                                                Añadir Bloque
                                            </Button>
                                        </div>
                                    )}
                                </EmptyState>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {modalState && <ContentModal modalState={modalState} onClose={() => setModalState(null)} />}
            {quizModalState && <QuizModal videoId={quizModalState.videoId} topic={quizModalState.topic} onClose={() => setQuizModalState(null)} />}
            
            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar eliminación"
                description={`¿Estás seguro de que deseas eliminar "${itemToDelete?.name}"? Esta acción no se puede deshacer.`}
                isLoading={deletionInProgress}
            />
        </div>
    );
};