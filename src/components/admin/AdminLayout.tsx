import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Header } from '../Header';
import { ROUTES } from '../../constants/routes';
import { useAuthorization } from '../../hooks/useAuthorization';
import { ShieldAlert } from 'lucide-react';
import { 
    DashboardIcon, 
    UsersIcon, 
    FolderOpenIcon, 
    ChartBarIcon, 
    ChatBubbleLeftRightIcon, 
    CogIcon 
} from '../icons';
import { AdminNotificationContext } from '../../contexts/AdminNotificationContext';
import { useI18n } from '../../hooks/useI18n';

const AdminBottomDock: React.FC<{ onItemClick: () => void }> = ({ onItemClick }) => {
    const location = useLocation();
    const { isTeacher } = useAuthorization();
    const { t } = useI18n();
    const { newUsersCount, newSubscriptionsCount, unreadConversationsCount } = useContext(AdminNotificationContext);
    const [isDimmed, setIsDimmed] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isHoveredRef = useRef(false);

    const resetTimer = useCallback(() => {
        setIsDimmed(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (isHoveredRef.current) return;
        
        timeoutRef.current = setTimeout(() => {
            if (!isHoveredRef.current) {
                setIsDimmed(true);
            }
        }, 2500); // Esperar 2.5 segundos de inactividad antes de difuminar
    }, []);

    useEffect(() => {
        resetTimer();

        const handleActivity = () => {
            resetTimer();
        };

        window.addEventListener('scroll', handleActivity, { passive: true });
        window.addEventListener('mousemove', handleActivity, { passive: true });
        window.addEventListener('touchstart', handleActivity, { passive: true });
        window.addEventListener('keydown', handleActivity, { passive: true });

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            window.removeEventListener('keydown', handleActivity);
        };
    }, [resetTimer]);

    const handleMouseEnter = () => {
        isHoveredRef.current = true;
        setIsDimmed(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleMouseLeave = () => {
        isHoveredRef.current = false;
        resetTimer();
    };

    const dockItems = [
        {
            to: ROUTES.ADMIN_DASHBOARD,
            label: t('adminSidebar.mainDashboard'),
            icon: <DashboardIcon className="w-5 h-5 sm:w-6 h-6 transition-transform group-hover:scale-110" />,
            badge: newSubscriptionsCount,
        },
        ...(!isTeacher ? [{
            to: ROUTES.ADMIN_USERS,
            label: t('adminSidebar.studentManagement'),
            icon: <UsersIcon className="w-5 h-5 sm:w-6 h-6 transition-transform group-hover:scale-110" />,
            badge: newUsersCount,
        }] : []),
        {
            to: ROUTES.ADMIN_CONTENT,
            label: t('adminSidebar.content'),
            icon: <FolderOpenIcon className="w-5 h-5 sm:w-6 h-6 transition-transform group-hover:scale-110" />,
        },
        {
            to: ROUTES.ADMIN_PROGRESS,
            label: t('adminSidebar.studentProgress'),
            icon: <ChartBarIcon className="w-5 h-5 sm:w-6 h-6 transition-transform group-hover:scale-110" />,
        },
        {
            to: ROUTES.ADMIN_CHAT,
            label: t('adminSidebar.supportChats'),
            icon: <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 h-6 transition-transform group-hover:scale-110" />,
            badge: unreadConversationsCount,
        },
        ...(!isTeacher ? [{
            to: ROUTES.ADMIN_SETTINGS,
            label: t('adminSidebar.generalSettings'),
            icon: <CogIcon className="w-5 h-5 sm:w-6 h-6 transition-transform group-hover:scale-110" />,
        }] : [])
    ];

    return (
        <nav 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label="Menú de navegación móvil de administración"
            className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-[95vw] sm:max-w-xl md:max-w-2xl w-full transition-all duration-700 ease-in-out ${
                isDimmed 
                    ? 'opacity-25 dark:opacity-30 scale-95 blur-[0.2px]' 
                    : 'opacity-100 scale-100 blur-none'
            }`}
        >
            <div className="bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800/80 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.6)] backdrop-blur-md px-3 sm:px-4 py-2.5 rounded-2xl flex items-center justify-around gap-1 text-white/70 transition-all duration-300">
                {dockItems.map((item) => {
                    const isActive = location.pathname === item.to || (item.to !== ROUTES.ADMIN_DASHBOARD && location.pathname.startsWith(item.to));
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={onItemClick}
                            aria-label={item.label}
                            className={`relative flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all duration-200 group flex-1 min-w-0 max-w-[72px] sm:max-w-none pointer-events-auto ${
                                isActive 
                                    ? 'text-primary bg-primary/10 font-bold scale-105' 
                                    : 'hover:text-white hover:bg-white/5 font-normal'
                            }`}
                        >
                            <div className="relative">
                                {item.icon}
                                {item.badge && item.badge > 0 ? (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1 animate-pulse border border-slate-900">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                ) : null}
                            </div>
                            <span className="text-[9px] sm:text-xs font-semibold mt-1 text-center truncate w-full">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

const RestrictedAccessMessage: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center" id="admin-restricted-access">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xl rounded-2xl p-8 max-w-md w-full animate-fade-in">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 dark:text-red-400">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight mb-2">
                    {t('adminLayout.restrictedAccessTitle')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    {t('adminLayout.restrictedAccessDesc')}
                </p>
                <Link
                    to={ROUTES.ADMIN_DASHBOARD}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 w-full"
                >
                    {t('adminLayout.backToDashboard')}
                </Link>
            </div>
        </div>
    );
};

export const AdminLayout: React.FC = () => {
    const { user, isTeacher, hasTeacherAccess } = useAuthorization();
    const location = useLocation();
    const [sidebarState, setSidebarState] = useState<'open' | 'collapsed' | 'closed'>(() => {
        try {
            const saved = localStorage.getItem('aula_admin_sidebar_state');
            if (saved === 'open' || saved === 'collapsed' || saved === 'closed') {
                return saved;
            }
        } catch (e) {
            console.error('Error reading admin sidebarState from localStorage:', e);
        }
        return 'open';
    });
    const mainContentRef = useRef<HTMLElement>(null);

    // Save sidebar state to localStorage on change for desktop
    useEffect(() => {
        try {
            if (window.innerWidth >= 768) {
                localStorage.setItem('aula_admin_sidebar_state', sidebarState);
            }
        } catch (e) {
            console.error('Error saving admin sidebarState to localStorage:', e);
        }
    }, [sidebarState]);

    // On component mount, check screen size and set sidebar to closed on mobile.
    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 767px)');
        if (mediaQuery.matches) {
            setSidebarState('closed');
        }
    }, []);

    const toggleSidebar = () => {
        setSidebarState(prev => {
            // Mobile behavior: toggle between open and closed
            if (window.innerWidth < 768) {
                return prev === 'open' ? 'closed' : 'open';
            }
            // Desktop behavior: toggle between open, collapsed, and closed
            if (prev === 'open') return 'collapsed';
            if (prev === 'collapsed') return 'closed';
            return 'open';
        });
    };

    const openSidebar = () => setSidebarState('open');

    // Callback to scroll main content to top on interaction.
    const handleScrollToTop = useCallback(() => {
        mainContentRef.current?.scrollTo(0, 0);
        // Automatically close the sidebar on mobile when selecting an option to enhance mobile UX.
        if (window.innerWidth < 768) {
            setSidebarState('closed');
        }
    }, []);

    // Protect admin routes (only admins should access AdminLayout and AdminSidebar)
    if (isTeacher || user?.role === 'teacher') {
        const redirectTarget = location.pathname.startsWith('/admin/content') ? ROUTES.TEACHER_CONTENT : ROUTES.DASHBOARD;
        return <Navigate to={redirectTarget} replace />;
    }

    if (!hasTeacherAccess) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    // Additional guard: teachers cannot access users, settings, subscription, connection pages
    const restrictedPathsForTeachers = [
        ROUTES.ADMIN_USERS,
        ROUTES.ADMIN_SETTINGS,
        ROUTES.ADMIN_SUBSCRIPTION,
        ROUTES.ADMIN_CONNECTION,
    ];

    const isRestricted = isTeacher && restrictedPathsForTeachers.some(path => 
        location.pathname === path || location.pathname.startsWith(path)
    );

    const isChatPage = location.pathname.startsWith('/admin/chat') || location.pathname.startsWith('/app/chat');

    const mainContentMargin = {
        open: 'md:ml-64',
        collapsed: 'md:ml-20',
        closed: 'ml-0',
    }[sidebarState];

    return (
        <div className="bg-gray-100 dark:bg-slate-900 h-screen flex overflow-hidden">
            <AdminSidebar sidebarState={sidebarState} onItemClick={handleScrollToTop} />
            <div 
                className={`relative flex-1 flex flex-col transition-all duration-300 ${mainContentMargin} overflow-hidden`}
            >
                <Header sidebarState={sidebarState} toggleSidebar={toggleSidebar} openSidebar={openSidebar} />
                <main 
                    ref={mainContentRef} 
                    className={isChatPage 
                        ? "flex-1 w-full max-w-full min-w-0 p-0 md:p-4 lg:p-6 overflow-hidden pb-20 md:pb-0 flex flex-col min-h-0" 
                        : "flex-1 p-3.5 sm:p-6 pb-28 sm:pb-32 md:pb-12 overflow-y-auto"
                    }
                >
                    {isRestricted ? (
                        <RestrictedAccessMessage />
                    ) : (
                        <Outlet />
                    )}
                </main>
                <AdminBottomDock onItemClick={handleScrollToTop} />
            </div>
            {/* Backdrop for mobile, now only shows when fully open, z-index adjusted to be below Sidebar (z-[100]) but above standard content and modals (z-50) */}
            {sidebarState === 'open' && (
                <div 
                    onClick={toggleSidebar}
                    className="fixed inset-0 bg-black/60 z-[99] md:hidden"
                    aria-hidden="true"
                ></div>
            )}
        </div>
    );
};
