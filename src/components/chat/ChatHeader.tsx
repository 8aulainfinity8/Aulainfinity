import React from 'react';
import { ChevronLeft, UserCircle, Phone, PenTool, CheckCircle, HelpCircle, Headphones, GraduationCap } from 'lucide-react';
import type { ActiveChannel } from './ChatList';

interface ChatHeaderProps {
    activeChannel: ActiveChannel;
    onBack: () => void;
    showChannelsMobile: boolean;
    setShowChannelsMobile: (val: boolean) => void;
    onStartVoiceCall: () => void;
    onStartWhiteboard: () => void;
    onResolveConversation: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    activeChannel, onBack, showChannelsMobile, setShowChannelsMobile, onStartVoiceCall, onStartWhiteboard, onResolveConversation
}) => {
    const title = activeChannel.type === 'teacher' 
        ? `Prof. ${activeChannel.teacher?.name || 'Asignado'}`
        : 'Soporte Técnico';

    const subtitle = activeChannel.type === 'teacher'
        ? 'Chat directo 1:1 alumno-profesor'
        : 'Asistencia y ayuda de la plataforma';

    return (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 font-sans shadow-sm z-10 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    onClick={() => {
                        if (!showChannelsMobile) {
                            setShowChannelsMobile(true);
                        } else {
                            onBack();
                        }
                    }}
                    className="p-2 -ml-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg transition-colors md:hidden shrink-0"
                    title="Volver"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 min-w-0">
                    {activeChannel.type === 'teacher' && activeChannel.teacher?.profileImage ? (
                        <img src={activeChannel.teacher.profileImage} alt={activeChannel.teacher.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                    ) : activeChannel.type === 'support' ? (
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                            <Headphones className="w-6 h-6" />
                        </div>
                    ) : (
                        <UserCircle className="w-10 h-10 text-indigo-400 dark:text-indigo-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg leading-tight truncate">
                            {title}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{subtitle}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                    onClick={onStartVoiceCall}
                    className="flex items-center justify-center p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/40 dark:hover:bg-green-800/60 dark:text-green-400 transition-colors shadow-sm shrink-0"
                    title="Llamar"
                >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                    onClick={onStartWhiteboard}
                    className="flex items-center justify-center p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 dark:text-blue-400 transition-colors shadow-sm shrink-0"
                    title="Abrir pizarra virtual"
                >
                    <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                    onClick={onResolveConversation}
                    className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 text-xs sm:text-sm font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-800/60 transition-colors shadow-sm shrink-0"
                >
                    <CheckCircle className="w-4 h-4 hidden sm:block" />
                    <span>✓ Resuelta</span>
                </button>
            </div>
        </div>
    );
};

