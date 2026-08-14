import React, { useState, useMemo, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import * as api from '../../services/api';
import { findVideoById } from '../../data/database';
import type { Comment as CommentType, CourseLevel } from '../../types';
import { ChevronLeftIcon, TrashIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, PencilIcon } from '../icons';
import { NotificationContext } from '../../contexts/NotificationContext';
import { NewCommentsContext } from '../../contexts/NewCommentsContext';
import { AuthContext } from '../../contexts/AuthContext';
import { ConfirmationModal } from '../ConfirmationModal';
import { ROUTES, generateVideoPath } from '../../constants/routes';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { FilterButton } from '../ui/FilterButton';
import { FailureState } from '../ui/FailureState';
import { EmptyState } from '../ui/EmptyState';

const CommentSkeleton = () => (
    <div className="p-4 border dark:border-slate-700 rounded-lg animate-pulse">
        <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
            </div>
            <div className="flex flex-col items-end space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-28"></div>
            </div>
        </div>
    </div>
);

export const AdminCommentsPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { addToast } = useContext(NotificationContext);
    const { user } = useContext(AuthContext);
    const isTeacher = user?.role === 'teacher';
    const isApprovedTeacher = isTeacher ? (user as any).isApprovedForTutoring === true : true;

    const checkApproval = (): boolean => {
        if (!isApprovedTeacher) {
            addToast('Tu cuenta de profesor aún no ha sido aprobada por la administración de AulaInfinity.', 'error');
            return false;
        }
        return true;
    };
    const parentRef = useRef<HTMLDivElement>(null);
    const { 
        comments,
        newComments,
        newCommentsCount,
        isLoading,
        isError, 
        refetchComments,
        markCommentAsRead
    } = useContext(NewCommentsContext);
    
    const [filter, setFilter] = useState<'new' | 'all'>('new');
    const [selectedCommentIds, setSelectedCommentIds] = useState<string[]>([]);
    const [isAutoModerating, setIsAutoModerating] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);

    const getModerationStatus = (text: string): { status: 'safe' | 'flagged'; reason?: string } => {
        const textLower = text.toLowerCase();
        const spamKeywords = ['http', 'www', '.com', 'comprar', 'gana dinero', 'dinero fácil', 'bitcoin', 'cripto', 'forex', 'promoción', 'descuento'];
        const toxicKeywords = ['mierda', 'puto', 'tonto', 'estúpido', 'bobo', 'idiota', 'cabrón', 'imbécil', 'asqueroso'];

        for (const kw of spamKeywords) {
            if (textLower.includes(kw)) {
                return { status: 'flagged', reason: 'Sospecha de SPAM / Enlace externo publicitario ⚠️' };
            }
        }
        for (const kw of toxicKeywords) {
            if (textLower.includes(kw)) {
                return { status: 'flagged', reason: 'Vocabulario inadecuado detectado por Filtro IA 🚨' };
            }
        }
        return { status: 'safe' };
    };

    const handleSelectComment = (id: string) => {
        setSelectedCommentIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAllComments = () => {
        if (selectedCommentIds.length === filteredComments.length) {
            setSelectedCommentIds([]);
        } else {
            setSelectedCommentIds(filteredComments.map(c => c.id));
        }
    };

    const handleBulkMarkCommentsAsRead = async () => {
        if (!checkApproval()) return;
        if (selectedCommentIds.length === 0) return;
        setIsAutoModerating(true);
        try {
            for (const cid of selectedCommentIds) {
                await markCommentAsRead(cid);
            }
            addToast(`Se marcaron ${selectedCommentIds.length} comentarios como leídos.`, 'success');
            setSelectedCommentIds([]);
        } catch (e) {
            addToast('Error al procesar en lote.', 'error');
        } finally {
            setIsAutoModerating(false);
        }
    };

    const handleBulkDeleteComments = async () => {
        if (!checkApproval()) return;
        if (selectedCommentIds.length === 0) return;
        setIsAutoModerating(true);
        try {
            for (const cid of selectedCommentIds) {
                await api.deleteComment(cid);
                markCommentAsRead(cid);
            }
            queryClient.invalidateQueries({ queryKey: ['allComments'] });
            addToast(`Se eliminaron ${selectedCommentIds.length} comentarios con éxito.`, 'success');
            setSelectedCommentIds([]);
        } catch (e) {
            addToast('Error al eliminar comentarios en lote.', 'error');
        } finally {
            setIsAutoModerating(false);
        }
    };

    const handleAutoModerate = async () => {
        if (!checkApproval()) return;
        if (!newComments || newComments.length === 0) {
            addToast('No hay comentarios nuevos que moderar.', 'info');
            return;
        }
        setIsAutoModerating(true);
        let approvedCount = 0;
        let flaggedCount = 0;

        try {
            for (const comment of newComments) {
                const analysis = getModerationStatus(comment.text);
                if (analysis.status === 'safe') {
                    await markCommentAsRead(comment.id);
                    approvedCount++;
                } else {
                    flaggedCount++;
                }
            }
            queryClient.invalidateQueries({ queryKey: ['allComments'] });
            if (approvedCount > 0) {
                addToast(`Moderación Completada: ${approvedCount} comentarios aprobados automáticamente.`, 'success');
            }
            if (flaggedCount > 0) {
                addToast(`IA: Se retuvieron ${flaggedCount} comentarios sospechosos para revisión manual.`, 'info');
            }
        } catch (e) {
            addToast('Error durante la auto-moderación.', 'error');
        } finally {
            setIsAutoModerating(false);
        }
    };
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const { data: courses } = useQuery<CourseLevel[]>({
        queryKey: ['courses'],
        queryFn: api.fetchCourses,
    });

    const videoTitleMap = useMemo(() => {
        const map = new Map<string, string>();
        if (!courses) return map;
        courses.forEach(course => {
            course.subjects?.forEach(subject => {
                subject.videos?.forEach(v => {
                    map.set(v.id, v.title);
                });
                subject.blocks?.forEach(block => {
                    block.videos?.forEach(bv => {
                        map.set(bv.id, bv.title);
                    });
                });
            });
        });
        return map;
    }, [courses]);
    
    const allSortedComments = useMemo(() => {
        if (!comments) return [];
        return [...comments].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [comments]);

    const filteredComments = useMemo(() => {
        return filter === 'new' ? newComments : allSortedComments;
    }, [filter, newComments, allSortedComments]);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const rowVirtualizer = useVirtualizer({
        count: filteredComments.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => isMobile ? 220 : 160,
        overscan: 5,
    });

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
        }
    };

    const updateCommentMutation = useMutation<CommentType, Error, { commentId: string; text: string }>({
        mutationFn: ({ commentId, text }) => api.updateComment(commentId, text),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allComments'] });
            addToast('Comentario actualizado con éxito.', 'success');
            setEditingCommentId(null);
            setEditText('');
        },
        onError: (err: Error) => {
            addToast(`Error al actualizar el comentario: ${err.message}`, 'error');
        }
    });

    const deleteCommentMutation = useMutation<
        { commentId: string },
        Error,
        string
    >({
        mutationFn: api.deleteComment,
        onSuccess: (_, deletedCommentId) => {
            queryClient.invalidateQueries({ queryKey: ['allComments'] });
            markCommentAsRead(deletedCommentId);
            addToast('Comentario eliminado con éxito.', 'success');
            setCommentToDelete(null);
        },
        onError: (err: Error) => {
            addToast(`Error al eliminar el comentario: ${err.message}`, 'error');
            setCommentToDelete(null);
        }
    });

    const confirmDelete = () => {
        if (commentToDelete) {
            if (!checkApproval()) return;
            deleteCommentMutation.mutate(commentToDelete.id);
        }
    };

    const getVideoTitle = (videoId: string) => {
        if (!courses) return `Video ID: ${videoId}`;
        return videoTitleMap.get(videoId) || 'Vídeo no encontrado';
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Gestionar Comentarios</h1>
                <div className="flex flex-wrap gap-3">
                    {filter === 'new' && newCommentsCount > 0 && (
                        <button
                            onClick={handleAutoModerate}
                            disabled={isAutoModerating}
                            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors duration-200 shadow-md hover:shadow-indigo-500/20"
                        >
                            <span className="mr-2">⚡</span>
                            {isAutoModerating ? 'Auto-moderando...' : 'Auto-moderar con IA'}
                        </button>
                    )}
                    <button onClick={handleBack} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200">
                        <ChevronLeftIcon className="w-5 h-5 mr-2" />Volver
                    </button>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex flex-wrap items-center justify-between border-b dark:border-slate-700 mb-4 gap-2 pb-2">
                    <div className="flex space-x-2">
                        <FilterButton view="new" label="Nuevos" count={newCommentsCount} setFilter={setFilter} currentFilter={filter} />
                        <FilterButton view="all" label="Todos" count={comments?.length ?? 0} setFilter={setFilter} currentFilter={filter} />
                    </div>
                    {filteredComments.length > 0 && (
                        <button
                            onClick={handleSelectAllComments}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
                        >
                            {selectedCommentIds.length === filteredComments.length ? 'Desmarcar todos' : 'Marcar todos'}
                        </button>
                    )}
                </div>
                <div ref={parentRef} className="h-[65vh] overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="space-y-4">
                            <CommentSkeleton /><CommentSkeleton /><CommentSkeleton />
                        </div>
                    ) : isError ? (
                        <FailureState message="No se pudieron cargar los comentarios." onRetry={refetchComments} />
                    ) : filteredComments.length > 0 ? (
                        <div
                            className="w-full relative"
                            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                        >
                            {rowVirtualizer.getVirtualItems().map(virtualRow => {
                                const comment = filteredComments[virtualRow.index];
                                const analysis = getModerationStatus(comment.text);
                                const isFlagged = analysis.status === 'flagged';
                                const isSelected = selectedCommentIds.includes(comment.id);

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
                                    className="p-1"
                                >
                                    <div className={`p-4 border rounded-lg h-full flex flex-col justify-between transition-all duration-200 ${
                                        isFlagged 
                                            ? 'border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 shadow-sm shadow-red-100 dark:shadow-none' 
                                            : isSelected
                                                ? 'border-indigo-300 dark:border-indigo-950 bg-indigo-50/20 dark:bg-indigo-950/10'
                                                : 'border-slate-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50'
                                    }`}>
                                        <div>
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                <div className="flex items-start gap-3 flex-1 pr-0 sm:pr-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectComment(comment.id)}
                                                        className="mt-1.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 flex-wrap gap-x-2">
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{comment.author.name}</span>
                                                            <span>&bull;</span>
                                                            <span>{new Date(comment.timestamp).toLocaleString()}</span>
                                                            {isFlagged && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30">
                                                                    Filtro IA Flag ⚠️
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isFlagged && (
                                                            <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                                                                {analysis.reason}
                                                            </p>
                                                        )}
                                                        {editingCommentId === comment.id ? (
                                                            <div className="mt-2 space-y-2">
                                                                <div className="flex flex-wrap gap-1 items-center bg-gray-100/60 dark:bg-slate-700/60 p-1.5 rounded-lg border border-gray-200 dark:border-slate-600">
                                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mr-1.5 px-1">Respuestas Rápidas:</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditText(prev => {
                                                                            const suffix = "\n\n💬 Respuesta de AulaInfinity: ¡Hola! Muchas gracias por tu comentario. Nos alegra mucho saber que te ha servido la explicación. ¡Sigue así! 🚀";
                                                                            return prev.includes(suffix) ? prev : prev + suffix;
                                                                        })}
                                                                        className="px-2 py-0.5 text-[10px] bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 rounded transition-colors font-semibold border border-gray-200 dark:border-slate-700 cursor-pointer"
                                                                    >
                                                                        Agradecimiento 👍
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditText(prev => {
                                                                            const suffix = "\n\n💬 Respuesta de AulaInfinity: ¡Hola! Hemos revisado tu consulta. Si tienes cualquier otra duda sobre este tema, puedes solicitar una tutoría personalizada de 1 a 1 en tu panel de control. ¡Estamos para ayudarte! 🎓";
                                                                            return prev.includes(suffix) ? prev : prev + suffix;
                                                                        })}
                                                                        className="px-2 py-0.5 text-[10px] bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 rounded transition-colors font-semibold border border-gray-200 dark:border-slate-700 cursor-pointer"
                                                                    >
                                                                        Duda Resuelta 🎓
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditText(prev => {
                                                                            const suffix = "\n\n💬 Respuesta de AulaInfinity: ¡Hola! Si estás experimentando problemas técnicos con el reproductor o la plataforma, por favor escríbenos por WhatsApp o solicita soporte de inmediato. 🛠️";
                                                                            return prev.includes(suffix) ? prev : prev + suffix;
                                                                        })}
                                                                        className="px-2 py-0.5 text-[10px] bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 rounded transition-colors font-semibold border border-gray-200 dark:border-slate-700 cursor-pointer"
                                                                    >
                                                                        Soporte Técnico 🛠️
                                                                    </button>
                                                                </div>
                                                                <textarea
                                                                    value={editText}
                                                                    onChange={(e) => setEditText(e.target.value)}
                                                                    className="w-full p-2 border dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                                                                    rows={3}
                                                                    autoFocus
                                                                />
                                                                <div className="flex gap-2 justify-end mt-2">
                                                                    <Button variant="secondary" onClick={() => setEditingCommentId(null)}>Cancelar</Button>
                                                                    <Button
                                                                        onClick={() => { if (!checkApproval()) return; updateCommentMutation.mutate({ commentId: comment.id, text: editText }); }}
                                                                        isLoading={updateCommentMutation.isPending}
                                                                    >
                                                                        Guardar
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-slate-850 dark:text-slate-250 mt-2 break-words text-sm font-medium">{comment.text}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end pl-7 sm:pl-0">
                                                    {filter === 'new' && (
                                                        <button
                                                            onClick={() => { if (!checkApproval()) return; markCommentAsRead(comment.id); }}
                                                            className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors bg-green-100 text-green-700 hover:bg-green-200 flex-grow sm:flex-grow-0 flex items-center justify-center"
                                                            aria-label="Marcar como leído"
                                                        >
                                                            <CheckCircleIcon className="w-4 h-4 mr-1.5 inline"/>
                                                            Leído
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => { setEditingCommentId(comment.id); setEditText(comment.text); }}
                                                        className="p-1.5 text-sm font-semibold rounded-md transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                        aria-label="Editar comentario"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { if (!checkApproval()) return; setCommentToDelete(comment); }}
                                                        className="p-1.5 text-sm font-semibold rounded-md transition-colors bg-red-100 text-red-700 hover:bg-red-200"
                                                        aria-label="Eliminar comentario"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t dark:border-slate-700 pl-7">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 break-words">
                                                En el vídeo: <Link to={generateVideoPath(comment.videoId)} target="_blank" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">{getVideoTitle(comment.videoId)}</Link>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={<ChatBubbleLeftRightIcon />}
                            title={filter === 'new' ? 'No hay comentarios nuevos' : 'No hay comentarios'}
                            description={filter === 'new' ? '¡Estás al día!' : 'Cuando un estudiante deje un comentario, aparecerá aquí.'}
                        />
                    )}
                </div>
            </div>

            {/* Barra flotante para acciones de comentarios en lote */}
            {selectedCommentIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 dark:bg-slate-950/95 text-white py-4 px-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-4 z-40 border border-slate-800 backdrop-blur animate-fade-in max-w-[90vw] md:max-w-2xl">
                    <div className="flex items-center gap-3">
                        <span className="bg-indigo-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-full">{selectedCommentIds.length}</span>
                        <span className="text-sm font-semibold">Comentarios seleccionados</span>
                    </div>
                    <div className="h-px md:h-6 w-full md:w-px bg-slate-800" />
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {filter === 'new' && (
                            <Button
                                variant="secondary"
                                onClick={handleBulkMarkCommentsAsRead}
                                isLoading={isAutoModerating}
                                className="bg-slate-800 hover:bg-slate-700 text-white border-transparent text-xs py-1.5"
                            >
                                Marcar como Leídos ✓
                            </Button>
                        )}
                        <Button
                            variant="danger"
                            onClick={handleBulkDeleteComments}
                            isLoading={isAutoModerating}
                            className="text-xs py-1.5 animate-pulse"
                        >
                            Eliminar en Lote 🗑️
                        </Button>
                        <button
                            onClick={() => setSelectedCommentIds([])}
                            className="text-xs text-slate-400 hover:text-white underline ml-2 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!commentToDelete}
                onClose={() => setCommentToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar eliminación"
                description={`¿Estás seguro de que quieres eliminar este comentario? Esta acción es irreversible.`}
                confirmText="Eliminar"
                isDestructive
                isLoading={deleteCommentMutation.isPending}
            />
        </div>
    );
};