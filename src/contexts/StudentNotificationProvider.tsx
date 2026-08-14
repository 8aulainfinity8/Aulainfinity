

import React, { createContext, useEffect, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './AuthContext';
import { NotificationContext } from './NotificationContext';
import * as api from '../services/api';
import { eventEmitter } from '../services/eventService';
import { findVideoById } from '../data/database';
import type { Video, Comment as CommentType, StudentUser, CourseLevel, TutoringRequest } from '../types';

// This context is just a provider wrapper for background logic,
// it doesn't need to expose any values to consumers.
const StudentNotificationContext = createContext<null>(null);

export const StudentNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useContext(AuthContext);
    const { addToast } = useContext(NotificationContext);
    const queryClient = useQueryClient();

    // Fetch all comments once to know where the user has commented
    const { data: allComments } = useQuery<CommentType[]>({
        queryKey: ['allComments'],
        queryFn: api.fetchAllComments,
        enabled: !!user && user.role === 'student',
    });

    const { data: allCourses } = useQuery<CourseLevel[]>({
        queryKey: ['courses'],
        queryFn: api.fetchCourses,
        enabled: !!user && user.role === 'student',
    });


    useEffect(() => {
        if (!user || user.role !== 'student') return;

        // Handler for new video uploads
        const handleNewVideo = (newVideo: Video) => {
            if (!newVideo || !newVideo.title) return;
            console.log('New video detected by listener:', newVideo.title);
            addToast(`¡Nuevo vídeo disponible!: ${newVideo.title}`, 'info');
            // Invalidate courses query to make sure new videos show up without a refresh
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        };

        // Handler for new comments
        const handleNewComment = (newComment: CommentType) => {
            if (!newComment || !newComment.author || newComment.author.id === user.id) return; // Ignore user's own comments

            const userHasCommentedOnVideo = allComments?.some(
                comment => comment.videoId === newComment.videoId && comment.author?.id === user.id
            );

            if (userHasCommentedOnVideo) {
                const video = findVideoById(newComment.videoId, allCourses || []);
                const toastMessage = video 
                    ? `Nuevo comentario en "${video.title}"`
                    : 'Alguien ha respondido en un vídeo que comentaste.';
                addToast(toastMessage, 'info');
                 // Invalidate comments for the specific video if user is on that page
                queryClient.invalidateQueries({ queryKey: ['comments', newComment.videoId] });
            }
        };

        // Handler for tutoring status updates
        const handleTutoringUpdate = (tutoringRequest?: TutoringRequest | null) => {
            if (!tutoringRequest || !tutoringRequest.studentId) return;
            if (tutoringRequest.studentId === user.id && tutoringRequest.status !== 'pending') {
                addToast(`El estado de tu petición de tutoría de ${tutoringRequest.subject} ha cambiado a: ${tutoringRequest.status}`, 'info');
            }
        };

        eventEmitter.on('video-added', handleNewVideo);
        eventEmitter.on('comment-update', handleNewComment);
        eventEmitter.on('tutoring-update', handleTutoringUpdate);

        return () => {
            eventEmitter.off('video-added', handleNewVideo);
            eventEmitter.off('comment-update', handleNewComment);
            eventEmitter.off('tutoring-update', handleTutoringUpdate);
        };
    }, [user, addToast, allComments, queryClient, allCourses]);

    return (
        <StudentNotificationContext.Provider value={null}>
            {children}
        </StudentNotificationContext.Provider>
    );
};