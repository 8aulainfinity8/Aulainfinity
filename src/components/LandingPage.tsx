import React, { useContext } from 'react';
// FIX: Split react-router-dom imports to resolve export errors.
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { BookOpenIcon, AcademicCapIcon, VideoCameraIcon, UsersIcon, SparklesIcon, PencilIcon, TestimonialQuoteIcon, CheckCircleIcon } from './icons';
import { ROUTES } from '../constants/routes';
import { useI18n } from '../hooks/useI18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeContext } from '../contexts/ThemeContext';
import { OFFICIAL_LOGO_PATH, handleImageError } from '../constants/branding';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = React.memo(({ icon, title, description }) => (
    <div className="premium-card p-8 text-center hover:-translate-y-2 duration-300 h-full flex flex-col items-center">
        <div className="inline-block p-4.5 bg-primary/10 rounded-2xl mb-5 text-primary scale-100 hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3 font-display">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
));

const CourseHighlightCard: React.FC<{ icon: React.ReactNode; title: string; items: string[] }> = React.memo(({ icon, title, items }) => (
    <div className="premium-card p-8 flex flex-col hover:scale-[1.02] duration-300 hover:border-primary/20">
        <div className="flex items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-gradient-to-tr from-primary/10 to-indigo-500/10 rounded-xl text-primary">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 ml-4 font-display">{title}</h3>
        </div>
        <ul className="space-y-4 mt-2 flex-grow">
            {items.map(item => (
                <li key={item} className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    </div>
));

const TestimonialCard: React.FC<{ quote: string; author: string; role: string }> = React.memo(({ quote, author, role }) => (
    <div className="premium-card p-8 bg-gradient-to-tr from-slate-50 to-white dark:from-slate-850/10 dark:to-slate-800 h-full flex flex-col hover:scale-[1.02] duration-300">
        <TestimonialQuoteIcon className="w-8 h-8 text-primary/40 mb-4" />
        <blockquote className="text-slate-600 dark:text-slate-300 italic mb-6 flex-grow leading-relaxed font-sans text-sm">"{quote}"</blockquote>
        <div className="flex items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
            <img
                loading="lazy"
                width="48"
                height="48"
                className="h-11 w-11 rounded-full object-cover bg-slate-200 border-2 border-primary/20"
                src={`https://api.dicebear.com/8.x/initials/svg?seed=${author}`}
                alt={`Avatar de ${author}`}
            />
            <div className="ml-4">
                <p className="font-bold text-slate-900 dark:text-slate-50 text-sm">{author}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{role}</p>
            </div>
        </div>
    </div>
));


export const LandingPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const { t } = useI18n();

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-50 overflow-x-hidden">
            {/* Header */}
            <header className="container mx-auto px-6 py-6 flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-6 relative z-50">
                <div className="bg-white rounded-2xl p-4 flex items-center justify-center w-full sm:w-auto">
                    <img 
                        src={OFFICIAL_LOGO_PATH} 
                        alt="AulaInfinity" 
                        id="landing-header-logo"
                        className="max-w-full h-auto object-contain max-h-20 md:max-h-24 lg:max-h-28" 
                        referrerPolicy="no-referrer"
                        loading="eager"
                        onError={(e) => handleImageError(e, 'full')}
                    />
                </div>
                <div className="flex items-center justify-center space-x-4 w-full sm:w-auto flex-wrap">
                    <LanguageSwitcher />
                    {user ? (
                        <Link
                            to={user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.DASHBOARD}
                            className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-200 shadow-sm whitespace-nowrap"
                        >
                            {user.role === 'admin' ? 'Panel Admin' : t('landing.cta_continue')}
                        </Link>
                    ) : (
                        <Link
                            to={ROUTES.LOGIN}
                            className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-200 shadow-sm whitespace-nowrap"
                        >
                            {t('login.login')}
                        </Link>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative">
                <div className="container mx-auto px-6 py-16 md:py-24">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="text-center md:text-left flex flex-col items-center md:items-start">
                            <div className="md:hidden flex justify-center mb-6">
                                <img 
                                    src={OFFICIAL_LOGO_PATH} 
                                    alt="AulaInfinity" 
                                    className="h-20 w-auto object-contain block bg-white p-2.5 rounded-2xl shadow-sm" 
                                    referrerPolicy="no-referrer"
                                    loading="eager"
                                    onError={(e) => handleImageError(e, 'full')}
                                />
                            </div>
                            <h2 className="text-4xl md:text-6xl font-bold mb-4 leading-tight text-slate-900 dark:text-slate-50 text-center md:text-left"
                                dangerouslySetInnerHTML={{ 
                                    __html: t('landing.title')
                                        .replace('crece sin fronteras', '<span class="text-primary">crece sin fronteras.</span>')
                                        .replace('grow without borders', '<span class="text-primary">grow without borders.</span>')
                                }} 
                            />
                            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto md:mx-0 mb-8 text-center md:text-left">
                                {t('landing.subtitle')}
                            </p>
                            {user ? (
                                <Link
                                    to={user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.DASHBOARD}
                                    className="bg-primary text-white font-bold py-4 px-10 text-lg rounded-full hover:bg-primary-dark transition-transform transform hover:scale-105 inline-block shadow-lg"
                                >
                                    {user.role === 'admin' ? 'Ir al Panel de Administración' : t('landing.cta_continue')}
                                </Link>
                            ) : (
                                <Link
                                    to={ROUTES.LOGIN}
                                    className="bg-primary text-white font-bold py-4 px-10 text-lg rounded-full hover:bg-primary-dark transition-transform transform hover:scale-105 inline-block shadow-lg"
                                >
                                    {t('landing.cta_start')}
                                </Link>
                            )}
                        </div>
                        <div className="hidden md:flex justify-center items-center relative h-96">
                            <div className="absolute w-72 h-72 bg-blue-200 rounded-full opacity-50 blur-xl dark:opacity-30"></div>
                            <div className="absolute w-64 h-64 bg-indigo-200 rounded-full opacity-50 blur-xl right-0 bottom-10 dark:opacity-30"></div>
                            <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center max-w-md">
                                <img 
                                    src={OFFICIAL_LOGO_PATH} 
                                    alt="AulaInfinity" 
                                    className="w-full max-w-xs sm:max-w-sm h-auto object-contain block bg-white p-4 rounded-2xl shadow-md transition-transform hover:scale-105 duration-300" 
                                    referrerPolicy="no-referrer"
                                    loading="eager"
                                    onError={(e) => handleImageError(e, 'full')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section className="bg-white dark:bg-slate-800 py-20">
                <div className="container mx-auto px-6">
                    <h3 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-slate-50">{t('landing.features_heading')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<VideoCameraIcon className="w-10 h-10 text-primary" />}
                            title={t('landing.feature1_title')}
                            description={t('landing.feature1_desc')}
                        />
                        <FeatureCard 
                            icon={<UsersIcon className="w-10 h-10 text-primary" />}
                            title={t('landing.feature2_title')}
                            description={t('landing.feature2_desc')}
                        />
                         <FeatureCard 
                            icon={<SparklesIcon className="w-10 h-10 text-primary" />}
                            title={t('landing.feature3_title')}
                            description={t('landing.feature3_desc')}
                        />
                    </div>
                </div>
            </section>
            
             {/* Course Highlights Section */}
            <section className="bg-gray-50 dark:bg-slate-900 py-20">
                <div className="container mx-auto px-6">
                    <h3 className="text-3xl font-bold text-center mb-4 text-slate-900 dark:text-slate-50">{t('landing.courses_heading')}</h3>
                    <p className="text-center text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12">{t('landing.courses_subheading')}</p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <CourseHighlightCard 
                            icon={<BookOpenIcon className="w-8 h-8 text-primary" />}
                            title={t('landing.courses_eso')}
                            items={[t('landing.courses_eso_item1'), t('landing.courses_eso_item2'), t('landing.courses_eso_item3')]}
                        />
                         <CourseHighlightCard 
                            icon={<AcademicCapIcon className="w-8 h-8 text-primary" />}
                            title={t('landing.courses_bachillerato')}
                            items={[t('landing.courses_bachillerato_item1'), t('landing.courses_bachillerato_item2'), t('landing.courses_bachillerato_item3'), t('landing.courses_bachillerato_item4')]}
                        />
                         <CourseHighlightCard 
                            icon={<PencilIcon className="w-8 h-8 text-primary" />}
                            title={t('landing.courses_ebau')}
                            items={[t('landing.courses_ebau_item1'), t('landing.courses_ebau_item2'), t('landing.courses_ebau_item3')]}
                        />
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="bg-white dark:bg-slate-800 py-20">
              <div className="container mx-auto px-6">
                <h3 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-slate-50">{t('landing.testimonials_heading')}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <TestimonialCard
                        quote={t('landing.testimonial1')}
                        author="Lucía G."
                        role={t('landing.testimonial1_role')}
                    />
                    <TestimonialCard
                        quote={t('landing.testimonial2')}
                        author="Carlos M."
                        role={t('landing.testimonial2_role')}
                    />
                    <TestimonialCard
                        quote={t('landing.testimonial3')}
                        author="Sofía R."
                        role={t('landing.testimonial3_role')}
                    />
                 </div>
              </div>
            </section>

            {/* Final CTA Section */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-center">
                <div className="container mx-auto px-6 py-16 md:py-20 text-center">
                    <h3 className="text-3.5xl md:text-5xl font-bold text-white mb-4 leading-tight">{t('landing.cta_final_title')}</h3>
                    <p className="text-base md:text-lg text-blue-250/90 mb-8 max-w-2xl mx-auto">{t('landing.cta_final_desc')}</p>
                    {user ? (
                        <Link 
                            to={user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.DASHBOARD}
                            className="bg-white text-primary font-bold py-4 px-10 text-lg rounded-full hover:bg-gray-100 transition-transform transform hover:scale-105 inline-block shadow-lg"
                        >
                            {user.role === 'admin' ? 'Ir al Panel de Administración' : t('landing.cta_back_dashboard')}
                        </Link>
                    ) : (
                        <Link 
                            to={ROUTES.LOGIN}
                            className="bg-white text-primary font-bold py-4 px-10 text-lg rounded-full hover:bg-gray-100 transition-transform transform hover:scale-105 inline-block shadow-lg"
                        >
                            {t('landing.cta_final_button')}
                        </Link>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white dark:bg-slate-800 text-center py-8">
                 <div className="bg-white rounded-xl p-2 flex items-center justify-center mb-4 inline-flex">
                     <img 
                         src={OFFICIAL_LOGO_PATH}
                         alt="AulaInfinity" 
                         className="h-10 max-w-full w-auto object-contain" 
                         referrerPolicy="no-referrer"
                         onError={(e) => handleImageError(e, 'full')}
                     />
                </div>
                <p className="text-slate-600 dark:text-slate-400">{t('landing.footer_copyright', { year: new Date().getFullYear() })}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                    <Link to={ROUTES.LOGIN} className="hover:text-primary">{t('login.adminAccess')}</Link>
                </p>
            </footer>
        </div>
    );
};