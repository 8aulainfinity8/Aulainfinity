import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ROUTES } from '../constants/routes';

interface AdminProtectedRouteProps {
    children?: React.ReactNode;
}

/**
 * Route protection mechanism that checks the user's authoritative role
 * to restrict access to '/admin' routes strictly to admin users.
 */
export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const location = useLocation();
    const [firestoreRole, setFirestoreRole] = useState<string | null>(null);
    const [isCheckingRole, setIsCheckingRole] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        async function verifyFirestoreRole() {
            if (!user) {
                if (isMounted) {
                    setFirestoreRole(null);
                    setIsCheckingRole(false);
                }
                return;
            }

            // Immediately confirm if already identified as admin
            if (user.role === 'admin') {
                if (isMounted) {
                    setFirestoreRole('admin');
                    setIsCheckingRole(false);
                }
                return;
            }

            try {
                const userId = (user as any).firebaseUid || user.id || (user as any).uid;
                if (userId) {
                    const userDocRef = doc(db, 'users', userId);
                    const userSnapshot = await getDoc(userDocRef);

                    if (userSnapshot.exists()) {
                        const data = userSnapshot.data();
                        if (isMounted) {
                            setFirestoreRole(data.role || user.role || null);
                        }
                    } else {
                        // Fallback to local user role if document doesn't exist yet
                        if (isMounted) {
                            setFirestoreRole(user.role || null);
                        }
                    }
                } else {
                    if (isMounted) {
                        setFirestoreRole(user.role || null);
                    }
                }
            } catch (err) {
                console.warn('[AdminProtectedRoute] Failed to fetch user role from Firestore:', err);
                if (isMounted) {
                    setFirestoreRole(user.role || null);
                }
            } finally {
                if (isMounted) {
                    setIsCheckingRole(false);
                }
            }
        }

        verifyFirestoreRole();

        return () => {
            isMounted = false;
        };
    }, [user]);

    if (authLoading || isCheckingRole) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
                <div className="flex items-center">
                    <div className="w-8 h-8 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
                    <span className="ml-4 text-lg font-semibold">Verificando permisos de administración...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    const activeRole = user.role === 'admin' ? 'admin' : (firestoreRole || user.role);

    if (activeRole !== 'admin') {
        console.warn(`[AdminProtectedRoute] Acceso denegado a rutas /admin. Rol detectado: '${activeRole}'. Redirigiendo a /app.`);
        if (activeRole === 'teacher') {
            const redirectTarget = location.pathname.startsWith('/admin/content') ? ROUTES.TEACHER_CONTENT : ROUTES.DASHBOARD;
            return <Navigate to={redirectTarget} replace />;
        }
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
