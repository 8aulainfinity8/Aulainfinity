import React from 'react';
import { useI18n } from '../hooks/useI18n';

const LANGUAGES = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
];

export const LanguageSwitcher: React.FC = React.memo(() => {
    const { locale, changeLocale } = useI18n();

    return (
        <div className="flex items-center space-x-0.5 sm:space-x-1 bg-slate-100 dark:bg-slate-700/70 p-0.5 sm:p-1 rounded-full border border-slate-200/60 dark:border-slate-600/50 shadow-inner">
            {LANGUAGES.map(lang => (
                <button
                    key={lang.code}
                    onClick={() => changeLocale(lang.code as 'es' | 'en')}
                    className={`px-1.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer select-none ${
                        locale === lang.code
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
                    }`}
                    aria-pressed={locale === lang.code}
                    aria-label={`Cambiar idioma a ${lang.name}`}
                    title={`Cambiar idioma a ${lang.name}`}
                >
                    <span className="hidden sm:inline">{lang.name}</span>
                    <span className="sm:hidden uppercase font-bold text-[10px] sm:text-xs">{lang.code}</span>
                </button>
            ))}
        </div>
    );
});