import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from './icons';

export const ThemeToggle: React.FC = React.memo(() => {
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
            {theme === 'light' ? (
                <MoonIcon className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            ) : (
                <SunIcon className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            )}
        </button>
    );
});
