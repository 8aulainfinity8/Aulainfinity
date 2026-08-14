import React, { useState, useEffect, useContext } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as api from '../../services/api';
import { CloseIcon, SearchIcon, YouTubeIcon } from '../icons';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { NotificationContext } from '../../contexts/NotificationContext';

interface YouTubeSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectVideo: (videoId: string) => void;
    initialQuery?: string;
}

interface VideoResult {
    title: string;
    videoId: string;
}

export const YouTubeSearchModal: React.FC<YouTubeSearchModalProps> = ({ isOpen, onClose, onSelectVideo, initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery);
    const { addToast } = useContext(NotificationContext);

    const searchMutation = useMutation<VideoResult[], Error, string>({
        mutationFn: (searchQuery: string) => api.searchYouTubeVideosWithAI(searchQuery),
    });

    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
            if (initialQuery.trim()) {
                searchMutation.mutate(initialQuery.trim());
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            searchMutation.mutate(query.trim());
        }
    };

    const handleSelect = (videoId: string) => {
        onSelectVideo(videoId);
        onClose();
        addToast(`ID del vídeo autocompletado.`, 'success');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><YouTubeIcon className="w-7 h-7 text-red-600"/>Buscar Vídeo en YouTube</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                        <CloseIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>
                <div className="p-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar vídeo por tema..."
                            className="flex-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100"
                            autoFocus
                        />
                        <Button type="submit" isLoading={searchMutation.isPending}>
                            <SearchIcon className="w-5 h-5 mr-2" />
                            Buscar
                        </Button>
                    </form>
                </div>
                <div className="p-4 flex-1 overflow-y-auto max-h-[60vh]">
                    {searchMutation.isPending && (
                        <div className="flex justify-center items-center h-48">
                            <Spinner />
                            <span className="ml-4 text-slate-600 dark:text-slate-300">Buscando con IA...</span>
                        </div>
                    )}
                    {searchMutation.isError && (
                        <div className="text-center text-red-500 p-4">
                            <p>Error al buscar vídeos. Inténtalo de nuevo.</p>
                        </div>
                    )}
                    {searchMutation.isSuccess && searchMutation.data.length === 0 && (
                         <div className="text-center text-slate-500 p-4">
                            <p>No se encontraron vídeos. Intenta con otra búsqueda.</p>
                        </div>
                    )}
                    {searchMutation.data && searchMutation.data.length > 0 && (
                        <div className="space-y-3">
                            {searchMutation.data.map(video => (
                                <div key={video.videoId} className="flex items-center gap-4 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 border dark:border-slate-700">
                                    <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer">
                                        <img
                                            loading="lazy"
                                            width="128"
                                            height="80"
                                            src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                                            alt={video.title}
                                            className="w-32 h-20 object-cover rounded-md flex-shrink-0"
                                        />
                                    </a>
                                    <div className="flex-1 overflow-hidden">
                                        <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 dark:text-slate-100 truncate hover:underline" title={video.title}>{video.title}</a>
                                    </div>
                                    <Button variant="secondary" onClick={() => handleSelect(video.videoId)}>
                                        Seleccionar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};