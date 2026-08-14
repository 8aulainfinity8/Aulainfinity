import React, { useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../contexts/AuthContext';
import { StudentProgressContext } from '../contexts/StudentProgressContext';
import * as api from '../services/api';
import type { StudentUser, CourseLevel } from '../types';
import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';

export const GlobalProgressBar: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { watchedVideos } = useContext(StudentProgressContext);

    // Fetch all courses
    const { data: courses } = useQuery<CourseLevel[]>({
        queryKey: ['courses'],
        queryFn: api.fetchCourses,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

    // Only students have progressive study paths & watched history
    const isStudent = user?.role === 'student';

    const enrolledCourses = useMemo(() => {
        if (!user || !isStudent || !courses) return [];
        const student = user as StudentUser;
        return courses.filter(c => student.enrolledCourseIds && student.enrolledCourseIds.includes(c.id));
    }, [user, isStudent, courses]);

    const totalVideosInCourse = useMemo(() => {
        if (!enrolledCourses || enrolledCourses.length === 0) return 0;
        return enrolledCourses.reduce((courseSum, course) => {
            return courseSum + (course.subjects || []).reduce((subjectSum, subject) => {
                const directVideos = subject.videos?.length || 0;
                const blockVideos = subject.blocks?.reduce((blockSum, block) => blockSum + (block.videos?.length || 0), 0) || 0;
                return subjectSum + directVideos + blockVideos;
            }, 0);
        }, 0);
    }, [enrolledCourses]);

    const overallProgress = useMemo(() => {
        if (totalVideosInCourse === 0) return 0;
        return Math.round((watchedVideos.length / totalVideosInCourse) * 100);
    }, [watchedVideos, totalVideosInCourse]);

    if (!isStudent || totalVideosInCourse === 0) return null;

    return (
        <div id="global-progress-bar-container" className="w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 px-4 md:px-6 py-2 flex-shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-850 dark:text-slate-200">
                    <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="truncate" title={`Progreso general de tu curso: ${overallProgress}% completado (${watchedVideos.length} de ${totalVideosInCourse} clases vistas)`}>
                        Progreso general de tu curso: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{overallProgress}%</strong> completado
                    </span>
                    <span className="hidden md:inline-block text-[11px] text-slate-400 dark:text-slate-500">
                        ({watchedVideos.length} de {totalVideosInCourse} clases vistas)
                    </span>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-48 md:w-64">
                    <div className="flex-1 bg-slate-250 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${overallProgress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-primary h-full rounded-full"
                        />
                    </div>
                    <span className="text-[11px] font-bold text-indigo-650 dark:text-indigo-400 font-mono select-none shrink-0 min-w-[32px] text-right">
                        {overallProgress}%
                    </span>
                </div>
            </div>
        </div>
    );
};
