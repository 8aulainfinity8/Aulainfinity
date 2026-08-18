
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../contexts/AuthContext';
import { AppConfigContext } from '../contexts/AppConfigContext';
import * as api from '../services/api';
import * as dbMock from '../services/mockDatabase';
import { eventEmitter } from '../services/eventService';
import { auth } from '../services/firebase';
import { UserIcon, LockClosedIcon, CheckCircleIcon, AtSymbolIcon, EyeIcon, EyeSlashIcon, AcademicCapIcon } from './icons';
import { PasswordCriteriaItem } from './PasswordCriteriaItem';
import { ROUTES } from '../constants/routes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CourseLevel } from '../types';
import { useI18n } from '../hooks/useI18n';
import { ThemeContext } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { OFFICIAL_LOGO_PATH, handleImageError } from '../constants/branding';

export const LoginPage: React.FC = () => {
    const { t } = useI18n();
    const { theme } = useContext(ThemeContext);
    const [view, setView] = useState<'login' | 'register' | 'recover' | 'verify-email'>('login');
    const [pendingEmail, setPendingEmail] = useState('');
    const [pendingPassword, setPendingPassword] = useState('');
    const [pendingUser, setPendingUser] = useState<any>(null);
    const [registerRole, setRegisterRole] = useState<'student' | 'teacher'>('student');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [recoverSuccess, setRecoverSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(60);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);
    const { login } = useContext(AuthContext);
    const { appConfig } = useContext(AppConfigContext);
    const navigate = useNavigate();

    const [showStudentPassword, setShowStudentPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register: loginRegister, handleSubmit: handleLoginSubmit, setValue: setLoginValue, formState: { errors: loginErrors } } = useForm();
    const { register: registerRegister, handleSubmit: handleRegisterSubmit, watch: registerWatch, formState: { errors: registerErrors, isValid: isRegisterValid } } = useForm({ mode: 'onChange' });
    const { register: recoverRegister, handleSubmit: handleRecoverSubmit, getValues: getRecoverValues } = useForm();

    const queryClient = useQueryClient();
    useEffect(() => {
        const handleSync = () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        };
        eventEmitter.on('courses-updated', handleSync);
        return () => {
            eventEmitter.off('courses-updated', handleSync);
        };
    }, [queryClient]);

    const { data: courses } = useQuery<CourseLevel[]>({
        queryKey: ['courses'],
        queryFn: api.fetchCourses,
    });
    
    const registrationCourses = useMemo(() => {
        return courses ?? [];
    }, [courses]);

    const availableLevels = useMemo(() => {
        if (courses) {
            return courses.map(c => c.name);
        }
        return [];
    }, [courses]);

    const availableSubjects = useMemo(() => {
        if (!courses) return [];
        const subjects = new Set<string>();
        courses.forEach(c => {
            if (c.subjects) {
                c.subjects.forEach(s => subjects.add(s.name));
            }
        });
        return Array.from(subjects);
    }, [courses]);

    const passwordForValidation = registerWatch('password', '') || '';
    const passwordCriteria = {
        minLength: passwordForValidation.length >= 8,
        uppercase: /[A-Z]/.test(passwordForValidation),
        lowercase: /[a-z]/.test(passwordForValidation),
        number: /[0-9]/.test(passwordForValidation),
    };
    
    const onStudentLoginSubmit = async (data: any) => {
        setIsLoading(true);
        setError('');
        try {
            const user = await api.authenticateStudent(data.email, data.password);
            if (user) {
                login(user);
                if (user.role === 'admin') {
                    navigate(ROUTES.ADMIN_ROOT);
                } else {
                    navigate(ROUTES.DASHBOARD);
                }
            } else {
                setError(t('login.error_incorrect_credentials'));
            }
        } catch (err: any) {
            const errMsg = err instanceof Error ? err.message : t('login.error_logging_in');
            setError(errMsg);
            if (errMsg.toLowerCase().includes('verific') || errMsg.toLowerCase().includes('confirmaci')) {
                setPendingEmail(data.email);
                setPendingPassword(data.password);
                const mockUser = dbMock.dbFindUserByEmail(data.email);
                if (mockUser) {
                    setPendingUser(mockUser);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckVerificationAndLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const isVerified = await api.checkIsEmailVerified(pendingEmail, pendingPassword);
            if (!isVerified) {
                setError('⚠️ Tu correo electrónico aún no ha sido verificado. Por favor, abre la bandeja de entrada o carpeta de spam de ' + pendingEmail + ', haz clic en el enlace de confirmación que te hemos enviado y vuelve a pulsar este botón.');
                setIsLoading(false);
                return;
            }

            const user = (pendingEmail && pendingPassword) ? await api.authenticateStudent(pendingEmail, pendingPassword) : (pendingUser || dbMock.dbFindUserByEmail(pendingEmail));
            if (user) {
                if (user.role !== 'admin' && auth) {
                    const verifiedNow = await api.checkIsEmailVerified(user.email, pendingPassword);
                    if (!verifiedNow) {
                        setError('⚠️ Tu correo electrónico aún no ha sido confirmado. Por favor revisa tu bandeja de entrada o carpeta de spam.');
                        setIsLoading(false);
                        return;
                    }
                }
                login(user);
                if (user.role === 'admin') {
                    navigate(ROUTES.ADMIN_ROOT);
                } else {
                    navigate(ROUTES.DASHBOARD);
                }
            }
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Error al comprobar la verificación.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerificationEmail = async () => {
        if (resendCooldown > 0) return;
        setIsLoading(true);
        setError('');
        try {
            await api.resendVerificationEmail(pendingEmail, pendingPassword);
            setError('✓ Correo de verificación reenviado a ' + pendingEmail + '. Revisa tu bandeja de entrada o carpeta de spam.');
            setResendCooldown(60);
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Error al reenviar el correo de verificación.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async (role: 'student' | 'teacher' = 'student') => {
        setIsLoading(true);
        setError('');
        try {
            const courseId = registerWatch('enrolledCourseId');
            const user = await api.loginWithGoogle(role, courseId);
            if (user) {
                login(user);
                if (user.role === 'admin') {
                    navigate(ROUTES.ADMIN_ROOT);
                } else {
                    navigate(ROUTES.DASHBOARD);
                }
            }
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const onRecoverySubmit = async (data: any) => {
        setIsLoading(true);
        setError('');
        try {
            await api.requestPasswordRecovery(data.email);
            setRecoverSuccess(true);
        } catch (err) {
            setError(t('login.error_recovery'));
        } finally {
            setIsLoading(false);
        }
    };

    const onRegister = async (data: any) => {
        if (!isRegisterValid) {
            setError(t('login.error_fix_form'));
            return;
        }
        if (registerRole === 'teacher') {
            if (selectedSubjects.length === 0) {
                setError('Por favor, selecciona al menos una asignatura.');
                return;
            }
            if (selectedLevels.length === 0) {
                setError('Por favor, selecciona al menos un nivel educativo.');
                return;
            }
            if (!data.schedules) {
                setError('Por favor, indica tu horario de disponibilidad.');
                return;
            }
        }
        setIsLoading(true);
        setError('');
        try {
            if (registerRole === 'student') {
                const newUser = await api.registerStudent({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    enrolledCourseIds: [data.enrolledCourseId],
                    phone: data.phone,
                });
                setPendingEmail(data.email);
                setPendingPassword(data.password);
                setPendingUser(newUser);
                setResendCooldown(60);
                setView('verify-email');
            } else {
                const newTeacher = await api.registerTeacher({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    phone: data.phone,
                    category: selectedSubjects[0],
                    subjects: selectedSubjects,
                    levels: selectedLevels,
                    schedules: [data.schedules],
                });
                setPendingEmail(data.email);
                setPendingPassword(data.password);
                setPendingUser(newTeacher);
                setResendCooldown(60);
                setView('verify-email');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('login.error_register'));
        } finally {
            setIsLoading(false);
        }
    };

    const benefits = [
        t('login.benefit1'),
        t('login.benefit2'),
        t('login.benefit3'),
        t('login.benefit4'),
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 font-sans relative">
            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                <ThemeToggle />
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-4xl mx-auto pt-8 sm:pt-0">
                <Link to={ROUTES.LANDING} className="flex items-center justify-center mb-8 hover:opacity-90 transition-opacity relative z-10 min-h-[60px]">
                    <img 
                        src={OFFICIAL_LOGO_PATH} 
                        alt="AulaInfinity Logo" 
                        className="h-14 md:h-16 w-auto object-contain block bg-white p-2 rounded-xl shadow-md" 
                        referrerPolicy="no-referrer"
                        loading="eager"
                        onError={(e) => handleImageError(e, 'full')}
                    />
                </Link>

                <div className="premium-card shadow-2xl flex flex-col md:flex-row overflow-hidden border-none">
                    <div className="w-full md:w-1/2 p-8 md:p-12 text-white flex flex-col justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 relative overflow-hidden">
                        {/* Decorative background visual elements */}
                        <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
                        
                        <h2 className="text-3xl font-bold mb-6 font-display relative z-10">{t('login.title')}</h2>
                        <ul className="space-y-4 relative z-10">
                            {benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckCircleIcon className="w-5.5 h-5.5 mr-3 mt-1 flex-shrink-0 text-blue-300" />
                                    <span className="text-slate-100 font-medium text-sm leading-relaxed">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-800">
                        <div>
                            {view !== 'recover' && view !== 'verify-email' && (
                            <div className="flex border-b border-gray-100 dark:border-slate-700/60 mb-6">
                                <button onClick={() => { setView('login'); setError(''); }} className={`flex-1 pb-3 font-semibold text-center transition-all border-b-2 ${view === 'login' ? 'text-primary border-primary font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 border-transparent'}`}>
                                    {t('login.login')}
                                </button>
                                <button onClick={() => { setView('register'); setError(''); }} className={`flex-1 pb-3 font-semibold text-center transition-all border-b-2 ${view === 'register' ? 'text-primary border-primary font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 border-transparent'}`}>
                                    {t('login.register')}
                                </button>
                            </div>
                            )}

                            {view === 'login' && (
                                <div className="animate-fade-in">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-display">{t('login.helloAgain')}</h3>
                                    <p className="text-slate-500 dark:text-slate-450 mb-5 text-sm">{t('login.loginToContinue')}</p>

                                    {/* Google Sign-In Option */}
                                    <div className="mb-5">
                                        <button
                                            type="button"
                                            id="google-login-btn"
                                            disabled={isLoading}
                                            onClick={() => handleGoogleSignIn('student')}
                                            className="w-full py-2.5 px-4 flex items-center justify-center gap-3 bg-white dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-100 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                                <path
                                                    fill="#4285F4"
                                                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                                                />
                                                <path
                                                    fill="#34A853"
                                                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                                                />
                                                <path
                                                    fill="#FBBC05"
                                                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                                                />
                                                <path
                                                    fill="#EA4335"
                                                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                                                />
                                            </svg>
                                            <span>Continuar con Google</span>
                                        </button>

                                        <div className="relative my-4 flex items-center justify-center">
                                            <div className="border-t border-slate-200 dark:border-slate-700 w-full"></div>
                                            <span className="bg-white dark:bg-slate-800 px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">o con correo electrónico</span>
                                        </div>
                                    </div>

                                     <form onSubmit={handleLoginSubmit(onStudentLoginSubmit)} className="space-y-4">
                                        <div>
                                            <label htmlFor="login-email" className="sr-only">{t('login.admin_recover_email_placeholder') || 'Email'}</label>
                                            <div className="relative">
                                                <AtSymbolIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                                <input id="login-email" type="email" aria-invalid={loginErrors.email ? "true" : "false"} placeholder={t('login.admin_recover_email_placeholder') || 'Email'} {...loginRegister("email", { required: t('login.validation_email_required'), pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: t('login.validation_email_invalid') } })} className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50" />
                                            </div>
                                            {loginErrors.email && <p className="text-red-500 text-xs mt-1">{loginErrors.email.message as string}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="login-password" className="sr-only">{t('login.password_placeholder')}</label>
                                            <div className="relative">
                                                <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                                <input id="login-password" type={showStudentPassword ? 'text' : 'password'} aria-invalid={loginErrors.password ? "true" : "false"} placeholder={t('login.password_placeholder')} {...loginRegister("password", { required: t('login.validation_password_required') })} className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50" />
                                                 <button type="button" onClick={() => setShowStudentPassword(!showStudentPassword)} aria-label={showStudentPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary">
                                                    {showStudentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            {loginErrors.password && <p className="text-red-500 text-xs mt-1">{loginErrors.password.message as string}</p>}
                                        </div>
                                         <div className="text-right">
                                            <button type="button" onClick={() => setView('recover')} className="text-sm text-primary hover:underline">{t('login.forgotPassword')}</button>
                                        </div>
                                        {error && (
                                            <div className="space-y-2">
                                                <div className={`p-3 border text-xs rounded-lg text-left ${error.startsWith('✓') ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'}`}>
                                                    <p className="font-medium leading-relaxed">{error}</p>
                                                </div>

                                                {(error.toLowerCase().includes('verific') || error.toLowerCase().includes('confirmaci')) && (
                                                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2 text-left animate-fade-in">
                                                        <p className="text-xs text-blue-900 dark:text-blue-200 font-semibold flex items-center gap-1.5">
                                                            <span>✉️</span> ¿Deseas reenviar el correo de verificación{pendingEmail ? ` a ${pendingEmail}` : ''}?
                                                        </p>
                                                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                                            <button
                                                                type="button"
                                                                disabled={isLoading || resendCooldown > 0}
                                                                onClick={handleResendVerificationEmail}
                                                                className="flex-1 py-2 px-3 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-sm"
                                                            >
                                                                {resendCooldown > 0 ? (
                                                                    <span>⏳ Reenviar en {resendCooldown}s</span>
                                                                ) : (
                                                                    <span>📨 Reenviar correo de confirmación</span>
                                                                )}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setView('verify-email');
                                                                    setError('');
                                                                }}
                                                                className="py-2 px-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                            >
                                                                Verificar estado
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50">
                                           {isLoading ? t('login.logging_in') : t('login.enter')}
                                        </button>
                                    </form>
                                </div>
                            )}
                            {view === 'register' && (
                                <div className="animate-fade-in text-slate-800 dark:text-slate-100">
                                     <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t('login.createAccount')}</h3>
                                     <p className="text-slate-600 dark:text-slate-400 mb-4">{t('login.joinAndImprove')}</p>

                                     {/* Role Selection Tabs */}
                                     <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-lg mb-4 max-w-sm border border-slate-200 dark:border-slate-700">
                                         <button 
                                             type="button"
                                             onClick={() => { setRegisterRole('student'); setError(''); }} 
                                             className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${registerRole === 'student' ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-slate-50 shadow-sm border border-slate-200/50 dark:border-slate-600/50' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                         >
                                             Estudiante
                                         </button>
                                         <button 
                                             type="button"
                                             onClick={() => { setRegisterRole('teacher'); setError(''); }} 
                                             className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${registerRole === 'teacher' ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-slate-50 shadow-sm border border-slate-200/50 dark:border-slate-600/50' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                         >
                                             Profesor
                                         </button>
                                     </div>

                                     {/* Google Quick Sign Up */}
                                     {!(registerRole === 'student' && appConfig?.registrationsOpen === false) && (
                                         <div className="mb-4">
                                             <button
                                                 type="button"
                                                 id="google-register-btn"
                                                 disabled={isLoading}
                                                 onClick={() => handleGoogleSignIn(registerRole)}
                                                 className="w-full py-2.5 px-4 flex items-center justify-center gap-3 bg-white dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-100 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                                             >
                                                 <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                                     <path
                                                         fill="#4285F4"
                                                         d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                                                     />
                                                     <path
                                                         fill="#34A853"
                                                         d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                                                     />
                                                     <path
                                                         fill="#FBBC05"
                                                         d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                                                     />
                                                     <path
                                                         fill="#EA4335"
                                                         d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                                                     />
                                                 </svg>
                                                 <span>Registrarse con Google ({registerRole === 'teacher' ? 'Profesor' : 'Estudiante'})</span>
                                             </button>

                                             <div className="relative my-4 flex items-center justify-center">
                                                 <div className="border-t border-slate-200 dark:border-slate-700 w-full"></div>
                                                 <span className="bg-white dark:bg-slate-800 px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">o completa tus datos</span>
                                             </div>
                                         </div>
                                     )}

                                     {registerRole === 'student' && appConfig?.registrationsOpen === false ? (
                                         <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200/90 text-sm space-y-4">
                                             <div className="flex items-center gap-2 font-bold text-base">
                                                 <span>⚠️</span>
                                                 <span>Matrícula Cerrada Temporalmente</span>
                                             </div>
                                             <p className="leading-relaxed">
                                                 Actualmente el periodo de matriculación para nuevos alumnos se encuentra cerrado por límite de plazas.
                                             </p>
                                             <p className="leading-relaxed">
                                                 Si necesitas un acceso urgente o perteneces a un centro asociado, ponte en contacto con nuestro soporte en:
                                             </p>
                                             <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-amber-200/60 dark:border-amber-900/30 font-semibold space-y-1">
                                                 <p className="flex items-center gap-2">
                                                     <span>📧</span> <a href={`mailto:${appConfig?.supportEmail}`} className="text-primary dark:text-indigo-400 hover:underline">{appConfig?.supportEmail}</a>
                                                 </p>
                                                 {appConfig?.supportPhone && (
                                                     <p className="flex items-center gap-2">
                                                         <span>💬</span> <span>{appConfig?.supportPhone} (WhatsApp)</span>
                                                     </p>
                                                 )}
                                             </div>
                                             <button
                                                 type="button"
                                                 onClick={() => setView('login')}
                                                 className="w-full py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold rounded-lg text-xs transition-colors"
                                             >
                                                 Volver al Inicio de Sesión
                                             </button>
                                         </div>
                                     ) : (
                                         <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
                                            <div>
                                                <label htmlFor="register-name" className="sr-only">{t('login.fullName_placeholder')}</label>
                                                <div className="relative">
                                                    <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                                    <input id="register-name" aria-invalid={registerErrors.name ? "true" : "false"} type="text" placeholder={t('login.fullName_placeholder')} {...registerRegister("name", { required: t('login.validation_name_required') })} className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50" />
                                                </div>
                                                {registerErrors.name && <p className="text-red-500 text-xs mt-1">{registerErrors.name.message as string}</p>}
                                            </div>
                                        <div>
                                            <label htmlFor="register-email" className="sr-only">{t('login.admin_recover_email_placeholder') || 'Email'}</label>
                                            <div className="relative">
                                                <AtSymbolIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                                <input id="register-email" type="email" placeholder={t('login.admin_recover_email_placeholder') || 'Email'} {...registerRegister("email", { required: t('login.validation_email_required'), pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: t('login.validation_email_invalid') } })} className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-primary focus:border-primary transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 ${registerErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
                                            </div>
                                            {registerErrors.email && <p className="text-red-500 text-xs mt-1">{registerErrors.email.message as string}</p>}
                                        </div>

                                        {registerRole === 'student' ? (
                                            <div>
                                                <label htmlFor="register-course" className="sr-only">{t('login.course_placeholder')}</label>
                                                <div className="relative">
                                                    <AcademicCapIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                                    <select
                                                        id="register-course"
                                                        aria-invalid={registerErrors.enrolledCourseId ? "true" : "false"}
                                                        {...registerRegister("enrolledCourseId", { required: registerRole === 'student' ? t('login.validation_course_required') : false })}
                                                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-primary focus:border-primary transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 ${registerErrors.enrolledCourseId ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                                                    >
                                                        <option value="">{t('login.select_course_placeholder')}</option>
                                                        {registrationCourses.map(course => (
                                                            <option key={course.id} value={course.id}>{course.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {registerErrors.enrolledCourseId && <p className="text-red-500 text-xs mt-1">{registerErrors.enrolledCourseId.message as string}</p>}
                                            </div>
                                        ) : (
                                            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200">Información Profesional</h4>
                                                
                                                {/* Subject checkboxes */}
                                                <div>
                                                    <span className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Asignaturas que impartes:</span>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {availableSubjects.map(subject => {
                                                            const isChecked = selectedSubjects.includes(subject);
                                                            return (
                                                                <label key={subject} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer text-xs hover:border-primary transition-all text-slate-750 dark:text-slate-200">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={isChecked}
                                                                        onChange={() => {
                                                                            if (isChecked) {
                                                                                setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                                                                            } else {
                                                                                setSelectedSubjects([...selectedSubjects, subject]);
                                                                            }
                                                                        }}
                                                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                                                    />
                                                                    <span>{subject}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Levels checkboxes */}
                                                <div>
                                                    <span className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Niveles educativos:</span>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {availableLevels.map(level => {
                                                            const isChecked = selectedLevels.includes(level);
                                                            return (
                                                                <label key={level} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer text-xs hover:border-primary transition-all text-slate-750 dark:text-slate-200">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={isChecked}
                                                                        onChange={() => {
                                                                            if (isChecked) {
                                                                                setSelectedLevels(selectedLevels.filter(l => l !== level));
                                                                            } else {
                                                                                setSelectedLevels([...selectedLevels, level]);
                                                                            }
                                                                        }}
                                                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                                                    />
                                                                    <span>{level}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Schedules Availability */}
                                                <div>
                                                    <label htmlFor="register-schedules" className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Horarios Disponibles:</label>
                                                    <input 
                                                        id="register-schedules" 
                                                        type="text" 
                                                        placeholder="Ej: Lunes a Viernes 16:00 - 20:00" 
                                                        {...registerRegister("schedules", { required: registerRole === 'teacher' ? "El horario es obligatorio" : false })} 
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-xs"
                                                    />
                                                    {registerErrors.schedules && <p className="text-red-500 text-xs mt-1">{registerErrors.schedules.message as string}</p>}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label htmlFor="register-phone" className="sr-only">{t('login.phone_label')}</label>
                                            <div className="relative">
                                                <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                                <input id="register-phone" aria-invalid={registerErrors.phone ? "true" : "false"} type="tel" placeholder={t('login.phone_label')} {...registerRegister("phone", { required: t('login.validation_phone_required') })} className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50" />
                                            </div>
                                            {registerErrors.phone && <p className="text-red-500 text-xs mt-1">{registerErrors.phone.message as string}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="register-password" className="sr-only">{t('login.password_placeholder')}</label>
                                            <div className="relative">
                                                <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                                <input id="register-password" aria-invalid={registerErrors.password ? "true" : "false"} type={showRegisterPassword ? 'text' : 'password'} placeholder={t('login.password_placeholder')} {...registerRegister("password", { required: true, minLength: 8, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/ })} className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50" />
                                                <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} aria-label={showRegisterPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary">
                                                    {showRegisterPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            <div className="mt-2 space-y-1 pl-2">
                                                <PasswordCriteriaItem isValid={passwordCriteria.minLength} text="Al menos 8 caracteres" />
                                                <PasswordCriteriaItem isValid={passwordCriteria.uppercase} text="Una letra mayúscula (A-Z)" />
                                                <PasswordCriteriaItem isValid={passwordCriteria.lowercase} text="Una letra minúscula (a-z)" />
                                                <PasswordCriteriaItem isValid={passwordCriteria.number} text="Al menos un número (0-9)" />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="register-confirm-password" className="sr-only">Confirmar contraseña</label>
                                            <div className="relative">
                                                <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                                <input id="register-confirm-password" aria-invalid={registerErrors.confirmPassword ? "true" : "false"} type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirmar contraseña" {...registerRegister("confirmPassword", { required: true, validate: value => value === passwordForValidation || 'Las contraseñas no coinciden.' })} className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-primary focus:border-primary transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 ${registerErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
                                                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary">
                                                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            {registerErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{registerErrors.confirmPassword.message as string}</p>}
                                        </div>

                                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                        <button type="submit" disabled={isLoading || !isRegisterValid} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed">
                                            {isLoading ? 'Registrando...' : t('login.createAccount')}
                                        </button>
                                     </form>
                                     )}
                                </div>
                            )}
                            {view === 'recover' && (
                                 <div className="animate-fade-in">
                                    {recoverSuccess ? (
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Revisa tu correo</h3>
                                            <p className="text-slate-600 dark:text-slate-400 my-4">Si existe una cuenta asociada a <strong>{getRecoverValues('email')}</strong>, hemos enviado un correo con las instrucciones para recuperar tu contraseña.</p>
                                            <button onClick={() => {setView('login'); setRecoverSuccess(false);}} className="w-full text-center text-sm text-primary hover:underline">Volver a Iniciar Sesión</button>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t('login.recoverPassword')}</h3>
                                            <p className="text-slate-600 dark:text-slate-400 mb-6">{t('login.recoverInstructions')}</p>
                                            <form onSubmit={handleRecoverSubmit(onRecoverySubmit)} className="space-y-4">
                                                <div>
                                                    <label htmlFor="recover-email" className="sr-only">Correo electrónico</label>

                                                    <div className="relative">
                                                        <AtSymbolIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                                        <input id="recover-email" type="email" placeholder="Correo electrónico" {...recoverRegister("email", { required: true })} className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50" />
                                                    </div>
                                                </div>
                                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                                <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:bg-primary/50">
                                                {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
                                                </button>
                                                <button type="button" onClick={() => {setView('login'); setError('');}} className="w-full text-center text-sm text-primary hover:underline mt-4">Volver a Iniciar Sesión</button>
                                            </form>
                                        </>
                                    )}
                                 </div>
                            )}
                            {view === 'verify-email' && (
                                <div className="animate-fade-in text-center py-2 space-y-4">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <AtSymbolIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-display">
                                            Verifica tu correo electrónico
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">
                                            Hemos enviado un correo de confirmación a <strong className="text-slate-900 dark:text-white font-semibold">{pendingEmail}</strong>.
                                        </p>
                                    </div>

                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-left text-xs text-amber-800 dark:text-amber-300 space-y-1">
                                        <p className="font-bold flex items-center gap-1.5">
                                            <span>📂</span> Revisa tu carpeta de SPAM / Correo no deseado
                                        </p>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                                            El remitente es <strong>Firebase / AulaInfinity</strong>. Si no encuentras el mensaje en tu bandeja principal, revisa la carpeta de Spam o Promociones.
                                        </p>
                                    </div>

                                    {error && (
                                        <div className={`p-3 border text-xs rounded-lg animate-fade-in text-left ${error.startsWith('✓') ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'}`}>
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-2">
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            onClick={handleCheckVerificationAndLogin}
                                            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            {isLoading ? 'Verificando estado...' : 'Comprobar Verificación e Iniciar Sesión'}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={isLoading || resendCooldown > 0}
                                            onClick={handleResendVerificationEmail}
                                            className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {resendCooldown > 0 ? (
                                                <span>⏳ Reenviar correo disponible en {resendCooldown}s</span>
                                            ) : (
                                                <span>📨 Reenviar correo de confirmación</span>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setView('login');
                                                setError('');
                                            }}
                                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline pt-2 block mx-auto"
                                        >
                                            Volver al inicio de sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
