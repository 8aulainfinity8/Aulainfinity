
import React, { createContext, useState, useCallback, ReactNode, useEffect, useContext } from 'react';
import type { AnyUser } from '../types';
import { useQuery } from '@tanstack/react-query';
import { eventEmitter } from '../services/eventService';
import { getUserProfile, initializeAndSyncUserDataInFirestore } from '../services/userService';
import { resetFirestoreSync } from '../services/firestoreSync';
import { auth } from '../services/firebase';

// Custom hook to manage a state synchronized with localStorage and across tabs
export function useLocalStorageSync<T>(key: string, initialValue: T | null) {
    const [state, setState] = useState<T | null>(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            try {
                window.localStorage.removeItem(key);
            } catch {}
            return initialValue;
        }
    });

    // Update state when localStorage changes in another tab
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key) {
                try {
                    const newValue = event.newValue ? JSON.parse(event.newValue) : null;
                    setState(newValue);
                } catch (error) {
                    console.error(`Error parsing localStorage sync for key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key]);

    const setValue = useCallback((value: T | null | ((val: T | null) => T | null)) => {
        try {
            setState((prevState) => {
                const valueToStore = value instanceof Function ? value(prevState) : value;
                if (valueToStore === null) {
                    window.localStorage.removeItem(key);
                } else {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
                return valueToStore;
            });
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key]);

    return [state, setValue] as const;
}

interface AuthContextType {
  user: AnyUser | null;
  profile: any | null;
  loading: boolean;
  login: (user: AnyUser) => void;
  logout: () => void;
  updateUser: (user: AnyUser) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useLocalStorageSync<AnyUser>('mockUser', null);
    const [loading] = useState(false);

    const { data: profile } = useQuery({
        queryKey: ['userProfile', user?.id],
        queryFn: () => getUserProfile(user!.id),
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5
    });

    useEffect(() => {
        if (user && auth && auth.currentUser) {
            if (auth.currentUser.email?.toLowerCase() === user.email?.toLowerCase()) {
                auth.currentUser.reload().then(() => {
                    if (auth.currentUser && !auth.currentUser.emailVerified) {
                        console.warn("⚠️ Acceso bloqueado en sesión: El correo del usuario no ha sido verificado.");
                        if (auth) auth.signOut().catch(() => {});
                        setUser(null);
                    }
                }).catch(() => {});
            }
        }
    }, [user, setUser]);

    useEffect(() => {
        const handleUserUpdate = (updatedUser?: AnyUser) => {
            if (!updatedUser || typeof updatedUser !== 'object' || !('id' in updatedUser)) return;
            setUser(prevUser => {
                if (prevUser && prevUser.id === updatedUser.id) {
                    return { ...prevUser, ...updatedUser };
                }
                return prevUser;
            });
        };
        
        eventEmitter.on('user-update', handleUserUpdate);
        return () => {
            eventEmitter.off('user-update', handleUserUpdate);
        };
    }, [setUser]);

    const login = useCallback((userData: AnyUser) => {
        if (auth && auth.currentUser) {
            if (auth.currentUser.email?.toLowerCase() === userData.email?.toLowerCase()) {
                if (!auth.currentUser.emailVerified) {
                    console.warn("⚠️ Intento de login bloqueado: El usuario no ha verificado su correo electrónico.");
                    throw new Error("⚠️ Tu correo electrónico aún no ha sido verificado. Por favor, revisa tu bandeja de entrada o carpeta de spam y haz clic en el enlace de confirmación antes de iniciar sesión.");
                }
            }
        }
        setUser(userData);
        initializeAndSyncUserDataInFirestore(userData, userData.role as any).catch(err => {
            console.warn('Sync user data non-critical failure:', err);
        });
    }, [setUser]);

    const logout = useCallback(() => {
        if (auth) {
            auth.signOut().catch(() => {});
        }
        resetFirestoreSync();
        eventEmitter.emit('user-logout');
        setUser(null);
    }, [setUser]);

    const updateUser = useCallback((updatedUserData?: AnyUser) => {
        if (!updatedUserData || typeof updatedUserData !== 'object' || !('id' in updatedUserData)) return;
        setUser(prevUser => {
            if (prevUser && prevUser.id === updatedUserData.id) {
                return { ...prevUser, ...updatedUserData };
            }
            return prevUser;
        });
    }, [setUser]);

    const value = { user, profile, loading, login, logout, updateUser };

    return React.createElement(AuthContext.Provider, { value: value }, children);
};

// Convenient useAuth hook for general consumption
export const useAuth = () => useContext(AuthContext);

