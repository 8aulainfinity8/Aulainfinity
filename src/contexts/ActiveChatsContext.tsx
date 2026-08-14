
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ActiveChat {
    id: string;
    name: string;
    type: 'chat' | 'call';
    isOnline?: boolean;
    hasNewMessage?: boolean;
}

interface ActiveChatsContextType {
    activeChats: ActiveChat[];
    currentChatId: string | null;
    addActiveChat: (chat: ActiveChat) => void;
    removeActiveChat: (id: string) => void;
    setCurrentChatId: (id: string | null) => void;
}

const ActiveChatsContext = createContext<ActiveChatsContextType | undefined>(undefined);

export const ActiveChatsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);

    const addActiveChat = (chat: ActiveChat) => {
        setActiveChats(prev => {
            if (prev.find(c => c.id === chat.id)) return prev;
            return [...prev, chat];
        });
    };

    const removeActiveChat = (id: string) => {
        setActiveChats(prev => prev.filter(c => c.id !== id));
        if (currentChatId === id) setCurrentChatId(null);
    };

    return (
        <ActiveChatsContext.Provider value={{ activeChats, currentChatId, addActiveChat, removeActiveChat, setCurrentChatId }}>
            {children}
        </ActiveChatsContext.Provider>
    );
};

export const useActiveChats = () => {
    const context = useContext(ActiveChatsContext);
    if (!context) throw new Error('useActiveChats must be used within an ActiveChatsProvider');
    return context;
};
