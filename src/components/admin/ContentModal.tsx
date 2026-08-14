import React, { useState } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../services/api';
import { iconMap } from '../iconMap';
import type { CourseLevel, Subject, Video, NewCourseLevelData, NewSubjectData, NewVideoData, VideoBlock, NewVideoBlockData } from '../../types';
import { CloseIcon, TrashIcon, PlusCircleIcon, YouTubeIcon } from '../icons';
import { NotificationContext } from '../../contexts/NotificationContext';
import { FormInput, FormTextarea, FormSelect } from '../ui/Forms';
import { Button } from '../ui/Button';
import { YouTubeSearchModal } from './YouTubeSearchModal';
import { VideoUploadField } from './VideoUploadField';
import { saveVideoDocumentToFirestore } from '../../services/storageService';



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

// --- FORMS ---

const LevelForm: React.FC<{level?: CourseLevel, onSuccess: () => void}> = ({ level, onSuccess }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<NewCourseLevelData>({ defaultValues: { name: level?.name ?? '' }});
    const isEditing = !!level;

    const addMutation = useMutation({ mutationFn: api.addLevel, onSuccess });
    const updateMutation = useMutation({ mutationFn: (data: { name: string }) => api.updateLevel(level!.id, data), onSuccess });

    const onSubmit = (data: NewCourseLevelData) => {
        if (isEditing) {
            updateMutation.mutate(data);
        } else {
            addMutation.mutate(data);
        }
    };
    
    const isLoading = addMutation.isPending || updateMutation.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput label="Nombre del Nivel" id="name" register={register("name", { required: "El nombre es obligatorio" })} error={errors.name?.message} />
            <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:bg-primary/50">
                {isLoading ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Añadir Nivel')}
            </button>
        </form>
    );
}

const SubjectForm: React.FC<{levelId: string, subject?: Subject, onSuccess: () => void}> = ({ levelId, subject, onSuccess }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<NewSubjectData>({ defaultValues: subject ?? { name: '', icon: 'BookOpenIcon' }});
    const isEditing = !!subject;

    const addMutation = useMutation({ mutationFn: (data: NewSubjectData) => api.addSubject(levelId, data), onSuccess });
    const updateMutation = useMutation({ mutationFn: (data: NewSubjectData) => api.updateSubject(levelId, subject!.id, data), onSuccess });

    const onSubmit: SubmitHandler<NewSubjectData> = (data) => {
        if (isEditing) {
            updateMutation.mutate(data);
        } else {
            addMutation.mutate(data);
        }
    };

    const isLoading = addMutation.isPending || updateMutation.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput label="Nombre de la Asignatura" id="name" register={register("name", { required: "El nombre es obligatorio" })} error={errors.name?.message} />
            <FormSelect label="Icono" id="icon" register={register("icon", { required: "El icono es obligatorio" })} error={errors.icon?.message}>
                {Object.keys(iconMap).map(iconName => (
                    <option key={iconName} value={iconName}>{iconName.replace('Icon', '')}</option>
                ))}
            </FormSelect>
            <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:bg-primary/50">
                {isLoading ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Añadir Asignatura')}
            </button>
        </form>
    );
}

const BlockForm: React.FC<{levelId: string, subjectId: string, block?: VideoBlock, onSuccess: () => void}> = ({ levelId, subjectId, block, onSuccess }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<NewVideoBlockData>({ defaultValues: { name: block?.name ?? '' }});
    const isEditing = !!block;

    const addMutation = useMutation({ mutationFn: (data: NewVideoBlockData) => api.addBlock(levelId, subjectId, data), onSuccess });
    const updateMutation = useMutation({ mutationFn: (data: NewVideoBlockData) => api.updateBlock(levelId, subjectId, block!.id, data), onSuccess });

    const onSubmit: SubmitHandler<NewVideoBlockData> = (data) => {
        if (isEditing) {
            updateMutation.mutate(data);
        } else {
            addMutation.mutate(data);
        }
    };
    
    const isLoading = addMutation.isPending || updateMutation.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput label="Nombre del Bloque" id="name" register={register("name", { required: "El nombre es obligatorio" })} error={errors.name?.message} />
            <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:bg-primary/50">
                {isLoading ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Añadir Bloque')}
            </button>
        </form>
    );
}

