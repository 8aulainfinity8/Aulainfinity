import React, { useContext } from 'react';
// FIX: Changed react-router-dom import to resolve module export errors.
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LockClosedIcon, CreditCardIcon } from './icons';
import { ROUTES } from '../constants/routes';

interface SubscriptionGateProps {
    children: React.ReactNode;
    isFreeContent?: boolean;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children, isFreeContent = false }) => {
    const { user } = useContext(AuthContext);

    // Grant access if content is marked as free
    if (isFreeContent) {
        return <>{children}</>;
    }
    
    // If user is an admin or a teacher, always grant access
    if (user?.role === 'admin' || user?.role === 'teacher') {
        return <>{children}</>;
    }

    // If user is a subscribed student, grant access
    if (user?.role === 'student' && user.isSubscribed) {
        return <>{children}</>;
    }
    
    // Otherwise, show the paywall with a CTA button
    return (
        <div className="text-center p-8 md:p-12 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-primary/20 mt-8 animate-fade-in">
            <LockClosedIcon className="w-16 h-16 text-primary mx-auto" />
            <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-slate-50">Contenido Premium</h2>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Para acceder a este contenido, necesitas una suscripción activa. ¡Actívala ahora para desbloquear todos los vídeos, tutorías y herramientas de IA!
            </p>
            <Link 
                to={ROUTES.PAYMENT}
                className="mt-8 inline-flex items-center bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-primary-dark transition-transform transform hover:scale-105 shadow-lg text-lg"
            >
                <CreditCardIcon className="w-6 h-6 mr-3" />
                Activar Suscripción
            </Link>
        </div>
    );
};