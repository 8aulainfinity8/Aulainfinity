import React, { useState, useContext, useCallback, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
    CreditCard, 
    Lock, 
    CheckCircle, 
    Calendar, 
    ChevronLeft, 
    User, 
    ShieldCheck, 
    Smartphone, 
    Info, 
    Sparkles, 
    Check,
    AlertCircle,
    Coins,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Gift,
    Video,
    Award,
    HelpCircle,
    Trophy
} from 'lucide-react';
import { AppConfigContext } from '../contexts/AppConfigContext';
import { AuthContext } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { useI18n } from '../hooks/useI18n';
import { toggleSubscriptionStatus, addCredits, fetchInfinityTransactions, createStudentPayment } from '../services/api';
import { InfinityTransaction } from '../types';

export const PaymentPage: React.FC = () => {
    const { appConfig } = useContext(AppConfigContext);
    const { user, updateUser } = useContext(AuthContext);
    const handleBack = useBackNavigation();
    const { t } = useI18n();
    const location = useLocation();

    // Purchase type switcher: 'subscription' (Premium Membership) or 'credits' (Tutoring session bundles)
    const [purchaseType, setPurchaseType] = useState<'subscription' | 'credits'>(() => {
        const params = new URLSearchParams(location.search);
        const typeParam = params.get('type');
        if (typeParam === 'credits' || typeParam === 'subscription') return typeParam;
        return user?.role === 'student' && user.isSubscribed ? 'credits' : 'subscription';
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const typeParam = params.get('type');
        if (typeParam === 'credits' || typeParam === 'subscription') {
            setPurchaseType(typeParam);
        }
    }, [location.search]);

    // Credit bundle selection state
    const [selectedCreditBundle, setSelectedCreditBundle] = useState<'1' | '5' | '10'>('5');

    // Plan duration billing state: 'monthly' or 'annual'
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

    // Payment methods tab state
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'bizum' | 'paypal'>('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [isConfirmed, setIsConfirmed] = useState(false);

    // Transaction history state
    const [transactions, setTransactions] = useState<InfinityTransaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);

    const loadTransactions = useCallback(async () => {
        if (user && user.role === 'student') {
            try {
                const txs = await fetchInfinityTransactions(user.id);
                setTransactions(txs);
            } catch (err) {
                console.error("Error fetching transactions:", err);
            } finally {
                setLoadingTransactions(false);
            }
        }
    }, [user]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions, isConfirmed, user && user.role === 'student' ? user.creditsBalance : undefined]);
    
    // Card states (for Stripe simulation)
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [isCvvFocused, setIsCvvFocused] = useState(false);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // PayPal states
    const [paypalEmail, setPaypalEmail] = useState(user?.email || '');
    const [paypalPassword, setPaypalPassword] = useState('');

    // Dynamic price calculation
    const monthlyPrice = appConfig?.subscriptionPrice || 9.99;
    const annualPrice = appConfig ? (appConfig.subscriptionPrice * 12 * 0.75) : 89.90; // 25% discount
    
    const tutoringPriceUnit = appConfig?.tutoringPrice || 12.50;
    const creditPrices = {
        '1': tutoringPriceUnit * 1.2,
        '5': tutoringPriceUnit * 5 * 0.96,
        '10': tutoringPriceUnit * 10 * 0.8
    };

    const currentPrice = purchaseType === 'subscription'
        ? (billingPeriod === 'monthly' ? monthlyPrice : annualPrice)
        : creditPrices[selectedCreditBundle];

    // Formatting utilities
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 16) value = value.slice(0, 16);
        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
        setCardNumber(formatted);
        if (formErrors.number) setFormErrors(prev => ({ ...prev, number: '' }));
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
        let formatted = value;
        if (value.length > 2) {
            formatted = `${value.slice(0, 2)}/${value.slice(2)}`;
        }
        setCardExpiry(formatted);
        if (formErrors.expiry) setFormErrors(prev => ({ ...prev, expiry: '' }));
    };

    const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 3);
        setCardCvv(value);
        if (formErrors.cvv) setFormErrors(prev => ({ ...prev, cvv: '' }));
    };

    const handleHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCardHolder(e.target.value);
        if (formErrors.holder) setFormErrors(prev => ({ ...prev, holder: '' }));
    };

    // Card network logo
    const cardType = useMemo(() => {
        const cleanNum = cardNumber.replace(/\D/g, '');
        if (cleanNum.startsWith('4')) return 'Visa';
        if (cleanNum.startsWith('5')) return 'Mastercard';
        return 'Card';
    }, [cardNumber]);

    // Validation
    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};
        const cleanNum = cardNumber.replace(/\D/g, '');
        
        if (cleanNum.length !== 16) {
            errors.number = 'El número de tarjeta debe tener 16 dígitos.';
        }
        if (!cardHolder.trim()) {
            errors.holder = 'Indica el nombre del titular de la tarjeta.';
        }
        if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
            errors.expiry = 'Fecha de caducidad incorrecta (MM/AA).';
        } else {
            const [month, year] = cardExpiry.split('/').map(Number);
            if (month < 1 || month > 12) {
                errors.expiry = 'Mes inválido. Debe ser de 01 a 12.';
            }
        }
        if (cardCvv.length !== 3) {
            errors.cvv = 'El CVV debe constar de 3 dígitos.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Secure Stripe check-out workflow (Monthly or Annual plans or Credits purchase)
    const handlePayNow = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!validateForm()) return;

        setIsProcessing(true);
        setProcessingStep(1); // Establishing secure TLS/SSL Handshake with Stripe API

        setTimeout(() => {
            setProcessingStep(2); // Generating Stripe PaymentIntent & Tokenizing card
            setTimeout(() => {
                setProcessingStep(3); // Simulating Bank 3D-Secure 2.0 Web Authentication Challenge
                setTimeout(() => {
                    setProcessingStep(4); // Upgrading and confirming membership/credits
                    setTimeout(async () => {
                        try {
                            let updated;
                            if (purchaseType === 'subscription') {
                                updated = await toggleSubscriptionStatus(user.id, billingPeriod);
                            } else {
                                updated = await addCredits(user.id, parseInt(selectedCreditBundle));
                            }
                            await createStudentPayment({
                                studentId: user.id,
                                amount: currentPrice,
                                concept: purchaseType === 'subscription' 
                                    ? `Suscripción Premium (${billingPeriod === 'annual' ? 'Anual' : 'Mensual'})` 
                                    : `Compra de ${selectedCreditBundle} ${parseInt(selectedCreditBundle) === 1 ? 'Infinity' : 'Infinitys'}`,
                                method: 'Tarjeta',
                                status: 'completed'
                            });
                            updateUser(updated);
                            setIsConfirmed(true);
                        } catch (err) {
                            console.error("Error setting Stripe subscription or credits: ", err);
                        } finally {
                            setIsProcessing(false);
                            setProcessingStep(0);
                        }
                    }, 1000);
                }, 1200);
            }, 1200);
        }, 1200);
    };

    // PayPal instant check-out trigger
    const handlePayPalPay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!paypalEmail.includes('@') || paypalPassword.length < 4) {
            alert('Por favor introduzca un correo electrónico de PayPal válido y una contraseña (mín. 4 caracteres)');
            return;
        }

        setIsProcessing(true);
        setProcessingStep(1); // Secure PayPal Handshake

        setTimeout(() => {
            setProcessingStep(2); // Processing PayPal Balance
            setTimeout(() => {
                setProcessingStep(3); // Upgrading Account or Credits
                setTimeout(async () => {
                    try {
                        let updated;
                        if (purchaseType === 'subscription') {
                            updated = await toggleSubscriptionStatus(user.id, billingPeriod);
                        } else {
                            updated = await addCredits(user.id, parseInt(selectedCreditBundle));
                        }
                        await createStudentPayment({
                            studentId: user.id,
                            amount: currentPrice,
                            concept: purchaseType === 'subscription' 
                                ? `Suscripción Premium (${billingPeriod === 'annual' ? 'Anual' : 'Mensual'})` 
                                : `Compra de ${selectedCreditBundle} ${parseInt(selectedCreditBundle) === 1 ? 'Infinity' : 'Infinitys'}`,
                            method: 'Transferencia',
                            status: 'completed'
                        });
                        updateUser(updated);
                        setIsConfirmed(true);
                    } catch (err) {
                        console.error("Error setting PayPal subscription or credits: ", err);
                    } finally {
                        setIsProcessing(false);
                        setProcessingStep(0);
                    }
                }, 1000);
            }, 1200);
        }, 1200);
    };

    const handleBizumConfirm = async () => {
        if (!user) return;
        setIsProcessing(true);
        setProcessingStep(1); // Notifying system

        setTimeout(async () => {
            try {
                // Register pending Bizum payment for Admin bank verification (DO NOT add credits/subscription yet)
                await createStudentPayment({
                    studentId: user.id,
                    amount: currentPrice,
                    concept: purchaseType === 'subscription'
                        ? `Suscripción Premium (${billingPeriod === 'annual' ? 'Anual' : 'Mensual'}) [Pendiente Bizum]`
                        : `Compra de ${selectedCreditBundle} ${parseInt(selectedCreditBundle) === 1 ? 'Infinity' : 'Infinitys'} [Pendiente Bizum]`,
                    method: 'Bizum',
                    status: 'pending',
                    itemType: purchaseType,
                    itemQuantity: purchaseType === 'credits' ? parseInt(selectedCreditBundle) : undefined,
                    billingPeriod: purchaseType === 'subscription' ? billingPeriod : undefined,
                });
                setIsConfirmed(true);
            } catch (err) {
                console.error("Error notifying Bizum: ", err);
            } finally {
                setIsProcessing(false);
                setProcessingStep(0);
            }
        }, 1200);
    };

    if (!appConfig) {
        return (
            <div className="flex justify-center items-center h-64 text-slate-550 dark:text-slate-400 font-medium">
                Cargando información de pago...
            </div>
        );
    }

    const studentUser = user?.role === 'student' ? user : null;
    const isAlreadySubscribed = studentUser?.isSubscribed;

    return (
        <div className="max-w-3xl mx-auto animate-slide-in-up">
            <button 
                onClick={handleBack} 
                className="flex items-center mb-6 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors duration-200 select-none cursor-pointer"
            >
                <ChevronLeft className="w-5 h-5 mr-1.5" /> Volver
            </button>

            {/* Header branding */}
            <div className="text-center mb-6">
                <div className="inline-flex p-3.5 bg-indigo-500/10 text-indigo-500 rounded-full mb-3">
                    <CreditCard className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mt-1 font-display">
                    {purchaseType === 'subscription' ? t('payment.titleSubscription') : t('payment.titleCredits')}
                </h1>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
                    {purchaseType === 'subscription' 
                        ? t('landing.subtitle')
                        : t('payment.subtitleCredits')}
                </p>
            </div>

            {/* Guía Interactiva Completa de Infinitys */}
            <div className="mb-8 bg-gradient-to-br from-indigo-50/50 via-slate-50/20 to-amber-50/10 dark:from-indigo-950/20 dark:via-slate-800/10 dark:to-amber-950/5 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                        <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-slate-50">
                            {t('payment.howItWorks')} 🪙
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('payment.pricingInfo')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Tarjeta 1: ¿Qué son y por qué usarlos? */}
                    <div className="bg-white dark:bg-slate-800/40 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-750 flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Video className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                {t('payment.whatAreThey')}
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('payment.whatAreTheyDesc') }} />
                        <div className="mt-auto pt-2 text-[10.5px] font-black text-indigo-600 dark:text-indigo-400">
                            {t('payment.oneInfinityEquals')}
                        </div>
                    </div>

                    {/* Tarjeta 2: Acceso Premium Incluido */}
                    <div className="bg-white dark:bg-slate-800/40 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-750 flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Gift className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                {t('payment.freeMonths')}
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('payment.freeMonthsDesc') }} />
                        <div className="mt-auto pt-2 text-[10.5px] font-black text-emerald-600 dark:text-emerald-400">
                            🌟 {t('common.allIncluded') || 'All Included'}
                        </div>
                    </div>

                    {/* Tarjeta 3: ¿Cuánto cuestan? */}
                    <div className="bg-white dark:bg-slate-800/40 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-750 flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                {t('payment.prices')}
                            </h3>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
                            <p>{t('payment.pricesDesc')}</p>
                            <div className="space-y-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                                <div className="flex justify-between">
                                    <span>🥉 Bronze Pack:</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">{(creditPrices['1']).toFixed(2)}€ / ud</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>🥈 Silver Pack (5):</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">{(creditPrices['5'] / 5).toFixed(2)}€ / ud (-20%)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>🥇 Gold Pack (10):</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">{(creditPrices['10'] / 10).toFixed(2)}€ / ud (-33%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selector de Tipo de Compra */}
            <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl mb-8 max-w-sm mx-auto">
                <button
                    type="button"
                    onClick={() => setPurchaseType('subscription')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                        purchaseType === 'subscription'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                >
                    <Sparkles className="w-4 h-4" />
                    {t('common.premiumPlan') || 'Premium Plan'}
                </button>
                <button
                    type="button"
                    onClick={() => setPurchaseType('credits')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                        purchaseType === 'credits'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                >
                    <Coins className="w-4 h-4" />
                    {t('payment.titleCredits')}
                </button>
            </div>

            {/* If user is already active premium and has chosen subscription */}
            {purchaseType === 'subscription' && isAlreadySubscribed ? (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-150 dark:border-slate-700/60 text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 text-white text-3xl shadow-md">
                        ✓
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t('payment.alreadyMember')}</h3>
                    <p className="text-slate-550 dark:text-slate-400 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
                        {t('payment.alreadyMemberDesc')}
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            type="button"
                            onClick={() => setPurchaseType('credits')}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-extrabold rounded-xl shadow-[0_10px_25px_rgba(99,102,241,0.4)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.5)] transition-all duration-300 text-sm cursor-pointer select-none flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.98]"
                        >
                            <Coins className="w-4 h-4" /> Adquirir Infinitys
                        </button>
                        <Link 
                            to={ROUTES.DASHBOARD} 
                            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-205 font-bold rounded-xl transition-all text-sm cursor-pointer select-none"
                        >
                            Ir al Dashboard
                        </Link>
                    </div>
                </div>
            ) : isConfirmed ? (
                /* Success view */
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 text-white text-5xl shadow-[0_8px_20px_rgba(99,102,241,0.25)]">
                        ⭐
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 font-display">
                        {paymentMethod === 'bizum' ? (
                            `¡Solicitud de Pago por Bizum Registrada!`
                        ) : purchaseType === 'subscription' ? (
                            paymentMethod === 'card' 
                                ? `¡Membresía ${billingPeriod === 'monthly' ? 'Mensual' : 'Anual'} Stripe Activada!` 
                                : `¡Suscripción ${billingPeriod === 'monthly' ? 'Mensual' : 'Anual'} PayPal Asociada!` 
                        ) : (
                            `¡Paquete de Infinitys Adquirido!`
                        )}
                    </h3>
                    <p className="text-sm text-slate-550 dark:text-slate-450 mt-3 max-w-md mx-auto leading-relaxed font-semibold">
                        {paymentMethod === 'bizum' ? (
                            `Hemos registrado tu solicitud de pago por Bizum de ${currentPrice.toFixed(2)}€. Tu solicitud ha quedado en estado PENDIENTE DE VALIDACIÓN BANCARIA. Nuestro equipo comprobará el ingreso en la cuenta del banco y dará el visto bueno para asignar tus ${purchaseType === 'subscription' ? 'meses Premium' : `${selectedCreditBundle} ${parseInt(selectedCreditBundle) === 1 ? 'Infinity' : 'Infinitys'}`} tan pronto como se confirme.`
                        ) : purchaseType === 'subscription' ? (
                            paymentMethod === 'card' 
                                ? `¡Enhorabuena! Tu pago a través de la pasarela segura de Stripe para el plan ${billingPeriod === 'monthly' ? `Mensual (${monthlyPrice.toFixed(2)}€/mes)` : `Anual (${annualPrice.toFixed(2)}€/año)`} se ha procesado con total éxito. Dispones de acceso completo e instantáneo.` 
                                : `¡Verificación Correcta! Tu cuenta de PayPal se ha vinculado con éxito al plan de facturación ${billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}.`
                        ) : (
                            `¡Estupendo! Has adquirido ${selectedCreditBundle} ${parseInt(selectedCreditBundle) === 1 ? 'Infinity' : 'Infinitys'} de tutoría por ${currentPrice.toFixed(2)}€ a través de ${paymentMethod === 'card' ? 'Stripe' : 'PayPal'}. Tu saldo actual es de ${studentUser?.creditsBalance || 0} ${studentUser?.creditsBalance === 1 ? 'Infinity' : 'Infinitys'}.`
                        )}
                    </p>
                    
                    <div className="mt-8 flex justify-center gap-4">
                        <Link 
                            to={ROUTES.DASHBOARD} 
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all text-sm cursor-pointer select-none"
                        >
                            Dashboard
                        </Link>
                        <Link 
                            to={ROUTES.TUTORING} 
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-205 font-bold rounded-xl transition-all text-sm cursor-pointer select-none"
                        >
                            Reservar Tutoría 🪙
                        </Link>
                    </div>
                    <p className="text-xs text-slate-400 mt-6 font-medium">
                        Si tienes dudas o requieres asistencia de soporte, escribe a <a href={`mailto:${appConfig.supportEmail}`} className="text-indigo-500 hover:underline">{appConfig.supportEmail}</a>
                    </p>
                </motion.div>
            ) : (
                /* Normal flow purchase container */
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-150 dark:border-slate-750 overflow-hidden animate-fade-in">
                    
                    {/* Price stamp bar (reflects dynamic billing plan) */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 px-6 flex justify-between items-center select-none">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
                            <span className="font-extrabold tracking-wide text-xs uppercase text-indigo-150">
                                {purchaseType === 'subscription' 
                                    ? `Plan Premium ${billingPeriod === 'monthly' ? 'Mensual' : 'Anual'} (Stripe Co.)`
                                    : `Paquete de ${selectedCreditBundle} ${parseInt(selectedCreditBundle) === 1 ? 'Infinity' : 'Infinitys'} (Stripe Co.)`}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl sm:text-3xl font-black font-display">
                                {currentPrice.toFixed(2)}€
                            </span>
                            <span className="text-[11px] text-indigo-150 block mt-0.5">
                                {purchaseType === 'subscription'
                                    ? (billingPeriod === 'monthly' ? '/ mes - sin permanencia' : '/ año completo (-25% descuento)')
                                    : 'Pago único - saldo acumulable'}
                            </span>
                        </div>
                    </div>

                    {purchaseType === 'subscription' ? (
                        /* Interactive Plan Selector Cards */
                        <div className="p-5 border-b border-gray-100 dark:border-slate-700/60 bg-slate-50/20 dark:bg-slate-900/5">
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-3">
                                Selecciona la Duración de tu Suscripción Premium
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setBillingPeriod('monthly')}
                                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                        billingPeriod === 'monthly'
                                            ? 'border-indigo-600 bg-indigo-50/15 dark:bg-indigo-950/10 shadow-sm'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-900 dark:text-slate-105">Facturación Mensual</span>
                                        {billingPeriod === 'monthly' && <span className="text-[10px] bg-indigo-600 text-white font-extrabold p-0.5 px-2 rounded-full">Activo</span>}
                                    </div>
                                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 block mt-1.5">{monthlyPrice.toFixed(2)}€<span className="text-xs font-medium text-slate-450 dark:text-slate-400 font-sans">/mes</span></span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-450 block mt-1 font-semibold leading-tight">Cancela cuando quieras, sin mínimo</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setBillingPeriod('annual')}
                                    className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                                        billingPeriod === 'annual'
                                            ? 'border-indigo-600 bg-indigo-50/15 dark:bg-indigo-950/10 shadow-sm'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <span className="absolute -top-2.5 right-3 text-[10px] bg-emerald-500 text-white font-extrabold p-0.5 px-2.5 rounded-full select-none shadow">AHORRA 25%</span>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-900 dark:text-slate-105">Facturación Anual</span>
                                        {billingPeriod === 'annual' && <span className="text-[10px] bg-indigo-600 text-white font-extrabold p-0.5 px-2 rounded-full">Activo</span>}
                                    </div>
                                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 block mt-1.5">{annualPrice.toFixed(2)}€<span className="text-xs font-medium text-slate-450 dark:text-slate-400 font-sans">/año</span></span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-455 block mt-1 font-semibold leading-tight">Acceso premium ininterrumpido 12 meses</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Interactive Credit Pack Selector */
                        <div className="p-5 border-b border-gray-100 dark:border-slate-700/60 bg-slate-50/20 dark:bg-slate-900/5 animate-fade-in">
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-3">
                                Selecciona un Paquete de Infinitys de Tutoría 🪙
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCreditBundle('1')}
                                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                        selectedCreditBundle === '1'
                                            ? 'border-indigo-600 bg-indigo-50/15 dark:bg-indigo-950/10 shadow-sm'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <span className="text-xs font-bold text-slate-450 block mb-1">Bronce 🥉</span>
                                    <span className="text-lg font-extrabold text-slate-900 dark:text-slate-105">1 Infinity</span>
                                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 block mt-1.5">{creditPrices['1'].toFixed(2)}€</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-450 block mt-1 font-semibold leading-tight">1 clase particular de 1 hora</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedCreditBundle('5')}
                                    className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                                        selectedCreditBundle === '5'
                                            ? 'border-indigo-600 bg-indigo-50/15 dark:bg-indigo-950/10 shadow-sm'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <span className="absolute -top-2.5 right-2 text-[9px] bg-indigo-600 text-white font-extrabold p-0.5 px-2 rounded-full shadow">AHORRA 20%</span>
                                    <span className="text-xs font-bold text-slate-450 block mb-1">Plata 🥈</span>
                                    <span className="text-lg font-extrabold text-slate-900 dark:text-slate-105">5 Infinitys</span>
                                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 block mt-1.5 font-display">{creditPrices['5'].toFixed(2)}€</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-450 block mt-1 font-semibold leading-tight">{(creditPrices['5'] / 5).toFixed(2)}€ por clase de calidad</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedCreditBundle('10')}
                                    className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                                        selectedCreditBundle === '10'
                                            ? 'border-indigo-600 bg-indigo-50/15 dark:bg-indigo-950/10 shadow-sm'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <span className="absolute -top-2.5 right-2 text-[9px] bg-emerald-500 text-white font-extrabold p-0.5 px-2.5 rounded-full shadow">AHORRA 33%</span>
                                    <span className="text-xs font-bold text-slate-450 block mb-1">Oro 🥇</span>
                                    <span className="text-lg font-extrabold text-slate-900 dark:text-slate-105">10 Infinitys</span>
                                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 block mt-1.5 font-display">{creditPrices['10'].toFixed(2)}€</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-450 block mt-1 font-semibold leading-tight">{(creditPrices['10'] / 10).toFixed(2)}€ por clase (súper ahorro)</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Simulation Advisory Banner */}
                    <div className="bg-indigo-500/10 border-b border-indigo-500/15 p-3 px-5 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-indigo-800 dark:text-indigo-300 font-semibold leading-normal">
                            <strong>Pasarela de Pagos:</strong> Puedes realizar tus compras de Infinitys o Suscripciones mediante Tarjeta, PayPal o Bizum bancario. Tu saldo actual: <span className="font-mono bg-indigo-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-800 dark:text-indigo-100 font-extrabold">{studentUser?.creditsBalance || 0} {studentUser?.creditsBalance === 1 ? 'Infinity' : 'Infinitys'}</span>.
                        </p>
                    </div>

                    {/* METHOD CONTROLLER TABS */}
                    <div className="flex border-b border-gray-150 dark:border-slate-700/80 p-4 pb-0 bg-slate-50 dark:bg-slate-850/50">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('card')}
                            className={`flex-1 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer select-none ${
                                paymentMethod === 'card' 
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold' 
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            Pasarela Stripe 💳
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('bizum')}
                            className={`flex-1 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer select-none ${
                                paymentMethod === 'bizum' 
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold' 
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            Bizum
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('paypal')}
                            className={`flex-1 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer select-none ${
                                paymentMethod === 'paypal' 
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold' 
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            PayPal
                        </button>
                    </div>

                    {/* METHOD VIEWS */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {paymentMethod === 'card' && (
                                /* CARD METHOD VIEW WITH LIVE FLIPPING CREDIT CARD PREVIEW */
                                <motion.div
                                    key="card-view"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    {/* 3D-Like Credit Card Visual Layout Frame */}
                                    <div className="flex justify-center mb-6 py-4 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-dashed border-gray-150 dark:border-slate-700">
                                        <div className="w-[320px] h-[190px] relative rounded-2xl shadow-xl overflow-hidden text-white select-none transition-transform duration-500 transform-style-3d bg-gradient-to-br from-indigo-700 via-indigo-900 to-purple-800">
                                            
                                            {/* Front Side */}
                                            <div className={`absolute top-0 left-0 w-full h-full p-5 flex flex-col justify-between backface-invisible transition-opacity duration-300 ${isCvvFocused ? 'opacity-0' : 'opacity-100'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-[10px] text-indigo-200 block uppercase font-mono tracking-widest font-black">AulaInfinity Premium</span>
                                                        {/* Chip */}
                                                        <div className="w-10 h-7.5 bg-gradient-to-tr from-amber-300 to-amber-500 rounded-md mt-2 shadow-inner flex items-center relative overflow-hidden">
                                                            <div className="absolute inset-0 opacity-20 border border-slate-950 grid grid-cols-3 grid-rows-3" />
                                                        </div>
                                                    </div>
                                                    {/* Card Provider Emblem logo */}
                                                    <span className="text-sm font-black italic bg-white/10 px-3 py-1 rounded-md text-indigo-100">
                                                        {cardType}
                                                    </span>
                                                </div>

                                                <div>
                                                    {/* Card number display with masks */}
                                                    <div className="font-mono text-[17px] tracking-[4px] text-white">
                                                        {cardNumber || '•••• •••• •••• ••••'}
                                                    </div>
                                                    
                                                    {/* Holder & Expiration */}
                                                    <div className="flex justify-between items-end mt-4">
                                                        <div>
                                                            <span className="text-[8.5px] uppercase text-indigo-300 block tracking-wider">Titular</span>
                                                            <span className="text-xs font-semibold uppercase tracking-wider block font-sans truncate max-w-[170px]">
                                                                {cardHolder || 'Nombre del Estudiante'}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[8.5px] uppercase text-indigo-300 block tracking-wider">Vence</span>
                                                            <span className="text-xs font-mono font-bold block">{cardExpiry || 'MM/AA'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Back Side */}
                                            <div className={`absolute top-0 left-0 w-full h-full bg-indigo-900 rounded-2xl flex flex-col justify-between py-5 backface-invisible transition-opacity duration-300 ${isCvvFocused ? 'opacity-100' : 'opacity-0'}`}>
                                                <div className="mt-2">
                                                    <div className="w-full h-9 bg-slate-950" />
                                                    <div className="px-5 mt-4">
                                                        <span className="text-[8px] text-indigo-250 uppercase block tracking-wider mb-1">Firma / CVV</span>
                                                        <div className="flex items-center">
                                                            <div className="flex-1 bg-indigo-100 h-7.5 rounded-l-md px-2 text-slate-800 text-xs flex items-center italic font-semibold">
                                                                AulaInfinity Security
                                                            </div>
                                                            <div className="bg-amber-400 h-7.5 text-slate-950 font-mono text-center font-bold px-3 flex items-center rounded-r-md">
                                                                {cardCvv || '•••'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="px-5 text-[8px] text-indigo-300 leading-tight">
                                                    Este simulador de pagos verifica la fidelidad y encripta datos usando las políticas locales del workspace AulaInfinity. No se realizan cargos reales.
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    {/* CARD FORM */}
                                    <form onSubmit={handlePayNow} className="space-y-4">
                                        {/* Card Number */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                Número de Tarjeta
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="4000 1234 5678 9010"
                                                    value={cardNumber}
                                                    onChange={handleCardNumberChange}
                                                    onFocus={() => setIsCvvFocused(false)}
                                                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-20 bg-clip-padding border ${
                                                        formErrors.number ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-500'
                                                    } text-sm rounded-xl focus:outline-none focus:ring-2`}
                                                    required
                                                />
                                                <CreditCard className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                            </div>
                                            {formErrors.number && (
                                                <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {formErrors.number}
                                                </p>
                                            )}
                                        </div>

                                        {/* Card Holder */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                Titular de la Tarjeta
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="FRANCISCO JAVIER"
                                                    value={cardHolder}
                                                    onChange={handleHolderChange}
                                                    onFocus={() => setIsCvvFocused(false)}
                                                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border ${
                                                        formErrors.holder ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-500'
                                                    } text-sm rounded-xl focus:outline-none focus:ring-2`}
                                                    required
                                                />
                                                <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                            </div>
                                            {formErrors.holder && (
                                                <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {formErrors.holder}
                                                </p>
                                            )}
                                        </div>

                                        {/* Expiry & CVV Double columns */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Expiry */}
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                    Caducidad (MM/AA)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="12/28"
                                                        value={cardExpiry}
                                                        onChange={handleExpiryChange}
                                                        onFocus={() => setIsCvvFocused(false)}
                                                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border ${
                                                            formErrors.expiry ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-500'
                                                        } text-sm rounded-xl focus:outline-none focus:ring-2`}
                                                        required
                                                    />
                                                    <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                                </div>
                                                {formErrors.expiry && (
                                                    <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        {formErrors.expiry}
                                                    </p>
                                                )}
                                            </div>

                                            {/* CVV */}
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                    CVV / CVC
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="123"
                                                        value={cardCvv}
                                                        onChange={handleCvvChange}
                                                        onFocus={() => setIsCvvFocused(true)}
                                                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border ${
                                                            formErrors.cvv ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-500'
                                                        } text-sm rounded-xl focus:outline-none focus:ring-2`}
                                                        required
                                                    />
                                                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3 relative z-10" />
                                                </div>
                                                {formErrors.cvv && (
                                                    <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        {formErrors.cvv}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Security Stamp footer */}
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-450 pt-2 font-medium">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Pasarela de Stripe directa. Encriptación SSL de 255 bits de pruebas. (Powered by Stripe)</span>
                                        </div>

                                        {/* SUBMIT BUTTON WITH ACTIVE PROCESSING STATE */}
                                        <div className="mt-8">
                                            <button
                                                type="submit"
                                                disabled={isProcessing}
                                                className={`w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                                    isProcessing ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer'
                                                }`}
                                            >
                                                {isProcessing ? (
                                                    <span className="flex items-center gap-2 font-black">
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        {processingStep === 1 && "Iniciando cifrado seguro TLS con Stripe..."}
                                                        {processingStep === 2 && "Creando PaymentIntent de Stripe..."}
                                                        {processingStep === 3 && "Autenticando 3D Secure y confirmando..."}
                                                        {processingStep === 4 && "Activando acceso Premium con Stripe..."}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 justify-center">
                                                        Suscribirse Ahora con Stripe: <span className="font-mono bg-indigo-700/50 px-2 py-0.5 rounded ml-1 text-white">{currentPrice.toFixed(2)}€</span>
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {paymentMethod === 'bizum' && (
                                /* BIZUM MANUAL BANKING METHOD VIEW */
                                <motion.div
                                    key="bizum-view"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-105 flex items-center gap-2">
                                        <Smartphone className="w-5 h-5 text-indigo-500" />
                                        Instrucciones de Pago por Bizum
                                    </h3>
                                    
                                    <ol className="list-decimal list-inside space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                        <li>
                                            Abre tu aplicación bancaria y selecciona la opción de enviar un Bizum.
                                        </li>
                                        <li>
                                            Introduce el siguiente número de teléfono de destino:
                                            <div className="my-2.5 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-center font-mono text-xl font-black text-indigo-600 dark:text-indigo-400 border border-slate-100 dark:border-slate-800">
                                                {appConfig.bizumNumber}
                                            </div>
                                        </li>
                                        <li>
                                            Introduce el importe exacto: <strong className="font-extrabold text-slate-850 dark:text-slate-50">{appConfig.subscriptionPrice.toFixed(2)} €</strong>.
                                        </li>
                                        <li>
                                            En el campo de concepto, escribe la <strong className="font-bold underline text-indigo-500">dirección de correo electrónico</strong> con la que te has registrado:
                                            <div className="mt-1 font-mono text-xs text-center bg-slate-100/50 dark:bg-slate-900/30 p-2 rounded-lg font-bold">
                                                {user?.email || "tu-correo@ejemplo.com"}
                                            </div>
                                        </li>
                                        <li>
                                            Una vez que hayas enviado el Bizum bancario, haz clic en el botón de abajo para que nuestro equipo lo valide en el sistema.
                                        </li>
                                    </ol>

                                    <div className="pt-4 border-t border-slate-105">
                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={handleBizumConfirm}
                                            className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer select-none"
                                        >
                                            {isProcessing ? (
                                                <span className="flex items-center gap-2 font-black">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Notificando Pago Bizum...
                                                </span>
                                            ) : (
                                                "Siguiente: He realizado el Bizum"
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {paymentMethod === 'paypal' && (
                                /* PAYPAL INSTANT WALLET METHOD VIEW */
                                <motion.div
                                    key="paypal-view"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/10 flex items-start gap-3">
                                        <div className="mt-0.5 p-1 bg-amber-500 text-white rounded-md shrink-0">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Checkout Express PayPal Seguro</h4>
                                            <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-1 leading-normal font-medium">
                                                Inicia sesión en tu cuenta de PayPal ficticia de prueba para autorizar el cargo único de {appConfig.subscriptionPrice}€ de forma segura y sin dinero real.
                                            </p>
                                        </div>
                                    </div>

                                    {/* PAYPAL SIMULATED LOGIN FORMS */}
                                    <form onSubmit={handlePayPalPay} className="space-y-4">
                                        {/* PayPal Email */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide">
                                                Correo electrónico de PayPal
                                            </label>
                                            <input
                                                type="email"
                                                placeholder="ejemplo@paypal.com"
                                                value={paypalEmail}
                                                onChange={(e) => setPaypalEmail(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-705 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>

                                        {/* PayPal Password */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide">
                                                Contraseña de PayPal
                                            </label>
                                            <input
                                                type="password"
                                                placeholder="••••••••"
                                                value={paypalPassword}
                                                onChange={(e) => setPaypalPassword(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-705 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>

                                        {/* PAYPAL BRAND EMBLEM CTA BUTTON */}
                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={isProcessing}
                                                className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-full shadow-md text-sm font-black transition-all ${
                                                    isProcessing 
                                                        ? 'bg-amber-300 text-slate-600 opacity-90 cursor-not-allowed' 
                                                        : 'bg-[#ffc439] hover:bg-[#f2b82d] active:bg-[#e6ae22] text-[#003087] cursor-pointer'
                                                }`}
                                            >
                                                {isProcessing ? (
                                                    <span className="flex items-center gap-2 font-black font-sans">
                                                        <svg className="animate-spin h-5 w-5 text-[#003087]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        {processingStep === 1 && "Verificando con PayPal..."}
                                                        {processingStep === 2 && "Validando transacción..."}
                                                        {processingStep === 3 && "Finalizando activación..."}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 tracking-wider uppercase text-xs italic font-black font-sans">
                                                        Pagar con <strong className="text-sky-800 font-extrabold font-sans">Pay</strong><strong className="text-[#0079c1] font-sans font-extrabold">Pal</strong>
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            )}

            {/* Historial de Transacciones de Infinitys */}
            {user && user.role === 'student' && (
                <div className="mt-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                                Historial de Infinitys
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Registro de tus Infinitys ganados y utilizados en la plataforma
                            </p>
                        </div>
                    </div>

                    {loadingTransactions ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <Coins className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-650 mb-3" />
                            <p className="text-sm font-semibold">No hay movimientos registrados</p>
                            <p className="text-xs mt-1 text-slate-400">
                                ¡Completa cursos, supera cuestionarios o reserva tutorías para empezar!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                            {transactions.map((tx) => {
                                const isEarn = tx.type === 'earn';
                                const formattedDate = (() => {
                                    try {
                                        const date = new Date(tx.timestamp);
                                        return date.toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                    } catch {
                                        return tx.timestamp;
                                    }
                                })();
                                return (
                                    <div 
                                        key={tx.id} 
                                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100/80 dark:border-slate-750/50 hover:bg-slate-100/55 dark:hover:bg-slate-750/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-xl shrink-0 ${
                                                isEarn 
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                            }`}>
                                                {isEarn ? (
                                                    <ArrowDownLeft className="w-4 h-4" />
                                                ) : (
                                                    <ArrowUpRight className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                                                    {tx.description}
                                                </p>
                                                <p className="text-[11px] text-slate-450 dark:text-slate-450 mt-0.5">
                                                    {formattedDate}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className={`text-right shrink-0 font-extrabold text-sm ml-4 ${
                                            isEarn 
                                                ? 'text-emerald-600 dark:text-emerald-400' 
                                                : 'text-indigo-600 dark:text-indigo-400'
                                        }`}>
                                            {isEarn ? '+' : ''}{tx.amount} {Math.abs(tx.amount) === 1 ? 'Infinity' : 'Infinitys'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>

    );
};
