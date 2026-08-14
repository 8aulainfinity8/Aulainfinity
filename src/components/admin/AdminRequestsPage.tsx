import React, { useState, useMemo, useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../services/api';
import type { TopicRequest } from '../../types';
import { ChevronLeftIcon, CheckCircleIcon, LightBulbIcon, TrashIcon } from '../icons';
import { NotificationContext } from '../../contexts/NotificationContext';
import { AdminNotificationContext } from '../../contexts/AdminNotificationContext';
import { AuthContext } from '../../contexts/AuthContext';
import { ConfirmationModal } from '../ConfirmationModal';
import { FilterButton } from '../ui/FilterButton';
import { RequestSkeleton } from '../ui/RequestSkeleton';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { FailureState } from '../ui/FailureState';
import { EmptyState } from '../ui/EmptyState';

export const AdminRequestsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const handleBack = useBackNavigation('/admin/dashboard');
    const { addToast } = useContext(NotificationContext);
    const { user } = useContext(AuthContext);
    const isTeacher = user?.role === 'teacher';
    const isApprovedTeacher = isTeacher ? (user as any).isApprovedForTutoring === true : true;

    React.useEffect(() => {
        if (user) {
            api.markTopicRequestsAsSeen(user.role as any);
            queryClient.invalidateQueries({ queryKey: ['topic-requests'] });
        }
    }, [user, queryClient]);

    const checkApproval = (): boolean => {
        if (!isApprovedTeacher) {
            addToast('Tu cuenta de profesor aún no ha sido aprobada por la administración de AulaInfinity.', 'error');
            return false;
        }
        return true;
    };
    const { 
        topicRequests: requests, 
        isTopicRequestsLoading: isLoading, 
        isTopicRequestsError: isError, 
        refetchTopicRequests: refetch 
    } = useContext(AdminNotificationContext);
    const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [requestToDelete, setRequestToDelete] = useState<{ id: string; topic: string } | null>(null);
    
    const filteredRequests = useMemo(() => {
        if (!requests) return [];
        let sortedRequests = [...requests].reverse(); // Show newest first
        
        // Filter by Status
        if (filter !== 'all') {
            sortedRequests = sortedRequests.filter(req => req.status === filter);
        }
        
        // Filter by Search Term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            sortedRequests = sortedRequests.filter(req => 
                req.topic.toLowerCase().includes(term) || 
                req.details.toLowerCase().includes(term) ||
                req.studentName.toLowerCase().includes(term)
            );
        }
        
        return sortedRequests;
    }, [requests, filter, searchTerm]);

    const updateStatusMutation = useMutation<
        TopicRequest,
        Error,
        { requestId: string; status: 'pending' | 'completed' },
        { previousRequests: TopicRequest[] | undefined }
    >({
        mutationFn: ({ requestId, status }) => api.updateTopicRequestStatus(requestId, status),
        onMutate: async ({ requestId, status }) => {
            await queryClient.cancelQueries({ queryKey: ['topicRequests'] });
            const previousRequests = queryClient.getQueryData<TopicRequest[]>(['topicRequests']);
            queryClient.setQueryData<TopicRequest[]>(['topicRequests'], (old) => {
                if (!old) return [];
                return old.map(req => req.id === requestId ? { ...req, status } : req);
            });
            return { previousRequests };
        },
        onError: (err, variables, context) => {
            if (context?.previousRequests) {
                queryClient.setQueryData(['topicRequests'], context.previousRequests);
            }
            addToast('Error al actualizar la petición, revirtiendo.', 'error');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['topicRequests'] });
        },
        onSuccess: () => {
            addToast('Estado de la petición actualizado.', 'success');
        }
    });

    const deleteRequestMutation = useMutation<
        void,
        Error,
        string,
        { previousRequests: TopicRequest[] | undefined }
    >({
        mutationFn: (requestId: string) => api.deleteTopicRequest(requestId),
        onMutate: async (requestIdToDelete) => {
            await queryClient.cancelQueries({ queryKey: ['topicRequests'] });
            const previousRequests = queryClient.getQueryData<TopicRequest[]>(['topicRequests']);
            queryClient.setQueryData<TopicRequest[]>(['topicRequests'], (old) =>
                old ? old.filter(req => req.id !== requestIdToDelete) : []
            );
            setRequestToDelete(null); // Close modal optimistically
            return { previousRequests };
        },
        onError: (err, variables, context) => {
            if (context?.previousRequests) {
                queryClient.setQueryData(['topicRequests'], context.previousRequests);
            }
            addToast('Error al eliminar la petición.', 'error');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['topicRequests'] });
        },
        onSuccess: () => {
            addToast('Petición eliminada con éxito.', 'success');
        }
    });

    const confirmDelete = () => {
        if (requestToDelete) {
            if (!checkApproval()) return;
            deleteRequestMutation.mutate(requestToDelete.id);
        }
    };
    
    const getEmptyStateMessage = () => {
        switch (filter) {
            case 'pending':
                return { title: 'No hay peticiones pendientes', description: '¡Buen trabajo! Has revisado todas las sugerencias.' };
            case 'completed':
                 return { title: 'No hay peticiones completadas', description: 'Las peticiones que marques como completadas aparecerán aquí.' };
            default:
                 return { title: 'No hay peticiones', description: 'Cuando un estudiante sugiera un tema, aparecerá aquí.' };
        }
    };
    
    return (
        <div className="animate-slide-in-up">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Gestionar Peticiones de Contenido</h1>
                <button onClick={handleBack} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" />Volver
                </button>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b dark:border-slate-700 pb-4 mb-4">
                    <div className="flex flex-wrap space-x-2">
                        <FilterButton view="pending" label="Pendientes" count={requests?.filter(r => r.status === 'pending').length ?? 0} setFilter={setFilter} currentFilter={filter}/>
                        <FilterButton view="completed" label="Completadas" count={requests?.filter(r => r.status === 'completed').length ?? 0} setFilter={setFilter} currentFilter={filter} />
                        <FilterButton view="all" label="Todas" count={requests?.length ?? 0} setFilter={setFilter} currentFilter={filter} />
                    </div>
                    <div className="w-full md:w-64">
                         <input
                            type="text"
                            placeholder="Buscar por alumno, tema..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>
                {isLoading ? (
                    <div className="space-y-4">
                        <RequestSkeleton />
                        <RequestSkeleton />
                    </div>
                ) : isError ? (
                     <FailureState message="No se pudieron cargar las peticiones de contenido." onRetry={refetch} />
                ) : filteredRequests.length > 0 ? (
                    <div className="space-y-4">
                        {filteredRequests.map(req => (
                            <div key={req.id} className="p-4 border dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                    <div className="flex-1 pr-0 sm:pr-4">
                                        <h3 className="text-lg font-bold text-primary break-words">{req.topic}</h3>
                                        <p className="text-slate-800 dark:text-slate-200 mt-1 break-words">{req.details}</p>
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end space-y-1 text-sm w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0">
                                        <p className="text-slate-600 dark:text-slate-400">
                                            {new Date(req.timestamp).toLocaleDateString()}
                                        </p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        De: <span className="font-normal text-slate-600 dark:text-slate-400">{req.studentName}</span>
                                    </p>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        {req.status === 'pending' && (
                                            <button 
                                                onClick={() => {
                                                    if (!checkApproval()) return;
                                                    updateStatusMutation.mutate({ requestId: req.id, status: 'completed' });
                                                }}
                                                disabled={updateStatusMutation.isPending}
                                                className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 flex-grow justify-center flex items-center"
                                            >
                                                {updateStatusMutation.isPending && updateStatusMutation.variables?.requestId === req.id ? (
                                                    <span className="flex items-center">
                                                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current mr-2"></span>
                                                        Procesando...
                                                    </span>
                                                ) : (
                                                    <>
                                                        <CheckCircleIcon className="w-4 h-4 mr-1.5 inline"/>
                                                        Marcar como completada
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {req.status === 'completed' && (
                                             <button 
                                                onClick={() => {
                                                    if (!checkApproval()) return;
                                                    updateStatusMutation.mutate({ requestId: req.id, status: 'pending' });
                                                }}
                                                disabled={updateStatusMutation.isPending}
                                                className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-50 flex-grow justify-center flex items-center"
                                             >
                                                 {updateStatusMutation.isPending && updateStatusMutation.variables?.requestId === req.id ? (
                                                     <span className="flex items-center">
                                                         <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current mr-2"></span>
                                                         Procesando...
                                                     </span>
                                                 ) : (
                                                     'Marcar como pendiente'
                                                 )}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (!checkApproval()) return;
                                                setRequestToDelete({ id: req.id, topic: req.topic });
                                            }}
                                            className="p-1.5 text-sm font-semibold rounded-md transition-colors bg-red-100 text-red-700 hover:bg-red-200 flex-shrink-0"
                                            aria-label="Eliminar petición"
                                        >
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<LightBulbIcon />}
                        title={getEmptyStateMessage().title}
                        description={getEmptyStateMessage().description}
                    />
                )}
            </div>

            <ConfirmationModal
                isOpen={!!requestToDelete}
                onClose={() => setRequestToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar eliminación"
                description={`¿Estás seguro de que quieres eliminar la petición para "${requestToDelete?.topic}"? Esta acción es irreversible.`}
                confirmText="Eliminar"
                isDestructive
                isLoading={deleteRequestMutation.isPending}
            />
        </div>
    );
};