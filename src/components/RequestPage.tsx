import React, { useContext, useMemo } from 'react';
// FIX: Corrected react-router-dom import for useNavigate.
import { useForm, SubmitHandler } from 'react-hook-form';
// FIX: Corrected import path.
import * as api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { useI18n } from '../hooks/useI18n';
// FIX: Corrected import path.
import { ChevronLeftIcon, LightBulbIcon } from './icons';
// FIX: Corrected import path.
import type { StudentUser, CourseLevel } from '../types';
import { SubscriptionGate } from './SubscriptionGate';
// FIX: Corrected import path.
import { useQuery } from '@tanstack/react-query';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { AdminRequestsPage } from './admin/AdminRequestsPage';

interface IFormInput {
  topic: string;
  details: string;
  subjectId?: string;
}

export const RequestPage: React.FC = () => {
    const { t } = useI18n();
    const { user } = useContext(AuthContext);

    if (user?.role === 'teacher' || user?.role === 'admin') {
        return <AdminRequestsPage />;
    }

    const { addToast } = useContext(NotificationContext);
    const handleBack = useBackNavigation();
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<IFormInput>();

    const { data: courses } = useQuery<CourseLevel[]>({ queryKey: ['courses'], queryFn: api.fetchCourses });

    const enrolledCourseSubjects = useMemo(() => {
        if (!user || user.role !== 'student' || !courses) return [];
        const student = user as StudentUser;
        const coursesForStudent = courses.filter(c => student.enrolledCourseIds && student.enrolledCourseIds.includes(c.id));
        return coursesForStudent.flatMap(c => c.subjects || []);
    }, [user, courses]);

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        if (!user || user.role !== 'student') return;

        try {
            await api.submitTopicRequest({
                studentId: user.id,
                studentName: user.name,
                topic: data.topic,
                details: data.details,
                subjectId: data.subjectId || undefined,
            });
            addToast('¡Petición enviada! Gracias por tu sugerencia.', 'success');
            reset();
        } catch (error) {
            addToast('Error al enviar la petición. Inténtalo de nuevo.', 'error');
        }
    };

    return (
        <SubscriptionGate>
            <div className="max-w-2xl mx-auto animate-slide-in-up">
                <button onClick={handleBack} aria-label={t('common.back')} className="flex items-center mb-6 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" />{t('common.back')}
                </button>
                <div className="text-center mb-8">
                    <LightBulbIcon className="w-16 h-16 text-primary mx-auto"/>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mt-4">{t('requests.title')}</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                        {t('requests.subtitle')}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label htmlFor="topic" className="block text-sm font-medium text-slate-900 dark:text-slate-300">
                                Tema o Concepto
                            </label>
                            <input
                                type="text"
                                id="topic"
                                aria-invalid={errors.topic ? "true" : "false"}
                                aria-required="true"
                                {...register("topic", { required: "El tema es obligatorio" })}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100"
                                placeholder="Ej: Integrales por partes"
                            />
                            {errors.topic && <p className="mt-1 text-sm text-red-600">{errors.topic.message}</p>}
                        </div>

                         <div>
                            <label htmlFor="subjectId" className="block text-sm font-medium text-slate-900 dark:text-slate-300">
                                Asignatura (opcional)
                            </label>
                            <select
                                id="subjectId"
                                aria-invalid={errors.subjectId ? "true" : "false"}
                                {...register("subjectId")}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100"
                            >
                                <option value="">General / No estoy seguro</option>
                                {enrolledCourseSubjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="details" className="block text-sm font-medium text-slate-900 dark:text-slate-300">
                                Detalles adicionales (opcional)
                            </label>
                            <textarea
                                id="details"
                                aria-invalid={errors.details ? "true" : "false"}
                                rows={4}
                                {...register("details")}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100"
                                placeholder="Ej: Me gustaría ver más ejemplos del caso..."
                            ></textarea>
                        </div>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Revisamos todas las peticiones y priorizamos los temas más solicitados para futuros vídeos.
                        </p>

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50"
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar Petición'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </SubscriptionGate>
    );
};