// FIX: Implemented the QuizModal component to allow admins to create, edit, and generate quizzes for videos. This resolves the module and parsing errors.
import React, { useEffect, useContext } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../services/api';
import type { Quiz, NewQuestionData, NewQuizData, CourseLevel } from '../../types';
import { CloseIcon, TrashIcon, PlusCircleIcon, SparklesIcon } from '../icons';
import { NotificationContext } from '../../contexts/NotificationContext';
import { Button } from '../ui/Button';
import { FormInput, FormTextarea } from '../ui/Forms';

interface QuizModalProps {
    videoId: string;
    topic: string;
    onClose: () => void;
}

interface IQuizFormInput {
    questions: NewQuestionData[];
}

export const QuizModal: React.FC<QuizModalProps> = ({ videoId, topic, onClose }) => {
    const queryClient = useQueryClient();
    const { addToast } = useContext(NotificationContext);
    
    const [selectedTargetVideoId, setSelectedTargetVideoId] = React.useState<string>('');
    const [isCopying, setIsCopying] = React.useState(false);

    const { data: courses } = useQuery<CourseLevel[]>({
        queryKey: ['courses'],
        queryFn: api.fetchCourses,
    });

    const allVideos = React.useMemo(() => {
        if (!courses) return [];
        const videosList: Array<{ id: string; title: string; courseName: string }> = [];
        courses.forEach(course => {
            course.subjects.forEach(subject => {
                subject.videos?.forEach(v => {
                    if (v.id !== videoId) {
                        videosList.push({ id: v.id, title: v.title, courseName: `${course.name} - ${subject.name}` });
                    }
                });
                subject.blocks?.forEach(block => {
                    block.videos?.forEach(v => {
                        if (v.id !== videoId) {
                            videosList.push({ id: v.id, title: v.title, courseName: `${course.name} - ${subject.name} [${block.name}]` });
                        }
                    });
                });
            });
        });
        return videosList;
    }, [courses, videoId]);

    const { data: existingQuiz, isLoading: isQuizLoading } = useQuery<Quiz | null>({
        queryKey: ['quiz', videoId],
        queryFn: () => api.fetchQuizByVideoId(videoId),
    });

    const { register, control, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<IQuizFormInput>({
        defaultValues: { questions: [] }
    });

    useEffect(() => {
        if (existingQuiz) {
            reset({ questions: existingQuiz.questions });
        } else {
            reset({ questions: [] });
        }
    }, [existingQuiz, reset]);

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "questions"
    });

    const handleDuplicateQuiz = async () => {
        if (!selectedTargetVideoId) {
            addToast('Por favor, selecciona una lección de destino.', 'error');
            return;
        }
        if (fields.length === 0) {
            addToast('No hay preguntas en el quiz actual para duplicar.', 'error');
            return;
        }
        setIsCopying(true);
        try {
            await api.saveQuiz({
                videoId: selectedTargetVideoId,
                questions: fields.map(f => ({
                    text: f.text,
                    options: f.options,
                    correctAnswerIndex: f.correctAnswerIndex,
                    explanation: f.explanation || ''
                }))
            });
            const targetVideoName = allVideos.find(v => v.id === selectedTargetVideoId)?.title || '';
            addToast(`Quiz duplicado con éxito en la lección "${targetVideoName}".`, 'success');
            setSelectedTargetVideoId('');
        } catch (error: any) {
            addToast(`Error al duplicar el quiz: ${error.message}`, 'error');
        } finally {
            setIsCopying(false);
        }
    };

    const saveQuizMutation = useMutation({
        mutationFn: (data: NewQuizData) => api.saveQuiz(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quiz', videoId] });
            addToast('Quiz guardado con éxito.', 'success');
            onClose();
        },
        onError: (err: Error) => {
            addToast(`Error al guardar el quiz: ${err.message}`, 'error');
        }
    });

    // FIX: Typed the useMutation hook to resolve errors with the 'data' parameter in onSuccess.
    const generateQuizMutation = useMutation<{ questions: NewQuestionData[] }, Error, void>({
        mutationFn: () => api.generateQuizWithAI(topic),
        onSuccess: (data) => {
            if (data.questions && data.questions.length > 0) {
                append(data.questions);
                addToast('Nuevas preguntas generadas con IA.', 'info');
            } else {
                addToast('La IA no pudo generar preguntas para este tema.', 'error');
            }
        },
        onError: (err: Error) => {
            addToast(`Error al generar con IA: ${err.message}`, 'error');
        }
    });

    const onSubmit: SubmitHandler<IQuizFormInput> = (data) => {
        const quizData: NewQuizData = {
            videoId,
            questions: data.questions,
        };
        saveQuizMutation.mutate(quizData);
    };

    const isLoading = isQuizLoading || saveQuizMutation.isPending || generateQuizMutation.isPending;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestionar Quiz</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                        <CloseIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                    <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                        {/* Copia Rápida de Evaluaciones */}
                        {fields.length > 0 && allVideos.length > 0 && (
                            <div className="p-4 border border-indigo-100 dark:border-slate-700 bg-indigo-50/40 dark:bg-slate-900/40 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <span>📋</span> Copia Rápida de Evaluación
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Duplica este cuestionario para asignarlo a otra lección con un solo clic.</p>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <select
                                        value={selectedTargetVideoId}
                                        onChange={(e) => setSelectedTargetVideoId(e.target.value)}
                                        className="text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none w-full md:w-64"
                                    >
                                        <option value="">-- Seleccionar lección de destino --</option>
                                        {allVideos.map(v => (
                                            <option key={v.id} value={v.id}>{v.courseName} › {v.title}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleDuplicateQuiz}
                                        disabled={isCopying || !selectedTargetVideoId}
                                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                        {isCopying ? 'Copiando...' : 'Copiar Quiz'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50 space-y-4 relative">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200">Pregunta {index + 1}</h3>
                                
                                <FormTextarea
                                    label="Texto de la Pregunta"
                                    id={`question-text-${index}`}
                                    register={register(`questions.${index}.text` as const, { required: "El texto es obligatorio" })}
                                    error={errors.questions?.[index]?.text?.message}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    {Array.from({ length: 4 }).map((_, optionIndex) => (
                                        <FormInput
                                            key={optionIndex}
                                            label={`Opción ${optionIndex + 1}`}
                                            id={`option-${index}-${optionIndex}`}
                                            register={register(`questions.${index}.options.${optionIndex}` as const, { required: "La opción es obligatoria" })}
                                            error={errors.questions?.[index]?.options?.[optionIndex]?.message}
                                        />
                                    ))}
                                </div>
                                
                                <FormInput
                                    label="Número de Respuesta Correcta (1-4)"
                                    id={`correct-answer-${index}`}
                                    type="number"
                                    min="1"
                                    max="4"
                                    register={register(`questions.${index}.correctAnswerIndex` as const, {
                                        required: "El número es obligatorio",
                                        valueAsNumber: true,
                                        min: { value: 1, message: "Debe ser entre 1 y 4" },
                                        max: { value: 4, message: "Debe ser entre 1 y 4" }
                                    })}
                                    error={errors.questions?.[index]?.correctAnswerIndex?.message}
                                />
                                
                                <FormTextarea
                                    label="Explicación (opcional)"
                                    id={`explanation-${index}`}
                                    register={register(`questions.${index}.explanation` as const)}
                                    error={errors.questions?.[index]?.explanation?.message}
                                />

                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => append({ text: '', options: ['', '', '', ''], correctAnswerIndex: 1, explanation: '' })}
                            className="w-full flex items-center justify-center py-2 px-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                            Añadir Pregunta
                        </button>
                    </div>
                    
                    <div className="flex justify-between items-center p-6 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                        <Button
                            type="button"
                            onClick={() => generateQuizMutation.mutate()}
                            isLoading={generateQuizMutation.isPending}
                            variant="secondary"
                        >
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {generateQuizMutation.isPending ? 'Generando...' : 'Generar más con IA'}
                        </Button>
                        <Button type="submit" isLoading={isLoading} disabled={!isDirty}>
                            {saveQuizMutation.isPending ? 'Guardando...' : 'Guardar Quiz'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};