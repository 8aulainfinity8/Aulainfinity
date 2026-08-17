/**
 * Configuración de autenticación y roles de administración.
 * La autorización real de administración se basa estrictamente en Firebase Custom Claims (role === 'admin').
 */
export const DEFAULT_ADMIN_EMAILS: string[] = [];

export const ADMIN_EMAILS = (
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_EMAILS) || ''
)
    .split(',')
    .filter(Boolean)
    .map(email => email.trim().toLowerCase());

/**
 * Función de compatibilidad para UI.
 * NOTA DE SEGURIDAD: La autorización real la determinan las Custom Claims verificadas en backend y Security Rules.
 */
export const isAdminEmail = (email?: string | null): boolean => {
    if (!email || ADMIN_EMAILS.length === 0) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};

