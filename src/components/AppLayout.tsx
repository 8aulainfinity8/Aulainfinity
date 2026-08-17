
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { auth } from '../services/firebase';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalProgressBar } from './GlobalProgressBar';
import { MobileBottomNav } from './MobileBottomNav';
import { AuthContext } from '../contexts/AuthContext';
import { useOnboarding } from '../hooks/useOnboarding';
import { useI18n } from '../hooks/useI18n';
import { OnboardingTour, TourStep } from './OnboardingTour';
import { TeacherActiveChatsBar } from './TeacherActiveChatsBar';

export const AppLayout: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { t } = useI18n();
    const location = useLocation();

    const tourSteps: TourStep[] = [
        {
            target: '#main-content',
            title: t('tour.step1Title'),
            content: t('tour.step1Content'),
        },
        {
            target: 'a[href*="/app/course/"]',
            title: t('tour.step2Title'),
            content: t('tour.step2Content'),
        },
        {
            target: 'a[href="/app/agenda"]',
            title: t('tour.step3Title'),
            content: t('tour.step3Content'),
        },
        {
            target: 'a[href="/app/tutor-ia"]',
            title: t('tour.step4Title'),
            content: t('tour.step4Content'),
        },
        {
            target: 'a[href="/app/progress"]',
            title: t('tour.step5Title'),
            content: t('tour.step5Content'),
        },
    ];
    const isChatPage = ['/app/tutor-ia', '/app/student-chat', '/app/chat', '/admin/chat'].some(path => location.pathname.startsWith(path));
    const [sidebarState, setSidebarState] = useState<'open' | 'collapsed' | 'closed'>(() => {
        try {
            // If we are in an iframe or on the shared preview URL, default to closed (full-screen content space)
            const isShared = window.self !== window.top || 
                             window.location.hostname.includes('ais-pre-') || 
                             window.location.search.includes('share') ||
                             window.location.hash.includes('share');
            if (isShared) {
                return 'closed';
            }

            const saved = localStorage.getItem('aula_sidebar_state');
            if (saved === 'open' || saved === 'collapsed' || saved === 'closed') {
                return saved;
            }
        } catch (e) {
            console.error('Error reading sidebarState from localStorage:', e);
        }
        return 'open';
    });
    const mainContentRef = useRef<HTMLElement>(null);
    const { showTour, completeOnboarding } = useOnboarding(user?.role === 'student');

    // Save sidebar state to localStorage on change for desktop
    useEffect(() => {
        try {
            if (window.innerWidth >= 768) {
                localStorage.setItem('aula_sidebar_state', sidebarState);
            }
        } catch (e) {
            console.error('Error saving sidebarState to localStorage:', e);
        }
    }, [sidebarState]);

    // On component mount, check screen size and set sidebar to closed on mobile.
    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 767px)'); // Corresponds to Tailwind's `md` breakpoint
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

    const handleScrollToTop = useCallback(() => {
        mainContentRef.current?.scrollTo(0, 0);
        // Automatically close the sidebar on mobile when selecting an option to enhance mobile UX.
        if (window.innerWidth < 768) {
            setSidebarState('closed');
        }
    }, []);

    const mainContentMargin = {
        open: 'md:ml-64',
        collapsed: 'md:ml-20',
        closed: 'ml-0',
    }[sidebarState];

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (user.role === 'admin') {
        return <Navigate to={ROUTES.ADMIN_ROOT} replace />;
    }

    if (auth && auth.currentUser && auth.currentUser.email?.toLowerCase() === user.email?.toLowerCase() && !auth.currentUser.emailVerified) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    return (
        <div className="flex h-screen h-[100dvh] bg-gray-100 dark:bg-slate-900 overflow-hidden">
            {showTour && <OnboardingTour steps={tourSteps} onComplete={completeOnboarding} />}
            
            <Sidebar sidebarState={sidebarState} onItemClick={handleScrollToTop} />
            
            <div className={`relative flex-1 min-w-0 w-full flex flex-col transition-all duration-300 ${mainContentMargin} overflow-hidden`}>
                <Header sidebarState={sidebarState} toggleSidebar={toggleSidebar} openSidebar={openSidebar} />
                <GlobalProgressBar />
                
                {/* Dynamically adjust spacing and scrolling for chat pages to avoid cutting off or double-scrollbars on mobile */}
                <main 
                    id="main-content" 
                    ref={mainContentRef} 
                    className={isChatPage 
                        ? "flex-1 w-full max-w-full min-w-0 p-0 md:p-4 lg:p-6 overflow-hidden pb-20 md:pb-0 flex flex-col min-h-0" 
                        : "flex-1 w-full max-w-full min-w-0 p-3.5 sm:p-4 md:p-6 overflow-y-auto pb-60 sm:pb-64 md:pb-32"
                    }
                >
                    <Outlet />
                </main>
                
                <MobileBottomNav onMenuClick={openSidebar} />
                <TeacherActiveChatsBar />
            </div>
            
             {/* Backdrop for mobile, z-index adjusted to be below Sidebar (z-[100]) but above modern overlays/modals */}
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
