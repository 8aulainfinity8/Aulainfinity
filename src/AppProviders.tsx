import React, { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { StudentProgressProvider } from './contexts/StudentProgressContext';
import { AppConfigProvider } from './contexts/AppConfigContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NewCommentsProvider } from './contexts/NewCommentsProvider';
import { AdminNotificationProvider } from './contexts/AdminNotificationProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import { GamificationProvider } from './contexts/GamificationContext';
import { StudentNotificationProvider } from './contexts/StudentNotificationProvider';
import { I18nProvider } from './contexts/I18nProvider';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { ActiveChatsProvider } from './contexts/ActiveChatsContext';
import { initFirestoreSync, initAppConfigSync } from './services/firestoreSync';
import { auth } from './services/firebase';
import { FirestoreTestViewer } from './components/FirestoreTestViewer';
import { RealtimeAlertsBanner } from './components/RealtimeAlertsBanner';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutos de caché para reducir re-renders y accesos innecesarios
            refetchOnWindowFocus: false, // Evita disparar ráfagas de consultas al cambiar de pestaña
            retry: 1,
        },
    },
});

/**
 * Agrupa providers por dominio jerárquico
 * - Tier 1: Infra (Theme, I18n, Query)
 * - Tier 2: Auth (Auth, Config)
 * - Tier 3: UI State (Notifications, Modals)
 * - Tier 4: Feature (Progress, Gamification, Chat, Comments)
 */

// Tier 1: Infraestructura base (sin dependencias de negocio)
const InfraProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
    <ThemeProvider>
        <I18nProvider>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </I18nProvider>
    </ThemeProvider>
);

// Tier 2: Autenticación y configuración global de la aplicación
const AuthProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AuthProvider>
        <AppConfigProvider>
            {children}
        </AppConfigProvider>
    </AuthProvider>
);

// Tier 3: Estado UI, modales y sistemas de notificaciones integrados
const UIProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
    <NotificationProvider>
        <ConfirmationProvider>
            <StudentNotificationProvider>
                <AdminNotificationProvider>
                    <ActiveChatsProvider>
                        {children}
                    </ActiveChatsProvider>
                </AdminNotificationProvider>
            </StudentNotificationProvider>
        </ConfirmationProvider>
    </NotificationProvider>
);

// Tier 4: Lógica de negocio y características del aula (dependen de la sesión del alumno y la UI)
const FeatureProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
    <StudentProgressProvider>
        <GamificationProvider>
            <NewCommentsProvider>
                {children}
            </NewCommentsProvider>
        </GamificationProvider>
    </StudentProgressProvider>
);

// Composición limpia, jerárquica y segura de los proveedores
export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
    useEffect(() => {
        // Inicializar sincronizadores globales de Firestore
        initAppConfigSync();
        initFirestoreSync();

        // Escuchar el cambio de autenticación para asegurar la resincronización correcta
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('[AppProviders] Authenticated user detected.');
                initFirestoreSync();
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <InfraProviders>
            <AuthProviders>
                <UIProviders>
                    <FeatureProviders>
                        {children}
                        <RealtimeAlertsBanner />
                        {import.meta.env.DEV && <FirestoreTestViewer />}
                    </FeatureProviders>
                </UIProviders>
            </AuthProviders>
        </InfraProviders>
    );
};
