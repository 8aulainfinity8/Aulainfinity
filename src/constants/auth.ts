/**
 * Variable de entorno con admins permitidos
 * Formato: email1,email2,email3 (separados por comas)
 * Fallback: ['8aulainfinity8@gmail.com']
 * 
 * Uso:
 * - Desarrollo: se usa el default
 * - Producción: configura en .env.production
 */
export const DEFAULT_ADMIN_EMAILS = ['8aulainfinity8@gmail.com'];

export const ADMIN_EMAILS = (
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_EMAILS) || DEFAULT_ADMIN_EMAILS.join(',')
)
    .split(',')
    .map(email => email.trim().toLowerCase());

/**
 * Verifica si un email pertenece a un administrador
 * @param email - Email a verificar (puede ser null/undefined)
 * @returns true si el email es admin, false en caso contrario
 */
export const isAdminEmail = (email?: string | null): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};

