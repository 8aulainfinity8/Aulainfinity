import React, { useMemo, useContext, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api';
import { ChevronLeftIcon, ChevronRightIcon, AcademicCapIcon } from './icons';
import { ROUTES, generateCourseLevelPath } from '../constants/routes';
import type { CourseLevel, StudentUser } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { useI18n } from '../hooks/useI18n';
import { Card, CardTitle, CardDescription } from './ui/Card';

const ModalityCard: React.FC<{ level: CourseLevel }> = ({ level }) => {
    const { t } = useI18n();
    const modalityName = level.name.replace(/^\d[º|º]\s*Bachillerato\s*de\s*/, '');

    return (
        <Link to={generateCourseLevelPath(level.id)} className="block group">
            <Card variant="interactive" padding="lg" className="h-full flex flex-col justify-between group-hover:border-primary/50">
                <div>
                    <div className="p-4 bg-primary/10 inline-block rounded-xl mb-4">
                        <AcademicCapIcon className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl group-hover:text-primary transition-colors leading-tight">{modalityName}</CardTitle>
                    <CardDescription className="mt-2 text-sm">{t('bachillerato.subjectsAvailable', { count: level.subjects?.length || 0 })}</CardDescription>
                </div>
                <div className="mt-6 text-primary font-semibold text-sm flex items-center pt-4 border-t border-slate-100 dark:border-slate-700/60 opacity-90 group-hover:opacity-100 transition-opacity">
                    <span>{t('common.viewSubject')}</span>
                    <ChevronRightIcon className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>
            </Card>
        </Link>
    );
};

export const BachilleratoPage: React.FC = () => {
    const { t } = useI18n();
    const { year } = useParams<{ year: string }>();
    const navigate = useNavigate();
    const handleBack = useBackNavigation();
    const { user } = useContext(AuthContext);

    const { data: courses, isLoading } = useQuery<CourseLevel[]>({
        queryKey: ['courses'],
        queryFn: api.fetchCourses
    });

    useEffect(() => {
        if (user && user.role === 'student') {
            const student = user as StudentUser;
            const bachCourseId = student.enrolledCourseIds?.find(id => id.startsWith('bach_'));
            if (bachCourseId) {
                navigate(generateCourseLevelPath(bachCourseId), { replace: true });
            }
        }
    }, [user, navigate]);

    const bachilleratoLevels = useMemo(() => {
        if (!courses || !year) return [];
        const regex = new RegExp(`^${year}[º|º]\\s*Bachillerato`);
        return courses.filter(level => regex.test(level.name));
    }, [courses, year]);

    if (isLoading) {
        return (
            <div className="text-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-400">{t('bachillerato.loadingModalities')}</p>
            </div>
        );
    }

    if (!bachilleratoLevels || bachilleratoLevels.length === 0) {
        return <div className="text-center p-8 text-red-500 font-semibold">{t('bachillerato.noCoursesFound')}</div>;
    }

    const pageTitle = `${year}º Bachillerato`;

    return (
        <div className="animate-slide-in-up">
            <div className="flex justify-between items-center mb-4">
                 <button onClick={handleBack} aria-label={t('common.goBack')} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" />{t('common.goBack')}
                </button>
                <nav className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Link to={ROUTES.DASHBOARD} className="hover:text-primary flex-shrink-0">{t('sidebar.dashboard')}</Link>
                    <ChevronRightIcon className="w-4 h-4 mx-1 flex-shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[120px] sm:max-w-xs md:max-w-md inline-block align-bottom" title={pageTitle}>{pageTitle}</span>
                </nav>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2 break-words leading-tight">{t('bachillerato.title')}</h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-8 break-words leading-normal">{t('bachillerato.subtitle', { year: year || '' })}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {bachilleratoLevels.map(level => (
                    <ModalityCard key={level.id} level={level} />
                ))}
            </div>
        </div>
    );
};