const EditVideoForm: React.FC<{levelId: string, subjectId: string, video: Video, blockId?: string, onSuccess: () => void, onOpenYouTubeSearch: (query: string, onSelect: (id: string) => void) => void}> = ({ levelId, subjectId, video, blockId, onSuccess, onOpenYouTubeSearch }) => {
    const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm<NewVideoData>({ 
        defaultValues: {
            ...video,
            youtubeLinks: video?.youtubeLinks ?? [],
            resources: video?.resources ?? [],
        }
    });
    const watchedTitle = watch("title");
    const watchedYoutubeLinks = watch("youtubeLinks");

    const { fields: resourceFields, append: appendResource, remove: removeResource } = useFieldArray({
        control,
        name: "resources"
    });
    
    const { fields: youtubeFields, append: appendYoutube, remove: removeYoutube } = useFieldArray({
        control,
        name: "youtubeLinks"
    });

    const updateMutation = useMutation({ mutationFn: (data: NewVideoData) => api.updateVideo(levelId, subjectId, video.id, data, blockId), onSuccess });
    
    const onSubmit: SubmitHandler<NewVideoData> = (data) => {
        const filteredLinks = (data.youtubeLinks || [])
            .filter(r => (r.youtubeId && r.youtubeId.trim() !== '') || (r.videoUrl && r.videoUrl.trim() !== ''))
            .map((r, idx) => ({
                ...r,
                title: (r.title && r.title.trim() !== '')
                    ? r.title.trim()
                    : (r.videoFileName || (r.videoUrl ? 'Vídeo de Firebase' : `Vídeo ${idx + 1}`))
            }));

        const filteredData = {
            ...data,
            youtubeLinks: filteredLinks,
            resources: data.resources?.filter(r => r.name && r.url)
        };

        // Guardar documento en colección 'videos' de Firestore para cualquier vídeo subido
        filteredLinks.forEach(link => {
            if (link.videoUrl) {
                saveVideoDocumentToFirestore({
                    id: video.id,
                    title: data.title || link.title,
                    category: data.topic || 'General',
                    videoUrl: link.videoUrl,
                    videoFileName: link.videoFileName,
                    topic: data.topic,
                    levelId,
                    subjectId,
                    blockId,
                    createdAt: video.createdAt || new Date().toISOString()
                });
            }
        });

        updateMutation.mutate(filteredData);
    };
    
    const isLoading = updateMutation.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormInput label="Título de la Lección" id="title" register={register("title", { required: "El título es obligatorio" })} error={errors.title?.message} />
            <FormTextarea label="Descripción" id="description" register={register("description", { required: "La descripción es obligatoria" })} error={errors.description?.message} />
            <FormInput label="Tema Principal (para IA)" id="topic" register={register("topic", { required: "El tema es obligatorio" })} error={errors.topic?.message} placeholder="Teorema de Pitágoras" />
            <FormInput label="Página del libro (opcional)" id="page" type="number" register={register("page", { valueAsNumber: true })} error={errors.page?.message} />
            
            {/* YouTube Links */}
            <div className="border-t dark:border-slate-700 pt-4">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Vídeos de la Lección (YouTube o Archivo Subido)</h3>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {youtubeFields.map((field, index) => (
                        <div key={field.id} className="p-4 pt-6 border dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50 relative">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput 
                                    label="Título del Vídeo (ej: Teoría)" 
                                    id={`youtube-title-${index}`}
                                    register={register(`youtubeLinks.${index}.title` as const, { required: true })}
                                    error={errors.youtubeLinks?.[index]?.title?.message}
                                />
                                <FormInput 
                                    label="ID de YouTube o Playlist"
                                    id={`youtube-id-${index}`}
                                    register={register(`youtubeLinks.${index}.youtubeId` as const, { required: false })}
                                    error={errors.youtubeLinks?.[index]?.youtubeId?.message}
                                    buttonIcon={<YouTubeIcon className="w-5 h-5 text-red-600"/>}
                                    onButtonClick={() => onOpenYouTubeSearch(
                                        watchedTitle || '',
                                        (videoId) => setValue(`youtubeLinks.${index}.youtubeId`, videoId, { shouldDirty: true })
                                    )}
                                    buttonAriaLabel="Buscar vídeo en YouTube"
                                />
                            </div>
                            <VideoUploadField
                                currentUrl={watchedYoutubeLinks?.[index]?.videoUrl}
                                currentFileName={watchedYoutubeLinks?.[index]?.videoFileName}
                                videoTitle={watchedTitle || video.title}
                                category={watch("topic") || video.topic || 'General'}
                                onUploadSuccess={(url, fileName) => {
                                    setValue(`youtubeLinks.${index}.videoUrl`, url, { shouldDirty: true });
                                    setValue(`youtubeLinks.${index}.videoFileName`, fileName, { shouldDirty: true });
                                }}
                                onRemove={() => {
                                    setValue(`youtubeLinks.${index}.videoUrl`, undefined, { shouldDirty: true });
                                    setValue(`youtubeLinks.${index}.videoFileName`, undefined, { shouldDirty: true });
                                }}
                            />
                            <button type="button" onClick={() => removeYoutube(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={() => appendYoutube({ title: '', youtubeId: '' })} className="mt-3 flex items-center px-3 py-1.5 border border-dashed border-gray-400 dark:border-slate-500 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"><PlusCircleIcon className="w-5 h-5 mr-2" />Añadir Vídeo o Parte</button>
            </div>
            
            {/* Resources */}
            <div className="border-t dark:border-slate-700 pt-4">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Recursos PDF</h3>
                <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                    {resourceFields.map((field, index) => (
                        <div key={field.id} className="p-4 pt-6 border dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50 relative">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput label="Título del Recurso" id={`resource-name-${index}`} register={register(`resources.${index}.name` as const)} error={errors.resources?.[index]?.name?.message} placeholder="Ej: Ejercicios Propuestos" />
                                <FormInput label="URL del PDF" id={`resource-url-${index}`} register={register(`resources.${index}.url` as const)} error={errors.resources?.[index]?.url?.message} placeholder="/pdfs/archivo.pdf" />
                            </div>
                            <button type="button" onClick={() => removeResource(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={() => appendResource({ name: '', url: '' })} className="mt-3 flex items-center px-3 py-1.5 border border-dashed border-gray-400 dark:border-slate-500 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"><PlusCircleIcon className="w-5 h-5 mr-2" />Añadir Recurso PDF</button>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:bg-primary/50 mt-6">
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
        </form>
    );
}

const MultiVideoForm: React.FC<{levelId: string, subjectId: string, blockId?: string, onSuccess: () => void, onOpenYouTubeSearch: (query: string, onSelect: (id: string) => void) => void}> = ({ levelId, subjectId, blockId, onSuccess, onOpenYouTubeSearch }) => {
    const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm<{ videos: NewVideoData[] }>({
        defaultValues: {
            videos: [{ title: '', description: '', youtubeLinks: [{title: 'Vídeo Principal', youtubeId: ''}], topic: '', resources: [] }]
        }
    });
    const watchedVideos = watch("videos");

    const { fields, append, remove } = useFieldArray({
        control,
        name: "videos"
    });

    const addMutation = useMutation({ 
        mutationFn: (data: NewVideoData[]) => api.addVideos(levelId, subjectId, data, blockId), 
        onSuccess 
    });

    const onSubmit: SubmitHandler<{ videos: NewVideoData[] }> = (data) => {
        const validVideos = data.videos.map(v => {
            const filteredLinks = (v.youtubeLinks || [])
                .filter(r => (r.youtubeId && r.youtubeId.trim() !== '') || (r.videoUrl && r.videoUrl.trim() !== ''))
                .map((r, idx) => ({
                    ...r,
                    title: (r.title && r.title.trim() !== '')
                        ? r.title.trim()
                        : (r.videoFileName || (r.videoUrl ? 'Vídeo de Firebase' : `Vídeo ${idx + 1}`))
                }));

            // Guardar en colección 'videos' de Firestore
            filteredLinks.forEach(link => {
                if (link.videoUrl) {
                    saveVideoDocumentToFirestore({
                        title: v.title || link.title,
                        category: v.topic || 'General',
                        videoUrl: link.videoUrl,
                        videoFileName: link.videoFileName,
                        topic: v.topic,
                        levelId,
                        subjectId,
                        blockId,
                        createdAt: new Date().toISOString()
                    });
                }
            });

            return {
                ...v,
                youtubeLinks: filteredLinks
            };
        });
        addMutation.mutate(validVideos);
    };

    const isLoading = addMutation.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50 relative">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Lección {index + 1}</h3>
                        <div className="space-y-4">
                            <FormInput 
                                label="Título de la Lección" 
                                id={`video-title-${index}`} 
                                register={register(`videos.${index}.title` as const, { required: "El título es obligatorio" })} 
                                error={errors.videos?.[index]?.title?.message} 
                            />
                            <FormTextarea 
                                label="Descripción" 
                                id={`video-description-${index}`} 
                                register={register(`videos.${index}.description` as const, { required: "La descripción es obligatoria" })} 
                                error={errors.videos?.[index]?.description?.message} 
                            />
                             <FormInput 
                                label="ID de YouTube (o subir archivo abajo)" 
                                id={`video-youtubeId-${index}`} 
                                register={register(`videos.${index}.youtubeLinks.0.youtubeId` as const, { required: false })} 
                                error={errors.videos?.[index]?.youtubeLinks?.[0]?.youtubeId?.message}
                                placeholder="dQw4w9WgXcQ o videoseries?list=..."
                                buttonIcon={<YouTubeIcon className="w-5 h-5 text-red-600"/>}
                                onButtonClick={() => onOpenYouTubeSearch(
                                    watchedVideos[index]?.title || '', 
                                    (videoId) => setValue(`videos.${index}.youtubeLinks.0.youtubeId`, videoId, { shouldDirty: true })
                                )}
                                buttonAriaLabel="Buscar vídeo en YouTube"
                            />
                            <VideoUploadField
                                currentUrl={watchedVideos?.[index]?.youtubeLinks?.[0]?.videoUrl}
                                currentFileName={watchedVideos?.[index]?.youtubeLinks?.[0]?.videoFileName}
                                videoTitle={watchedVideos?.[index]?.title}
                                category={watchedVideos?.[index]?.topic || 'General'}
                                onUploadSuccess={(url, fileName) => {
                                    setValue(`videos.${index}.youtubeLinks.0.videoUrl`, url, { shouldDirty: true });
                                    setValue(`videos.${index}.youtubeLinks.0.videoFileName`, fileName, { shouldDirty: true });
                                }}
                                onRemove={() => {
                                    setValue(`videos.${index}.youtubeLinks.0.videoUrl`, undefined, { shouldDirty: true });
                                    setValue(`videos.${index}.youtubeLinks.0.videoFileName`, undefined, { shouldDirty: true });
                                }}
                            />
                             <FormInput 
                                label="Tema Principal (para IA)" 
                                id={`video-topic-${index}`} 
                                register={register(`videos.${index}.topic` as const, { required: "El tema es obligatorio" })} 
                                error={errors.videos?.[index]?.topic?.message} 
                                placeholder="Teorema de Pitágoras"
                            />
                        </div>

                        {fields.length > 1 && (
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                                aria-label="Eliminar lección"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            
            <Button
                type="button"
                variant="secondary"
                onClick={() => append({ title: '', description: '', youtubeLinks: [{title: 'Vídeo Principal', youtubeId: ''}], topic: '', resources: [] })}
                className="w-full"
            >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Añadir otra lección
            </Button>
            
            <Button type="submit" isLoading={isLoading} className="w-full mt-4">
                {isLoading ? 'Añadiendo...' : `Añadir ${fields.length} Lección(es)`}
            </Button>
        </form>
    );
}

// --- MAIN MODAL COMPONENT ---

export const ContentModal: React.FC<{modalState: ModalState, onClose: () => void}> = ({ modalState, onClose }) => {
    const queryClient = useQueryClient();
    const { addToast } = React.useContext(NotificationContext);
    const [isYouTubeSearchOpen, setIsYouTubeSearchOpen] = useState(false);
    const [youTubeSearchState, setYouTubeSearchState] = useState<{
        initialQuery: string;
        onSelect: (videoId: string) => void;
    } | null>(null);

    const openYouTubeSearch = (initialQuery: string, onSelect: (videoId: string) => void) => {
        setYouTubeSearchState({ initialQuery, onSelect });
        setIsYouTubeSearchOpen(true);
    };
    
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            addToast('Contenido actualizado con éxito.', 'success');
            onClose();
        },
        onError: (err: Error) => {
            addToast(`Error: ${err.message}`, 'error');
        },
    };

    if (!modalState) return null;

    const renderContent = () => {
        switch (modalState.type) {
            case 'add-level':
                return { title: 'Añadir Nuevo Nivel', form: <LevelForm onSuccess={mutationOptions.onSuccess} /> };
            case 'edit-level':
                return { title: `Editar Nivel: ${modalState.data.name}`, form: <LevelForm level={modalState.data} onSuccess={mutationOptions.onSuccess} /> };
            case 'add-subject':
                return { title: 'Añadir Nueva Asignatura', form: <SubjectForm levelId={modalState.data.levelId} onSuccess={mutationOptions.onSuccess} /> };
            case 'edit-subject':
                return { title: `Editar Asignatura: ${modalState.data.subject.name}`, form: <SubjectForm levelId={modalState.data.levelId} subject={modalState.data.subject} onSuccess={mutationOptions.onSuccess} /> };
            case 'add-video':
                 return { title: 'Añadir Nuevas Lecciones', form: <MultiVideoForm levelId={modalState.data.levelId} subjectId={modalState.data.subjectId} blockId={modalState.data.blockId} onSuccess={mutationOptions.onSuccess} onOpenYouTubeSearch={openYouTubeSearch} /> };
            case 'edit-video':
                 return { title: `Editar Lección: ${modalState.data.video.title}`, form: <EditVideoForm levelId={modalState.data.levelId} subjectId={modalState.data.subjectId} video={modalState.data.video} blockId={modalState.data.blockId} onSuccess={mutationOptions.onSuccess} onOpenYouTubeSearch={openYouTubeSearch} /> };
            case 'add-block':
                return { title: 'Añadir Nuevo Bloque', form: <BlockForm levelId={modalState.data.levelId} subjectId={modalState.data.subjectId} onSuccess={mutationOptions.onSuccess} /> };
            case 'edit-block':
                return { title: `Editar Bloque: ${modalState.data.block.name}`, form: <BlockForm levelId={modalState.data.levelId} subjectId={modalState.data.subjectId} block={modalState.data.block} onSuccess={mutationOptions.onSuccess} /> };
            default:
                return { title: '', form: null };
        }
    };
    
    const { title, form } = renderContent();

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 p-6 pb-0">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        {form}
                    </div>
                </div>
            </div>
             {isYouTubeSearchOpen && youTubeSearchState && (
                <YouTubeSearchModal
                    isOpen={isYouTubeSearchOpen}
                    onClose={() => setIsYouTubeSearchOpen(false)}
                    initialQuery={youTubeSearchState.initialQuery}
                    onSelectVideo={youTubeSearchState.onSelect}
                />
            )}
        </>
    );
};