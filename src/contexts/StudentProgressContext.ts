

import React, { createContext, useState, useCallback, useEffect, ReactNode, useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { StudentUser } from '../types';
import * as api from '../services/api';

interface StudentProgressContextType {
  watchedVideos: string[];
  markVideoAsWatched: (videoId: string) => void;
  favoriteVideos: string[];
  toggleFavoriteVideo: (videoId: string) => void;
}

export const StudentProgressContext = createContext<StudentProgressContextType>({
  watchedVideos: [],
  markVideoAsWatched: () => {},
  favoriteVideos: [],
  toggleFavoriteVideo: () => {},
});

// FIX: Added StudentProgressProvider to manage student progress state.
export const StudentProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, updateUser } = useContext(AuthContext);
    const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
    const [favoriteVideos, setFavoriteVideos] = useState<string[]>([]);

    // Sync local state from the AuthContext user object. This is now the source of truth.
    useEffect(() => {
        if (user && user.role === 'student') {
            setWatchedVideos((user as StudentUser).watchedVideos || []);
        } else {
            setWatchedVideos([]);
        }
        if (user) {
            setFavoriteVideos((user as any).favoriteVideos || []);
        } else {
            setFavoriteVideos([]);
        }
    }, [user]);


    const markVideoAsWatched = useCallback(async (videoId: string) => {
        // Prevent action if not a student, or if video is already watched
        if (!user || user.role !== 'student' || (user as StudentUser).watchedVideos.includes(videoId)) {
            return;
        }
        
        // Create the optimistic user state
        const updatedWatchedVideos = [...(user as StudentUser).watchedVideos, videoId];
        const optimisticUser = { ...user, watchedVideos: updatedWatchedVideos };

        // Optimistically update the global user state for immediate UI feedback
        updateUser(optimisticUser as StudentUser);

        try {
            // Persist the change to the backend. The API returns the *fully updated* user from the database.
            const userFromServer = await api.addWatchedVideo(user.id, videoId);
            // Re-sync with the server's source of truth. This handles any potential race conditions or server-side logic.
            updateUser(userFromServer);
        } catch (error) {
            console.error("Failed to save watched video progress:", error);
            // If the API call fails, roll back to the original user state.
            updateUser(user);
            // In a real app, you would show a toast notification to the user here.
        }
    }, [user, updateUser]);

    const toggleFavoriteVideo = useCallback(async (videoId: string) => {
        if (!user || !user.id) return;
        
        const currentFavorites = Array.isArray((user as any).favoriteVideos) ? [...(user as any).favoriteVideos] : [];
        const isFavorite = currentFavorites.includes(videoId);
        const updatedFavorites = isFavorite
            ? currentFavorites.filter(id => id !== videoId)
            : [...currentFavorites, videoId];
            
        const optimisticUser = { ...user, favoriteVideos: updatedFavorites };
        updateUser(optimisticUser);
        
        try {
            const userFromServer = await api.toggleFavoriteVideo(user.id, videoId);
            if (userFromServer) {
                updateUser(userFromServer);
            }
        } catch (error) {
            console.error("Failed to save favorite video progress:", error);
            updateUser(user);
        }
    }, [user, updateUser]);

    const value = { watchedVideos, markVideoAsWatched, favoriteVideos, toggleFavoriteVideo };

    // FIX: Replaced JSX with React.createElement to resolve parsing errors in .ts file.
    return React.createElement(StudentProgressContext.Provider, { value: value }, children);
};