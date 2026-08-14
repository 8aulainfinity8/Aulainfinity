import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventEmitter } from '../../services/eventService';
import { useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
    SearchIcon,
    TrendingUpIcon,
    UsersIcon,
    WalletIcon,
    ArrowDownRightIcon,
    ArrowUpRightIcon,
    DownloadIcon,
    PlusCircleIcon,
    CalendarIcon,
    CreditCardIcon,
    CheckCircle2Icon,
    InfoIcon,
    MinusCircleIcon,
    DollarSignIcon,
    BookOpenIcon,
    PercentIcon,
    BriefcaseIcon,
    ChevronRightIcon,
    XIcon,
    ReceiptIcon,
    UserIcon,
    ShieldAlertIcon,
    CheckIcon,
    SmartphoneIcon,
    RotateCcwIcon,
    AlertTriangleIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import * as api from '../../services/api';
import { StudentUser, StudentPayment, StudentExpense, TeacherUser, TeacherPayment } from '../../types';
import { NotificationContext } from '../../contexts/NotificationContext';
import { AppConfigContext } from '../../contexts/AppConfigContext';
import { AdminNotificationContext } from '../../contexts/AdminNotificationContext';

export function AdminSubscriptionManagementPage() {
    const queryClient = useQueryClient();
    const location = useLocation();
    const { addToast } = useContext(NotificationContext);
    const { appConfig, updateConfig } = useContext(AppConfigContext);
    const { acknowledgeNewSubscriptions } = useContext(AdminNotificationContext);

    useEffect(() => {
        acknowledgeNewSubscriptions();
    }, [acknowledgeNewSubscriptions]);
    
    // State
    const [viewMode, setViewMode] = useState<'accounts' | 'analytics' | 'teachers' | 'pricing'>('accounts');
    const [teacherPayPercent, setTeacherPayPercent] = useState<number>(80);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'payments' | 'expenses'>('payments');
    
    // Teacher selection & management states
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
    
    // Modals
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showTeacherPaymentModal, setShowTeacherPaymentModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetCreditBalances, setResetCreditBalances] = useState(true);
    
    // Form States - Student Payments
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentConcept, setPaymentConcept] = useState('Suscripción Premium Mensual');
    const [paymentMethod, setPaymentMethod] = useState<'Tarjeta' | 'Transferencia' | 'Efectivo' | 'Bizum'>('Tarjeta');
    
    // Form States - Student Expenses
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseUnit, setExpenseUnit] = useState<'credits' | 'eur'>('credits');
    const [expenseConcept, setExpenseConcept] = useState('Reserva de Tutoría Individual');

    // Form States - Teacher Payments
    const [teacherAssocStudentId, setTeacherAssocStudentId] = useState('');
    const [teacherClassConcept, setTeacherClassConcept] = useState('Tutoría de Matemáticas');
    const [teacherClassPrice, setTeacherClassPrice] = useState('25');
    const [teacherPercentage, setTeacherPercentage] = useState(80);
    const [teacherPaymentAmount, setTeacherPaymentAmount] = useState('20');
    const [teacherPaymentMethod, setTeacherPaymentMethod] = useState<'Tarjeta' | 'Transferencia' | 'Efectivo' | 'Bizum'>('Transferencia');
    const [teacherPaymentDate, setTeacherPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    // Pricing Config Form States
    const [newSubscriptionPrice, setNewSubscriptionPrice] = useState<string>('');
    const [newTutoringPrice, setNewTutoringPrice] = useState<string>('');
    const [newBizumNumber, setNewBizumNumber] = useState<string>('');

    React.useEffect(() => {
        if (appConfig) {
            setNewSubscriptionPrice(appConfig.subscriptionPrice ? appConfig.subscriptionPrice.toString() : '15');
            setNewTutoringPrice(appConfig.tutoringPrice !== undefined ? appConfig.tutoringPrice.toString() : '12.50');
            setNewBizumNumber(appConfig.bizumNumber || '600 000 000');
        }
    }, [appConfig]);

    // Queries
    const { data: students = [], isLoading: studentsLoading } = useQuery<StudentUser[]>({
        queryKey: ['users'],
        queryFn: api.fetchUsers
    });

    const { data: payments = [], refetch: refetchPayments } = useQuery<StudentPayment[]>({
        queryKey: ['student-payments'],
        queryFn: () => api.fetchStudentPayments()
    });

    const { data: expenses = [], refetch: refetchExpenses } = useQuery<StudentExpense[]>({
        queryKey: ['student-expenses'],
        queryFn: () => api.fetchStudentExpenses()
    });

    const { data: teachers = [], isLoading: teachersLoading } = useQuery<TeacherUser[]>({
        queryKey: ['teachers'],
        queryFn: api.fetchTeachers
    });

    const { data: teacherPayments = [], refetch: refetchTeacherPayments } = useQuery<TeacherPayment[]>({
        queryKey: ['teacher-payments'],
        queryFn: () => api.fetchTeacherPayments()
    });

    const pendingBizumPayments = useMemo(() => {
        return (payments || []).filter((p: StudentPayment) => p.status === 'pending' || p.concept.includes('[Pendiente Bizum]') || p.concept.includes('[Pendiente]'));
    }, [payments]);

    // Mutations
    const approvePaymentMutation = useMutation({
        mutationFn: (paymentId: string) => api.approveStudentPayment(paymentId),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['student-payments'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            refetchPayments();
            addToast(`¡Pago por Bizum verificado y aprobado! Se han cargado los Infinitys/Suscripción a ${res.payment.studentName}.`, 'success');
        },
        onError: (err: any) => {
            addToast(`Error al aprobar el pago: ${err.message}`, 'error');
        }
    });

    const rejectPaymentMutation = useMutation({
        mutationFn: (paymentId: string) => api.rejectStudentPayment(paymentId),
        onSuccess: (pay) => {
            queryClient.invalidateQueries({ queryKey: ['student-payments'] });
            refetchPayments();
            addToast(`Solicitud de pago por Bizum rechazada.`, 'info');
        },
        onError: (err: any) => {
            addToast(`Error al rechazar el pago: ${err.message}`, 'error');
        }
    });
    const createPaymentMutation = useMutation({
        mutationFn: (data: {
            studentId: string;
            amount: number;
            concept: string;
            method: 'Tarjeta' | 'Transferencia' | 'Efectivo' | 'Bizum';
        }) => api.createStudentPayment(data),
        onSuccess: (newPay) => {
            queryClient.invalidateQueries({ queryKey: ['student-payments'] });
            refetchPayments();
            addToast(`Pago de ${newPay.amount}€ registrado con éxito para ${newPay.studentName}.`, 'success');
            setShowPaymentModal(false);
            setPaymentAmount('');
            setPaymentConcept('Suscripción Premium Mensual');
        },
        onError: (err: any) => {
            addToast(`Error al registrar el pago: ${err.message}`, 'error');
        }
    });

    const createExpenseMutation = useMutation({
        mutationFn: (data: {
            studentId: string;
            amount: number;
            unit: 'credits' | 'eur';
            concept: string;
        }) => api.createStudentExpense(data),
        onSuccess: (newExp) => {
            queryClient.invalidateQueries({ queryKey: ['student-expenses'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            refetchExpenses();
            const unitStr = newExp.unit === 'credits' ? 'Créditos' : '€';
            addToast(`Gasto de ${newExp.amount}${unitStr} registrado para ${newExp.studentName}.`, 'success');
            setShowExpenseModal(false);
            setExpenseAmount('');
            setExpenseConcept('Reserva de Tutoría Individual');
        },
        onError: (err: any) => {
            addToast(`Error al registrar el gasto: ${err.message}`, 'error');
        }
    });

    const createTeacherPaymentMutation = useMutation({
        mutationFn: (data: {
            teacherId: string;
            studentId: string;
            classConcept: string;
            classPrice: number;
            percentage: number;
            amount: number;
            method: 'Tarjeta' | 'Transferencia' | 'Efectivo' | 'Bizum';
            date?: string;
        }) => api.createTeacherPayment(data),
        onSuccess: (newPay) => {
            queryClient.invalidateQueries({ queryKey: ['teacher-payments'] });
            refetchTeacherPayments();
            addToast(`Pago de ${newPay.amount}€ registrado con éxito para el profesor ${newPay.teacherName}.`, 'success');
            setShowTeacherPaymentModal(false);
            
            // Reset modal states
            setTeacherAssocStudentId('');
            setTeacherClassConcept('Tutoría de Matemáticas');
            setTeacherClassPrice('25');
            setTeacherPaymentAmount('20');
            setTeacherPaymentMethod('Transferencia');
        },
        onError: (err: any) => {
            addToast(`Error al registrar el pago del profesor: ${err.message}`, 'error');
        }
    });

    const changeSubscriptionMutation = useMutation({
        mutationFn: (data: { studentId: string; period?: 'monthly' | 'annual' }) => 
            api.toggleSubscriptionStatus(data.studentId, data.period),
        onSuccess: (updatedStudent) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['student-payments'] });
            refetchPayments();
            const planName = updatedStudent.isSubscribed
                ? `Premium (${updatedStudent.subscriptionPeriod === 'annual' ? 'Anual' : 'Mensual'})`
                : 'Gratuito';
            addToast(`Plan actualizado a ${planName} para ${updatedStudent.name}.`, 'success');
        },
        onError: (err: any) => {
            addToast(`Error al actualizar el plan: ${err.message}`, 'error');
        }
    });

    const addCreditsMutation = useMutation({
        mutationFn: (data: { studentId: string; amount: number }) => api.addCredits(data.studentId, data.amount),
        onSuccess: (updatedStudent) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['student-payments'] });
            refetchPayments();
            addToast(`Se han añadido créditos a ${updatedStudent.name}.`, 'success');
        },
        onError: (err: any) => {
            addToast(`Error al añadir créditos: ${err.message}`, 'error');
        }
    });

    const deductCreditsMutation = useMutation({
        mutationFn: (data: { studentId: string; amount: number }) => api.deductCredits(data.studentId, data.amount),
        onSuccess: (updatedStudent) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['student-expenses'] });
            refetchExpenses();
            addToast(`Se han reducido los créditos de ${updatedStudent.name}.`, 'success');
        },
        onError: (err: any) => {
            addToast(`Error al reducir créditos: ${err.message}`, 'error');
        }
    });

    const resetFinancialsMutation = useMutation({
        mutationFn: () => api.resetFinancialRecords(resetCreditBalances),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['student-payments'] });
            queryClient.invalidateQueries({ queryKey: ['student-expenses'] });
            queryClient.invalidateQueries({ queryKey: ['teacher-payments'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['infinity-transactions'] });
            refetchPayments();
            refetchExpenses();
            refetchTeacherPayments();
            setShowResetModal(false);
            addToast(res.message || 'Contabilidad e historial financiero reiniciados a cero correctamente.', 'success');
        },
        onError: (err: any) => {
            addToast(`Error al reiniciar la contabilidad: ${err.message}`, 'error');
        }
    });

    const updateConfigMutation = useMutation({
        mutationFn: api.updateAppConfig,
        onSuccess: (data) => {
            queryClient.setQueryData(['appConfig'], data);
            updateConfig(data);
            addToast('Tarifas y precios guardados correctamente.', 'success');
        },
        onError: (err: any) => {
            console.error("Error updating prices:", err);
            addToast('Error al guardar las tarifas de precios.', 'error');
        }
    });

    const handleUpdatePrices = (e: React.FormEvent) => {
        e.preventDefault();
        if (!appConfig) {
            addToast('La configuración general no está cargada.', 'error');
            return;
        }

        const subPrice = parseFloat(newSubscriptionPrice);
        const tutPrice = parseFloat(newTutoringPrice);

        if (isNaN(subPrice) || subPrice <= 0) {
            addToast('Introduce un precio de suscripción mensual superior a 0.', 'error');
            return;
        }

        if (isNaN(tutPrice) || tutPrice <= 0) {
            addToast('Introduce un precio de tutoría superior a 0.', 'error');
            return;
        }

        if (!newBizumNumber.trim()) {
            addToast('Introduce un número de teléfono Bizum válido.', 'error');
            return;
        }

        updateConfigMutation.mutate({
            ...appConfig,
            subscriptionPrice: subPrice,
            tutoringPrice: tutPrice,
            bizumNumber: newBizumNumber.trim()
        });
    };

    // Computed Stats
    const stats = useMemo(() => {
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const activeSubscribers = students.filter(s => s.isSubscribed).length;
        const totalCreditsDeducted = expenses.filter(e => e.unit === 'credits').reduce((sum, e) => sum + e.amount, 0);
        const totalStudentBalance = students.reduce((sum, s) => sum + (s.creditsBalance || 0), 0);
        const totalTeacherPayments = teacherPayments.reduce((sum, p) => sum + p.amount, 0);
        
        return {
            totalRevenue,
            activeSubscribers,
            totalCreditsDeducted,
            totalStudentBalance,
            totalTeacherPayments
        };
    }, [payments, students, expenses, teacherPayments]);

    // Group financial data by Month-Year for Charts (Revenues, Expenses, Cash Flow)
    const monthlyFinanceData = useMemo(() => {
        const monthMap: { [key: string]: { monthKey: string; monthName: string; ingresos: number; gastos: number } } = {};
        const monthNames = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        // 1. Process Student Payments (Revenues)
        payments.forEach(p => {
            const date = new Date(p.date);
            const y = date.getFullYear();
            const m = date.getMonth();
            const key = `${y}-${String(m + 1).padStart(2, '0')}`;
            const label = `${monthNames[m]} ${y}`;
            
            if (!monthMap[key]) {
                monthMap[key] = { monthKey: key, monthName: label, ingresos: 0, gastos: 0 };
            }
            monthMap[key].ingresos += p.amount;
        });

        // 2. Process Student Expenses (Operational Costs)
        const costPerCredit = appConfig?.tutoringPrice ? (appConfig.tutoringPrice * (teacherPayPercent / 100)) : (12.50 * (teacherPayPercent / 100));
        expenses.forEach(e => {
            const date = new Date(e.date);
            const y = date.getFullYear();
            const m = date.getMonth();
            const key = `${y}-${String(m + 1).padStart(2, '0')}`;
            const label = `${monthNames[m]} ${y}`;
            
            if (!monthMap[key]) {
                monthMap[key] = { monthKey: key, monthName: label, ingresos: 0, gastos: 0 };
            }
            
            if (e.unit === 'eur') {
                monthMap[key].gastos += e.amount;
            } else if (e.unit === 'credits') {
                monthMap[key].gastos += e.amount * costPerCredit;
            }
        });

        // 3. Process Teacher Payments (Actual Registered Compensations)
        teacherPayments.forEach(p => {
            const date = new Date(p.date);
            const y = date.getFullYear();
            const m = date.getMonth();
            const key = `${y}-${String(m + 1).padStart(2, '0')}`;
            const label = `${monthNames[m]} ${y}`;
            
            if (!monthMap[key]) {
                monthMap[key] = { monthKey: key, monthName: label, ingresos: 0, gastos: 0 };
            }
            monthMap[key].gastos += p.amount;
        });

        const sortedKeys = Object.keys(monthMap).sort();
        return sortedKeys.map(key => {
            const item = monthMap[key];
            const flujoCaja = item.ingresos - item.gastos;
            return {
                ...item,
                flujoCaja,
                rentabilidad: item.ingresos > 0 ? parseFloat(((flujoCaja / item.ingresos) * 100).toFixed(1)) : 0
            };
        });
    }, [payments, expenses, teacherPayments, appConfig, teacherPayPercent]);

    // Distribution of Income by Category
    const incomeDistribution = useMemo(() => {
        const dist: { [key: string]: number } = {};
        payments.forEach(p => {
            let cat = 'Suscripciones';
            const concept = p.concept.toLowerCase();
            if (concept.includes('crédit') || concept.includes('infinity')) {
                cat = 'Infinitys (Tutorías)';
            } else if (concept.includes('matrícula') || concept.includes('curso')) {
                cat = 'Matrículas de Curso';
            } else if (concept.includes('material') || concept.includes('pdf')) {
                cat = 'Material Escolar';
            }
            dist[cat] = (dist[cat] || 0) + p.amount;
        });
        return Object.keys(dist).map(name => ({ name, value: dist[name] }));
    }, [payments]);

    // Distribution of Operating Expenses by Category
    const expenseDistribution = useMemo(() => {
        const dist: { [key: string]: number } = {};
        const costPerCredit = appConfig?.tutoringPrice ? (appConfig.tutoringPrice * (teacherPayPercent / 100)) : (12.50 * (teacherPayPercent / 100));

        expenses.forEach(e => {
            let cat = 'Materiales y PDFs';
            let amt = e.amount;
            if (e.unit === 'credits') {
                cat = 'Sueldos Profesores (Tutorías)';
                amt = e.amount * costPerCredit;
            } else if (e.concept.toLowerCase().includes('papelería')) {
                cat = 'Material Físico / Papelería';
            } else if (e.concept.toLowerCase().includes('examen')) {
                cat = 'Corrección de Exámenes';
            }
            dist[cat] = (dist[cat] || 0) + amt;
        });

        // Add real registered payments made manually
        teacherPayments.forEach(p => {
            const cat = 'Pagos Directos Profesores';
            dist[cat] = (dist[cat] || 0) + p.amount;
        });

        return Object.keys(dist).map(name => ({ name, value: parseFloat(dist[name].toFixed(2)) }));
    }, [expenses, teacherPayments, appConfig, teacherPayPercent]);

    // Filtering Students
    const filteredStudents = useMemo(() => {
        return students.filter(student => 
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    // Active Student Details
    const activeStudent = useMemo(() => {
        if (!selectedStudentId) return null;
        return students.find(s => s.id === selectedStudentId) || null;
    }, [students, selectedStudentId]);

    // Student Specific Ledger lists
    const activeStudentPayments = useMemo(() => {
        if (!selectedStudentId) return [];
        return payments.filter(p => p.studentId === selectedStudentId);
    }, [payments, selectedStudentId]);

    const activeStudentExpenses = useMemo(() => {
        if (!selectedStudentId) return [];
        return expenses.filter(e => e.studentId === selectedStudentId);
    }, [expenses, selectedStudentId]);

    // Filtering Teachers
    const filteredTeachers = useMemo(() => {
        return teachers.filter(t => 
            t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
            t.email.toLowerCase().includes(teacherSearchTerm.toLowerCase())
        );
    }, [teachers, teacherSearchTerm]);

    // Active Teacher Details
    const activeTeacher = useMemo(() => {
        if (!selectedTeacherId) return null;
        return teachers.find(t => t.id === selectedTeacherId) || null;
    }, [teachers, selectedTeacherId]);

    // Teacher Specific Payments
    const activeTeacherPayments = useMemo(() => {
        if (!selectedTeacherId) return [];
        return teacherPayments.filter(p => p.teacherId === selectedTeacherId);
    }, [teacherPayments, selectedTeacherId]);

    // Automatically select the student from query parameter or the first one if none selected
    React.useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const urlStudentId = queryParams.get('studentId');
        if (urlStudentId && (students || []).some(s => s.id === urlStudentId)) {
            setSelectedStudentId(urlStudentId);
        } else if (filteredStudents.length > 0 && !selectedStudentId) {
            setSelectedStudentId(filteredStudents[0].id);
        }
    }, [filteredStudents, selectedStudentId, students]);

    // Automatically select the first teacher when switching to teachers tab if none selected
    React.useEffect(() => {
        if (viewMode === 'teachers' && filteredTeachers.length > 0 && !selectedTeacherId) {
            setSelectedTeacherId(filteredTeachers[0].id);
        }
    }, [viewMode, filteredTeachers, selectedTeacherId]);

    // Process state from router navigation (such as clicking an admin notification alert)
    React.useEffect(() => {
        if (location.state) {
            const { activeTab, registerPaymentFor, searchStudent } = location.state as any;
            
            if (activeTab === 'teachers') {
                setViewMode('teachers');
                if (registerPaymentFor) {
                    setSelectedTeacherId(registerPaymentFor.teacherId);
                    setTeacherAssocStudentId(registerPaymentFor.studentId);
                    setTeacherClassConcept(`Tutoría de ${registerPaymentFor.subject}`);
                    setTeacherClassPrice('25');
                    setTeacherPercentage(80);
                    setTeacherPaymentAmount('20');
                    setShowTeacherPaymentModal(true);
                }
            } else if (activeTab === 'students') {
                setViewMode('accounts');
                if (searchStudent) {
                    setSearchTerm(searchStudent);
                }
            }
            
            // Clear state to avoid repeating on updates
            window.history.replaceState({}, document.title);
        }
    }, [location.state, students]);

    // Handlers
    const handleAddManualPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !paymentAmount) return;
        
        createPaymentMutation.mutate({
            studentId: selectedStudentId,
            amount: parseFloat(paymentAmount),
            concept: paymentConcept,
            method: paymentMethod
        });
    };

    const handleAddManualExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !expenseAmount) return;
        
        createExpenseMutation.mutate({
            studentId: selectedStudentId,
            amount: parseFloat(expenseAmount),
            unit: expenseUnit,
            concept: expenseConcept
        });
    };

    const handleAddTeacherPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeacherId || !teacherAssocStudentId || !teacherPaymentAmount) {
            addToast('Por favor, completa todos los campos requeridos.', 'error');
            return;
        }

        createTeacherPaymentMutation.mutate({
            teacherId: selectedTeacherId,
            studentId: teacherAssocStudentId,
            classConcept: teacherClassConcept,
            classPrice: parseFloat(teacherClassPrice),
            percentage: teacherPercentage,
            amount: parseFloat(teacherPaymentAmount),
            method: teacherPaymentMethod,
            date: teacherPaymentDate
        });
    };

    const handleTogglePlan = (period?: 'monthly' | 'annual') => {
        if (!selectedStudentId) return;
        if (appConfig?.subscriptionsEnabled === false && period) {
            addToast('Las suscripciones están desactivadas globalmente en Ajustes Generales.', 'error');
            return;
        }
        changeSubscriptionMutation.mutate({ studentId: selectedStudentId, period });
    };

    const handleAddCredits = (amount: number) => {
        if (!selectedStudentId) return;
        addCreditsMutation.mutate({ studentId: selectedStudentId, amount });
    };

    const handleDeductCredits = (amount: number) => {
        if (!selectedStudentId) return;
        deductCreditsMutation.mutate({ studentId: selectedStudentId, amount });
    };

    // PDF Export Function
    const exportStudentLedgerPDF = (student: StudentUser) => {
        const doc = new jsPDF();
        const studentPays = activeStudentPayments;
        const studentExps = activeStudentExpenses;

        // Branding
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('AulaInfinity', 15, 25);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('ESTADO DE CUENTA / FICHA CONTABLE', 140, 25);

        // Header Metadata
        doc.setTextColor(51, 65, 85); // slate-700
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('DATOS DEL ALUMNO', 15, 55);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nombre: ${student.name}`, 15, 65);
        doc.text(`Email: ${student.email}`, 15, 71);
        doc.text(`Teléfono: ${student.phone || 'N/A'}`, 15, 77);
        doc.text(`Registro: ${new Date(student.registrationDate).toLocaleDateString()}`, 15, 83);

        // Plan Status Right Column
        doc.setFont('helvetica', 'bold');
        doc.text('ESTADO DEL PLAN', 120, 55);
        doc.setFont('helvetica', 'normal');
        const planStr = student.isSubscribed 
            ? `Premium (${student.subscriptionPeriod === 'annual' ? 'Anual' : 'Mensual'})` 
            : 'Gratuito / Básico';
        doc.text(`Plan Activo: ${planStr}`, 120, 65);
        doc.text(`Saldo Créditos (Infinitys): ${student.creditsBalance || 0} créditos`, 120, 71);
        
        const totalPaid = studentPays.reduce((sum, p) => sum + p.amount, 0);
        doc.text(`Total Abonado Histórico: ${totalPaid.toFixed(2)}€`, 120, 77);

        // Draw line separator
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(15, 90, 195, 90);

        // Payments Table
        let currentY = 100;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('INGRESOS Y PAGOS REALIZADOS', 15, currentY);
        
        currentY += 8;
        doc.setFontSize(9);
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(15, currentY - 5, 180, 7, 'F');
        doc.text('Fecha', 17, currentY);
        doc.text('Concepto', 45, currentY);
        doc.text('Método', 115, currentY);
        doc.text('Factura', 145, currentY);
        doc.text('Importe', 175, currentY);

        doc.setFont('helvetica', 'normal');
        if (studentPays.length === 0) {
            currentY += 8;
            doc.text('No hay registros de pagos.', 15, currentY);
        } else {
            studentPays.forEach(pay => {
                currentY += 7;
                if (currentY > 270) { doc.addPage(); currentY = 20; }
                doc.text(new Date(pay.date).toLocaleDateString(), 17, currentY);
                doc.text(pay.concept.substring(0, 36), 45, currentY);
                doc.text(pay.method, 115, currentY);
                doc.text(pay.invoiceNumber || '-', 145, currentY);
                doc.text(`${pay.amount.toFixed(2)}€`, 175, currentY);
            });
        }

        // Expenses Table
        currentY += 15;
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('GASTOS Y CONSUMOS REGISTRADOS', 15, currentY);
        
        currentY += 8;
        doc.setFontSize(9);
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(15, currentY - 5, 180, 7, 'F');
        doc.text('Fecha', 17, currentY);
        doc.text('Concepto / Recurso', 45, currentY);
        doc.text('Costo', 175, currentY);

        doc.setFont('helvetica', 'normal');
        if (studentExps.length === 0) {
            currentY += 8;
            doc.text('No hay consumos registrados.', 15, currentY);
        } else {
            studentExps.forEach(exp => {
                currentY += 7;
                if (currentY > 270) { doc.addPage(); currentY = 20; }
                doc.text(new Date(exp.date).toLocaleDateString(), 17, currentY);
                doc.text(exp.concept.substring(0, 55), 45, currentY);
                const amtStr = exp.unit === 'credits' 
                    ? `${exp.amount} ${exp.amount === 1 ? 'Crédito' : 'Créditos'}` 
                    : `${exp.amount.toFixed(2)}€`;
                doc.text(amtStr, 175, currentY);
            });
        }

        // Footer terms
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        currentY += 15;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text('Este documento sirve de justificante contable oficial emitido por AulaInfinity.', 15, currentY);
        doc.text(`Fecha de emisión: ${new Date().toLocaleString()}`, 15, currentY + 4);

        doc.save(`Ficha_Contabilidad_${student.name.replace(/\s+/g, '_')}.pdf`);
        addToast(`Ficha contable de ${student.name} exportada a PDF correctamente.`, 'success');
    };

    return (
        <div id="admin-subscription-page" className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto text-slate-800 dark:text-slate-100 min-h-screen">
            
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        💳 Planes y Finanzas
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Contabilidad completa de alumnos: control de planes, pagos realizados, consumos de créditos y estados de cuenta.
                    </p>
                </div>
                
                {/* Actions & View switcher segment */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setShowResetModal(true)}
                        title="Poner a cero todos los ingresos, gastos y registros contables para comenzar de cero"
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                        <RotateCcwIcon className="w-3.5 h-3.5" />
                        <span>Poner a Cero</span>
                    </button>

                    <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/60 flex-wrap sm:flex-nowrap gap-1">
                        <button
                            onClick={() => setViewMode('accounts')}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'accounts'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <UserIcon className="w-3.5 h-3.5" />
                            Fichas Alumnos
                        </button>
                        <button
                            onClick={() => setViewMode('teachers')}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'teachers'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <BriefcaseIcon className="w-3.5 h-3.5" />
                            Pagos Profesores
                        </button>
                        <button
                            onClick={() => setViewMode('analytics')}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'analytics'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <TrendingUpIcon className="w-3.5 h-3.5" />
                            Gráficos y Flujo de Caja
                        </button>
                        <button
                            onClick={() => setViewMode('pricing')}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'pricing'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            <DollarSignIcon className="w-3.5 h-3.5" />
                            Precios y Tarifas
                        </button>
                    </div>
                </div>
            </div>

            {/* Dashboard Overview Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Ingresos Totales</span>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {stats.totalRevenue.toLocaleString()}€
                        </div>
                        <span className="text-[10px] text-slate-400">Acumulado histórico</span>
                    </div>
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <TrendingUpIcon className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Alumnos Premium</span>
                        <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                            {stats.activeSubscribers}
                        </div>
                        <span className="text-[10px] text-slate-400">Suscripciones vigentes</span>
                    </div>
                    <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    {viewMode === 'teachers' ? (
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pagos a Profesores</span>
                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                {stats.totalTeacherPayments.toLocaleString()}€
                            </div>
                            <span className="text-[10px] text-slate-400">Sueldos y comisiones abonados</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Créditos Consumidos</span>
                            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                {stats.totalCreditsDeducted}
                            </div>
                            <span className="text-[10px] text-slate-400">Tutorías/recursos usados</span>
                        </div>
                    )}
                    <div className={`p-3.5 rounded-xl ${viewMode === 'teachers' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'}`}>
                        {viewMode === 'teachers' ? (
                            <BriefcaseIcon className="w-6 h-6" />
                        ) : (
                            <MinusCircleIcon className="w-6 h-6" />
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    {viewMode === 'teachers' ? (
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Profesores Activos</span>
                            <div className="text-2xl font-black text-amber-500">
                                {teachers.length}
                            </div>
                            <span className="text-[10px] text-slate-400">Equipo docente registrado</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Bolsa de Créditos</span>
                            <div className="text-2xl font-black text-amber-500">
                                {stats.totalStudentBalance}
                            </div>
                            <span className="text-[10px] text-slate-400">Créditos en poder de alumnos</span>
                        </div>
                    )}
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl">
                        {viewMode === 'teachers' ? (
                            <UsersIcon className="w-6 h-6" />
                        ) : (
                            <WalletIcon className="w-6 h-6" />
                        )}
                    </div>
                </div>
            </div>

            {/* Pending Bizum Payments Section */}
            {pendingBizumPayments.length > 0 && (
                <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
                                <SmartphoneIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-base text-amber-900 dark:text-amber-200">
                                    Solicitudes de Pago por Bizum Pendientes ({pendingBizumPayments.length})
                                </h3>
                                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 font-medium">
                                    Comprueba la recepción del dinero en la cuenta del banco y da el visto bueno para cargar automáticamente los Infinitys o la Suscripción al alumno.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pendingBizumPayments.map((pay) => (
                            <div key={pay.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm flex flex-col justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                                            {pay.studentName}
                                        </span>
                                        <span className="text-base font-black text-amber-600 dark:text-amber-400">
                                            {pay.amount.toFixed(2)}€
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        {pay.concept}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                                        <span>📅 {new Date(pay.date).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{pay.invoiceNumber}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => approvePaymentMutation.mutate(pay.id)}
                                        disabled={approvePaymentMutation.isPending}
                                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                    >
                                        <CheckCircle2Icon className="w-4 h-4" />
                                        Dar Visto Bueno
                                    </button>
                                    <button
                                        onClick={() => rejectPaymentMutation.mutate(pay.id)}
                                        disabled={rejectPaymentMutation.isPending}
                                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                                    >
                                        <XIcon className="w-4 h-4" />
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Section */}
            {viewMode === 'accounts' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Side: Students List (col-span-4) */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-4">
                    <div className="space-y-1">
                        <h2 className="font-bold text-base text-slate-900 dark:text-white">Alumnos</h2>
                        <p className="text-xs text-slate-400">Selecciona un alumno para ver su contabilidad</p>
                    </div>

                    {/* Search bar */}
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar alumno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Students list */}
                    {studentsLoading ? (
                        <div className="space-y-2 py-8">
                            {[1, 2, 3].map(n => (
                                <div key={n} className="h-14 bg-slate-50 dark:bg-slate-800/40 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-sm">
                            No se encontraron alumnos.
                        </div>
                    ) : (
                        <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                            {filteredStudents.map((student) => {
                                const isSelected = student.id === selectedStudentId;
                                const studentPays = payments.filter(p => p.studentId === student.id);
                                const totalPaid = studentPays.reduce((sum, p) => sum + p.amount, 0);

                                return (
                                    <button
                                        key={student.id}
                                        onClick={() => setSelectedStudentId(student.id)}
                                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border ${
                                            isSelected
                                                ? 'bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-950 border-slate-900 dark:border-slate-50 font-medium'
                                                : 'bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-100/70 dark:hover:bg-slate-800/30 border-transparent'
                                        }`}
                                    >
                                        <div className="space-y-1 min-w-0 pr-2">
                                            <div className="text-sm font-bold truncate flex items-center gap-1.5">
                                                {student.name}
                                                {student.isSubscribed && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                        isSelected 
                                                            ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900' 
                                                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                                                    }`}>
                                                        {student.subscriptionPeriod === 'annual' ? 'Anual' : 'Mensual'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-xs truncate ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                                                {student.email}
                                            </div>
                                        </div>

                                        <div className="text-right flex-shrink-0">
                                            <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                                {totalPaid}€
                                            </div>
                                            <div className={`text-[10px] ${isSelected ? 'text-slate-300 dark:text-slate-500' : 'text-slate-400'}`}>
                                                {student.creditsBalance || 0} cred.
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Side: Ledger Detail & Accounting Ledger Sheet (col-span-8) */}
                <div className="lg:col-span-8 space-y-6">
                    {activeStudent ? (
                        <div className="space-y-6">
                            
                            {/* Student Profile Card & Summary of Accounting */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">
                                            {activeStudent.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                                {activeStudent.name}
                                            </h3>
                                            <p className="text-xs text-slate-400">{activeStudent.email} • {activeStudent.phone || 'Sin Teléfono'}</p>
                                        </div>
                                    </div>

                                    {/* Action items */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => exportStudentLedgerPDF(activeStudent)}
                                            className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-1.5 transition-colors"
                                        >
                                            <DownloadIcon className="w-3.5 h-3.5" />
                                            Exportar Ficha (PDF)
                                        </button>
                                        <button
                                            onClick={() => setShowPaymentModal(true)}
                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            <PlusCircleIcon className="w-3.5 h-3.5" />
                                            Registrar Pago
                                        </button>
                                        <button
                                            onClick={() => setShowExpenseModal(true)}
                                            className="px-3.5 py-1.5 bg-slate-800 dark:bg-slate-100 hover:bg-slate-900 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            <MinusCircleIcon className="w-3.5 h-3.5" />
                                            Registrar Gasto
                                        </button>
                                    </div>
                                </div>

                                {/* Active Plan details & Ledger Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-semibold text-slate-400">Plan Actual</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            {activeStudent.isSubscribed ? (
                                                <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-black rounded-full">
                                                    PREMIUM {activeStudent.subscriptionPeriod === 'annual' ? 'ANUAL' : 'MENSUAL'}
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-full">
                                                    GRATUITO / BÁSICO
                                                </span>
                                            )}
                                        </div>
                                        {appConfig?.subscriptionsEnabled === false ? (
                                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block mt-2.5">
                                                🛑 Suscripciones Desactivadas Globalmente
                                            </span>
                                        ) : (
                                            <div className="flex gap-1.5 mt-2.5">
                                                <button
                                                    onClick={() => handleTogglePlan('monthly')}
                                                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                                                        activeStudent.isSubscribed && activeStudent.subscriptionPeriod === 'monthly'
                                                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-50 dark:text-slate-950'
                                                            : 'hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 border-slate-200 dark:border-slate-800'
                                                    }`}
                                                >
                                                    P. Mensual
                                                </button>
                                                <button
                                                    onClick={() => handleTogglePlan('annual')}
                                                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                                                        activeStudent.isSubscribed && activeStudent.subscriptionPeriod === 'annual'
                                                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-50 dark:text-slate-950'
                                                            : 'hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 border-slate-200 dark:border-slate-800'
                                                    }`}
                                                >
                                                    P. Anual
                                                </button>
                                                {activeStudent.isSubscribed && (
                                                    <button
                                                        onClick={() => handleTogglePlan(undefined)}
                                                        className="text-[10px] text-red-500 font-bold px-2 py-1 rounded-lg border border-red-200 dark:border-red-950 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                    >
                                                        Dar Baja
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-semibold text-slate-400">Tiempo de Plan</span>
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
                                            {activeStudent.isSubscribed ? (
                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                    {activeStudent.subscriptionPeriod === 'annual' ? '354 días restantes' : '22 días restantes'}
                                                </span>
                                            ) : (
                                                <span>Acceso estándar</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Registrado el: {new Date(activeStudent.registrationDate).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-semibold text-slate-400">Créditos Infinitys</span>
                                        <div className="text-base font-black text-amber-500 mt-1 flex items-center gap-1.5">
                                            🪙 {activeStudent.creditsBalance || 0} Créditos
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 p-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                                                <span className="text-[9px] font-extrabold text-amber-700 dark:text-amber-400 px-1">Subir:</span>
                                                <button
                                                    onClick={() => handleAddCredits(1)}
                                                    title="Añadir +1 crédito Infinity"
                                                    disabled={addCreditsMutation.isPending}
                                                    className="text-[10px] font-black text-amber-700 dark:text-amber-300 px-2 py-0.5 bg-white dark:bg-slate-800 rounded hover:bg-amber-100 dark:hover:bg-amber-900/60 transition shadow-xs disabled:opacity-50"
                                                >
                                                    +1
                                                </button>
                                                <button
                                                    onClick={() => handleAddCredits(5)}
                                                    title="Añadir +5 créditos Infinitys"
                                                    disabled={addCreditsMutation.isPending}
                                                    className="text-[10px] font-black text-amber-700 dark:text-amber-300 px-2 py-0.5 bg-white dark:bg-slate-800 rounded hover:bg-amber-100 dark:hover:bg-amber-900/60 transition shadow-xs disabled:opacity-50"
                                                >
                                                    +5
                                                </button>
                                                <button
                                                    onClick={() => handleAddCredits(10)}
                                                    title="Añadir +10 créditos Infinitys"
                                                    disabled={addCreditsMutation.isPending}
                                                    className="text-[10px] font-black text-amber-700 dark:text-amber-300 px-2 py-0.5 bg-white dark:bg-slate-800 rounded hover:bg-amber-100 dark:hover:bg-amber-900/60 transition shadow-xs disabled:opacity-50"
                                                >
                                                    +10
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 p-1 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
                                                <span className="text-[9px] font-extrabold text-rose-700 dark:text-rose-400 px-1">Bajar:</span>
                                                <button
                                                    onClick={() => handleDeductCredits(1)}
                                                    title="Restar -1 crédito Infinity"
                                                    disabled={(activeStudent.creditsBalance || 0) < 1 || deductCreditsMutation.isPending}
                                                    className="text-[10px] font-black text-rose-700 dark:text-rose-300 px-2 py-0.5 bg-white dark:bg-slate-800 rounded hover:bg-rose-100 dark:hover:bg-rose-900/60 transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    -1
                                                </button>
                                                <button
                                                    onClick={() => handleDeductCredits(5)}
                                                    title="Restar -5 créditos Infinitys"
                                                    disabled={(activeStudent.creditsBalance || 0) < 1 || deductCreditsMutation.isPending}
                                                    className="text-[10px] font-black text-rose-700 dark:text-rose-300 px-2 py-0.5 bg-white dark:bg-slate-800 rounded hover:bg-rose-100 dark:hover:bg-rose-900/60 transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    -5
                                                </button>
                                                <button
                                                    onClick={() => handleDeductCredits(10)}
                                                    title="Restar -10 créditos Infinitys"
                                                    disabled={(activeStudent.creditsBalance || 0) < 1 || deductCreditsMutation.isPending}
                                                    className="text-[10px] font-black text-rose-700 dark:text-rose-300 px-2 py-0.5 bg-white dark:bg-slate-800 rounded hover:bg-rose-100 dark:hover:bg-rose-900/60 transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    -10
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Complete accounting tables (Payments vs Expenses) */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
                                
                                {/* Tabs header */}
                                <div className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-3 flex justify-between items-center flex-wrap gap-2">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setActiveTab('payments')}
                                            className={`text-sm font-bold pb-2 border-b-2 transition-all ${
                                                activeTab === 'payments'
                                                    ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                            }`}
                                        >
                                            Historial de Pagos / Ingresos ({activeStudentPayments.length})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('expenses')}
                                            className={`text-sm font-bold pb-2 border-b-2 transition-all ${
                                                activeTab === 'expenses'
                                                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                            }`}
                                        >
                                            Historial de Consumos / Gastos ({activeStudentExpenses.length})
                                        </button>
                                    </div>

                                    {/* Calculated balance totals for selected student */}
                                    <div className="text-right">
                                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Recaudado</span>
                                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                            {activeStudentPayments.reduce((sum, p) => sum + p.amount, 0)}€
                                        </span>
                                    </div>
                                </div>

                                {/* Table content */}
                                <div className="p-6">
                                    {activeTab === 'payments' ? (
                                        <div className="overflow-x-auto">
                                            {activeStudentPayments.length === 0 ? (
                                                <div className="text-center py-12 text-slate-400 text-sm">
                                                    No hay cobros registrados para este estudiante.
                                                </div>
                                            ) : (
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            <th className="pb-3 font-semibold">Fecha</th>
                                                            <th className="pb-3 font-semibold">Factura</th>
                                                            <th className="pb-3 font-semibold">Concepto</th>
                                                            <th className="pb-3 font-semibold">Método</th>
                                                            <th className="pb-3 font-semibold">Estado</th>
                                                            <th className="pb-3 font-semibold text-right">Importe</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                                        {activeStudentPayments.map((pay) => {
                                                            const isPending = pay.status === 'pending' || pay.concept.includes('[Pendiente Bizum]') || pay.concept.includes('[Pendiente]');
                                                            const isRejected = pay.status === 'rejected' || pay.concept.includes('[Rechazado]');
                                                            return (
                                                            <tr key={pay.id} className="text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                                                <td className="py-3 text-slate-400">
                                                                    {new Date(pay.date).toLocaleDateString()}
                                                                </td>
                                                                <td className="py-3 font-mono text-slate-500 text-[10px]">
                                                                    {pay.invoiceNumber || '-'}
                                                                </td>
                                                                <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                                                                    {pay.concept}
                                                                </td>
                                                                <td className="py-3">
                                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px]">
                                                                        {pay.method}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3">
                                                                    {isPending ? (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold rounded-lg text-[10px]">
                                                                                Pendiente Visto Bueno
                                                                            </span>
                                                                            <button
                                                                                onClick={() => approvePaymentMutation.mutate(pay.id)}
                                                                                className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px] hover:bg-emerald-700 cursor-pointer"
                                                                            >
                                                                                Aprobar
                                                                            </button>
                                                                        </div>
                                                                    ) : isRejected ? (
                                                                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold rounded-lg text-[10px]">
                                                                            Rechazado
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold rounded-lg text-[10px]">
                                                                            Aprobado
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                                                                    {pay.amount.toFixed(2)}€
                                                                </td>
                                                            </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            {activeStudentExpenses.length === 0 ? (
                                                <div className="text-center py-12 text-slate-400 text-sm">
                                                    No hay consumos o gastos registrados para este estudiante.
                                                </div>
                                            ) : (
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            <th className="pb-3 font-semibold">Fecha</th>
                                                            <th className="pb-3 font-semibold">Concepto / Actividad</th>
                                                            <th className="pb-3 font-semibold text-right">Costo / Crédito</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                                        {activeStudentExpenses.map((exp) => (
                                                            <tr key={exp.id} className="text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                                                <td className="py-3 text-slate-400">
                                                                    {new Date(exp.date).toLocaleDateString()}
                                                                </td>
                                                                <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                                                                    {exp.concept}
                                                                </td>
                                                                <td className="py-3 text-right font-bold text-slate-700 dark:text-slate-300">
                                                                    {exp.unit === 'credits' ? (
                                                                        <span className="text-amber-500 font-black">
                                                                            🪙 {exp.amount} {exp.amount === 1 ? 'crédito' : 'créditos'}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-rose-500 font-black">
                                                                            {exp.amount.toFixed(2)}€
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-24 text-center text-slate-400">
                            No hay ningún alumno seleccionado. Selecciona uno en el menú lateral.
                        </div>
                    )}
                </div>

            </div>
            ) : viewMode === 'teachers' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Side: Teachers List (col-span-4) */}
                    <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-4">
                        <div className="space-y-1">
                            <h2 className="font-bold text-base text-slate-900 dark:text-white">Profesores</h2>
                            <p className="text-xs text-slate-400">Selecciona un profesor para ver su contabilidad y pagos</p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar profesor..."
                                value={teacherSearchTerm}
                                onChange={(e) => setTeacherSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-slate-800 dark:text-slate-100"
                            />
                        </div>

                        {/* Teachers Scroll List */}
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                            {teachersLoading ? (
                                <div className="text-center py-6 text-xs text-slate-400">Cargando profesores...</div>
                            ) : filteredTeachers.length === 0 ? (
                                <div className="text-center py-6 text-xs text-slate-400">No se encontraron profesores</div>
                            ) : (
                                filteredTeachers.map((teacher) => {
                                    const isSelected = selectedTeacherId === teacher.id;
                                    const teacherTotalEarnings = teacherPayments
                                        .filter(p => p.teacherId === teacher.id)
                                        .reduce((sum, p) => sum + p.amount, 0);
                                    
                                    return (
                                        <button
                                            key={teacher.id}
                                            onClick={() => setSelectedTeacherId(teacher.id)}
                                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900/60'
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-850'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300'
                                                }`}>
                                                    {teacher.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[140px]">
                                                        {teacher.name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium">
                                                        {teacher.category || 'Profesor'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                                                    {teacherTotalEarnings.toFixed(2)}€
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-bold block">Total Pagado</span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Side: Teacher Detail & Payments Sheet */}
                    <div className="lg:col-span-8 space-y-6">
                        {activeTeacher ? (
                            <div className="space-y-6">
                                
                                {/* Teacher Profile Card */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">
                                                {activeTeacher.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                                    {activeTeacher.name}
                                                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full">
                                                        {activeTeacher.category || 'Profesor'}
                                                    </span>
                                                </h3>
                                                <p className="text-xs text-slate-400">{activeTeacher.email} • {activeTeacher.phone || 'Sin Teléfono'}</p>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => {
                                                    // Set defaults for the modal
                                                    setTeacherAssocStudentId(students[0]?.id || '');
                                                    setTeacherClassConcept(`Clase de ${activeTeacher.category || 'Apoyo'}`);
                                                    setTeacherClassPrice('25');
                                                    setTeacherPercentage(80);
                                                    setTeacherPaymentAmount('20');
                                                    setShowTeacherPaymentModal(true);
                                                }}
                                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                                            >
                                                <PlusCircleIcon className="w-3.5 h-3.5" />
                                                Registrar Pago Manual (Sueldo)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats Grid for specific teacher */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-semibold text-slate-400">Total Devengado y Pagado</span>
                                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                                                {activeTeacherPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}€
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Comisiones por tutorías individuales correspondientes a alumnos
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-semibold text-slate-400">Clases Registradas</span>
                                            <div className="text-lg font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                                                📚 {activeTeacherPayments.length} Clases Abonadas
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1.5">
                                                Comisión promedio: {activeTeacherPayments.length > 0 ? (activeTeacherPayments.reduce((sum, p) => sum + p.percentage, 0) / activeTeacherPayments.length).toFixed(0) : '80'}% por clase
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Complete Teacher Payments History Table */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-4 flex justify-between items-center flex-wrap gap-2">
                                        <div>
                                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">📋 Historial de Pagos Recibidos</h4>
                                            <p className="text-[10px] text-slate-400">Todos los recibos y abonos mensuales registrados para este profesor</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Transferido</span>
                                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                                                {activeTeacherPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}€
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            {activeTeacherPayments.length === 0 ? (
                                                <div className="text-center py-12 text-slate-400 text-sm">
                                                    No hay pagos de nómina o comisiones registrados para este profesor.
                                                </div>
                                            ) : (
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            <th className="pb-3 font-semibold">Fecha</th>
                                                            <th className="pb-3 font-semibold">Alumno Asociado</th>
                                                            <th className="pb-3 font-semibold">Concepto Clase</th>
                                                            <th className="pb-3 font-semibold text-right">Precio Clase</th>
                                                            <th className="pb-3 font-semibold text-right">% Pago</th>
                                                            <th className="pb-3 font-semibold text-right">Monto Recibido</th>
                                                            <th className="pb-3 font-semibold text-right">Método</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-xs">
                                                        {activeTeacherPayments.map((pay) => (
                                                            <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                                                <td className="py-3.5 text-slate-400 font-medium">
                                                                    {new Date(pay.date).toLocaleDateString()}
                                                                </td>
                                                                <td className="py-3.5 font-bold text-slate-700 dark:text-slate-200">
                                                                    {pay.studentName || 'S/D Alumno'}
                                                                </td>
                                                                <td className="py-3.5 text-slate-600 dark:text-slate-300">
                                                                    {pay.classConcept}
                                                                </td>
                                                                <td className="py-3.5 text-right font-semibold text-slate-500">
                                                                    {(pay.classPrice || 0).toFixed(2)}€
                                                                </td>
                                                                <td className="py-3.5 text-right font-bold text-slate-600 dark:text-slate-400">
                                                                    {pay.percentage}%
                                                                </td>
                                                                <td className="py-3.5 text-right font-black text-indigo-600 dark:text-indigo-400">
                                                                    {pay.amount.toFixed(2)}€
                                                                </td>
                                                                <td className="py-3.5 text-right">
                                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px]">
                                                                        {pay.method}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-24 text-center text-slate-400">
                                No hay ningún profesor seleccionado. Selecciona uno en el menú lateral.
                            </div>
                        )}
                    </div>

                </div>
            ) : viewMode === 'analytics' ? (
                /* Analytics Dashboard Section */
                <div className="space-y-6">
                    
                    {/* Controls & Metrics Row */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="space-y-1.5 max-w-xl">
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                    ⚙️ Simulación de Costos Operativos (Tutorías)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Los consumos de créditos representan tutorías dictadas por profesores. El costo por hora pagado al docente se calcula estimando un porcentaje de la tarifa de tutoría configurada (tarifa actual: <span className="font-bold text-slate-700 dark:text-slate-300">{appConfig?.tutoringPrice || 12.50}€</span>). ¡Usa el simulador para ver el flujo de caja en tiempo real!
                                </p>
                            </div>
                            
                            {/* Interactive Slider */}
                            <div className="w-full lg:w-80 space-y-2 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 shadow-inner">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                    <span>Compensación Profesor:</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">{teacherPayPercent}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="40"
                                    max="100"
                                    step="5"
                                    value={teacherPayPercent}
                                    onChange={(e) => setTeacherPayPercent(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                                    <span>Bajo Margen (40%)</span>
                                    <span>Tasa Completa (100%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Recaudado</span>
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {monthlyFinanceData.reduce((sum, item) => sum + item.ingresos, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span className="text-emerald-500 font-bold">↑ 100%</span> ingresos directos de alumnos
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gastos Operativos</span>
                            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                {monthlyFinanceData.reduce((sum, item) => sum + item.gastos, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                            </div>
                            <div className="text-[10px] text-slate-400">
                                Incluye materiales y sueldos docentes ({teacherPayPercent}%)
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Flujo de Caja Neto</span>
                            {(() => {
                                const totalIn = monthlyFinanceData.reduce((sum, item) => sum + item.ingresos, 0);
                                const totalOut = monthlyFinanceData.reduce((sum, item) => sum + item.gastos, 0);
                                const net = totalIn - totalOut;
                                return (
                                    <>
                                        <div className={`text-2xl font-black ${net >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                                            {net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            {net >= 0 ? (
                                                <span className="text-emerald-500 font-bold">Flujo positivo (superávit)</span>
                                            ) : (
                                                <span className="text-rose-500 font-bold">Flujo negativo (déficit)</span>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rentabilidad Promedio</span>
                            {(() => {
                                const totalIn = monthlyFinanceData.reduce((sum, item) => sum + item.ingresos, 0);
                                const totalOut = monthlyFinanceData.reduce((sum, item) => sum + item.gastos, 0);
                                const rent = totalIn > 0 ? ((totalIn - totalOut) / totalIn) * 100 : 0;
                                return (
                                    <>
                                        <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
                                            {rent.toFixed(1)}%
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            Margen sobre ingresos acumulados
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Chart Row 1: Line Area (Cash Flow) & Grouped Bar (Revenue vs Expenses) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Monthly Cash Flow AreaChart (lg:col-span-7) */}
                        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">📈 Flujo de Caja Neto Mensual (€)</h4>
                                    <p className="text-[11px] text-slate-400">Evolución temporal del superávit de caja</p>
                                </div>
                                <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 border border-indigo-150/40 rounded-lg">Tendencia</span>
                            </div>

                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height={270}>
                                    <AreaChart data={monthlyFinanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCashFlow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="opacity-40 dark:opacity-10" />
                                        <XAxis dataKey="monthName" tick={{ fontSize: 10, fontWeight: 600 }} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 600 }} tickLine={false} />
                                        <Tooltip 
                                            formatter={(value: any) => [`${value.toFixed(2)}€`, 'Flujo de Caja']}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                backgroundColor: '#1e293b',
                                                color: '#f8fafc',
                                                fontSize: '11px'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="flujoCaja" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCashFlow)" activeDot={{ r: 6 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Revenues vs Operating Expenses BarChart (lg:col-span-5) */}
                        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-4">
                            <div>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">📊 Ingresos vs. Gastos Operativos</h4>
                                <p className="text-[11px] text-slate-400">Comparativa mensual de entradas y salidas de dinero</p>
                            </div>

                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height={270}>
                                    <BarChart data={monthlyFinanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="opacity-40 dark:opacity-10" />
                                        <XAxis dataKey="monthName" tick={{ fontSize: 10, fontWeight: 600 }} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 600 }} tickLine={false} />
                                        <Tooltip 
                                            formatter={(value: any, name: any) => [`${value.toFixed(2)}€`, name === 'ingresos' ? 'Ingresos' : 'Gastos']}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                backgroundColor: '#1e293b',
                                                color: '#f8fafc',
                                                fontSize: '11px'
                                            }}
                                        />
                                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                                        <Bar dataKey="ingresos" name="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="gastos" name="gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Chart Row 2: Donuts (Revenues Breakdown & Expenses Breakdown) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Revenues Pie Chart */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-4">
                            <div>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">🍩 Distribución de Ingresos</h4>
                                <p className="text-[11px] text-slate-400">Origen de los ingresos del centro de tutorías</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="h-52 w-full sm:w-1/2 relative">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={incomeDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {incomeDistribution.map((entry, index) => {
                                                    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
                                                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} strokeWidth={0} />;
                                                })}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => [`${value.toFixed(2)}€`, 'Monto']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                                        <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">Ingresos</span>
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                                            {incomeDistribution.reduce((sum, item) => sum + item.value, 0).toFixed(0)}€
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full sm:w-1/2 space-y-2">
                                    {incomeDistribution.map((item, index) => {
                                        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
                                        const total = incomeDistribution.reduce((sum, i) => sum + i.value, 0);
                                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                                        return (
                                            <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                                                    <span className="text-slate-600 dark:text-slate-350 truncate max-w-[120px]">{item.name}</span>
                                                </div>
                                                <span className="text-slate-950 dark:text-slate-50 font-mono text-[11px] font-bold">
                                                    {item.value.toFixed(0)}€ ({percentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Operating Expenses Pie Chart */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-4">
                            <div>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">🍩 Costos Operativos por Concepto</h4>
                                <p className="text-[11px] text-slate-400">Distribución de los egresos simulados</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="h-52 w-full sm:w-1/2 relative">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={expenseDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {expenseDistribution.map((entry, index) => {
                                                    const colors = ['#f43f5e', '#a855f7', '#6366f1', '#f97316', '#14b8a6'];
                                                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} strokeWidth={0} />;
                                                })}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => [`${value.toFixed(2)}€`, 'Monto']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                                        <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">Costos</span>
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                                            {expenseDistribution.reduce((sum, item) => sum + item.value, 0).toFixed(0)}€
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full sm:w-1/2 space-y-2">
                                    {expenseDistribution.map((item, index) => {
                                        const colors = ['#f43f5e', '#a855f7', '#6366f1', '#f97316', '#14b8a6'];
                                        const total = expenseDistribution.reduce((sum, i) => sum + i.value, 0);
                                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                                        return (
                                            <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                                                    <span className="text-slate-600 dark:text-slate-350 truncate max-w-[130px]">{item.name}</span>
                                                </div>
                                                <span className="text-slate-950 dark:text-slate-50 font-mono text-[11px] font-bold">
                                                    {item.value.toFixed(0)}€ ({percentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table of Monthly Data Ledger */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center">
                            <div>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">📋 Balance y Flujo de Caja Histórico Detallado</h4>
                                <p className="text-[11px] text-slate-400">Desglose de valores contables mensuales agrupados</p>
                            </div>
                            <button
                                onClick={() => addToast('Resumen contable exportado a Excel/CSV con éxito.', 'success')}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors shadow-sm bg-white dark:bg-slate-900"
                            >
                                <DownloadIcon className="w-3.5 h-3.5" />
                                Exportar CSV
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20 dark:bg-slate-950/10">
                                        <th className="px-6 py-3.5 font-semibold">Mes de Ejercicio</th>
                                        <th className="px-6 py-3.5 font-semibold">Ingresos Brutos (€)</th>
                                        <th className="px-6 py-3.5 font-semibold">Costos de Operación (€)</th>
                                        <th className="px-6 py-3.5 font-semibold">Flujo Neto Recibido (€)</th>
                                        <th className="px-6 py-3.5 font-semibold text-right">Rendimiento Operativo (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-xs">
                                    {monthlyFinanceData.map((data) => (
                                        <tr key={data.monthKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                            <td className="px-6 py-3.5 font-extrabold text-slate-900 dark:text-white">
                                                {data.monthName}
                                            </td>
                                            <td className="px-6 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                <span className="text-emerald-500 font-bold">↑</span>
                                                {data.ingresos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                                            </td>
                                            <td className="px-6 py-3.5 font-bold text-rose-500">
                                                <span className="text-rose-400 font-bold">↓</span>
                                                {data.gastos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                                            </td>
                                            <td className={`px-6 py-3.5 font-extrabold ${data.flujoCaja >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                                                {data.flujoCaja >= 0 ? '+' : ''}
                                                {data.flujoCaja.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-mono font-bold">
                                                <span className={`px-2 py-0.5 rounded text-[11px] ${
                                                    data.rentabilidad >= 30 
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                                                        : data.rentabilidad > 0 
                                                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' 
                                                        : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                                                }`}>
                                                    {data.rentabilidad.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            ) : (
                /* Pricing & Subscriptions Section */
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 md:p-8 rounded-2xl shadow-sm space-y-8 animate-fade-in max-w-4xl mx-auto">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>💰 Gestión de Precios y Tarifas</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Ajusta el precio que pagan los alumnos por la suscripción mensual y por las sesiones de tutoría. Los cambios se aplicarán instantáneamente a los formularios de pago e interfaces de los alumnos.
                        </p>
                    </div>

                    <form onSubmit={handleUpdatePrices} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Premium Subscription Card */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 p-5 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                        <CreditCardIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Suscripción Premium Mensual</h3>
                                        <p className="text-[10px] text-slate-400">Acceso a plataforma e IA</p>
                                    </div>
                                </div>
                                <hr className="border-slate-200/60 dark:border-slate-800/60" />
                                <div className="space-y-1.5">
                                    <label htmlFor="subscriptionPriceInput" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Precio Mensual (€)
                                    </label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <input
                                            type="number"
                                            id="subscriptionPriceInput"
                                            step="0.01"
                                            min="0.01"
                                            required
                                            value={newSubscriptionPrice}
                                            onChange={(e) => setNewSubscriptionPrice(e.target.value)}
                                            className="w-full pl-4 pr-10 py-2.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-bold text-slate-800 dark:text-white"
                                            placeholder="Ej. 15.00"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                                            <span className="text-sm font-bold text-slate-400">€ / mes</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Determina el costo que se le cobrará a los alumnos en la pasarela de pago (PayPal, Bizum, etc.) al darse de alta o renovar su estado Premium.
                                </p>
                            </div>

                            {/* Tutoring Price Card */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 p-5 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                        <BookOpenIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Crédito de Tutoría / Hora</h3>
                                        <p className="text-[10px] text-slate-400">Valor unitario por sesión</p>
                                    </div>
                                </div>
                                <hr className="border-slate-200/60 dark:border-slate-800/60" />
                                <div className="space-y-1.5">
                                    <label htmlFor="tutoringPriceInput" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Precio por Tutoría / Crédito (€)
                                    </label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <input
                                            type="number"
                                            id="tutoringPriceInput"
                                            step="0.01"
                                            min="0.01"
                                            required
                                            value={newTutoringPrice}
                                            onChange={(e) => setNewTutoringPrice(e.target.value)}
                                            className="w-full pl-4 pr-10 py-2.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-bold text-slate-800 dark:text-white"
                                            placeholder="Ej. 12.50"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                                            <span className="text-sm font-bold text-slate-400">€ / sesión</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Define el precio individual de cada clase particular (crédito) comprada por los alumnos. También se utiliza en los simuladores financieros para calcular márgenes y compensaciones.
                                </p>
                            </div>

                            {/* Bizum Number Card */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 p-5 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                                        <CreditCardIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Teléfono Bizum (Pasarela)</h3>
                                        <p className="text-[10px] text-slate-400">Recepción de transferencias</p>
                                    </div>
                                </div>
                                <hr className="border-slate-200/60 dark:border-slate-800/60" />
                                <div className="space-y-1.5">
                                    <label htmlFor="bizumNumberInput" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Número de Teléfono Bizum
                                    </label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <input
                                            type="text"
                                            id="bizumNumberInput"
                                            required
                                            value={newBizumNumber}
                                            onChange={(e) => setNewBizumNumber(e.target.value)}
                                            className="w-full pl-4 pr-10 py-2.5 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-bold text-slate-800 dark:text-white font-mono"
                                            placeholder="Ej. 600 000 000"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                                            <span className="text-xs font-bold text-slate-400">📱</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Este número se muestra a los estudiantes en la pasarela de pago para que realicen sus pagos o renovaciones mediante Bizum bancario.
                                </p>
                            </div>

                        </div>

                        {/* Interactive Profit Calculator Info Box */}
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex gap-3">
                            <InfoIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">💡 Nota de Conciliación Financiera</h4>
                                <p className="text-[11px] text-amber-700/90 dark:text-amber-400/80 leading-relaxed">
                                    Al cambiar el precio de la tutoría, recuerda que las compensaciones que abonas a los docentes se estiman basándose en la tasa de compensación configurada en la sección de "Gráficos y Flujo de Caja" (actualmente: <span className="font-bold">{teacherPayPercent}%</span>). Con los precios actuales, cada tutoría deja un margen de beneficio neto del <span className="font-bold">{100 - teacherPayPercent}%</span> para la academia.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button Row */}
                        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={updateConfigMutation.isPending}
                                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {updateConfigMutation.isPending ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Guardando Tarifas...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon className="w-4 h-4" />
                                        <span>Confirmar y Aplicar Tarifas</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal: Registrar Pago (Ingreso) */}
            <AnimatePresence>
                {showPaymentModal && activeStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl text-slate-800 dark:text-slate-100"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    💰 Registrar Pago
                                </h3>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <XIcon className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleAddManualPayment} className="space-y-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Destinatario</span>
                                    <span className="text-sm font-bold">{activeStudent.name}</span>
                                    <span className="text-xs text-slate-400 block">{activeStudent.email}</span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Importe (€)</label>
                                    <input
                                        type="number"
                                        placeholder="Ej. 30"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Concepto</label>
                                    <select
                                        value={paymentConcept}
                                        onChange={(e) => setPaymentConcept(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                    >
                                        <option value="Suscripción Premium Mensual">Suscripción Premium Mensual</option>
                                        <option value="Suscripción Premium Anual">Suscripción Premium Anual</option>
                                        <option value="Adquisición de créditos (Bolsa)">Adquisición de créditos (Bolsa)</option>
                                        <option value="Matrícula del curso">Matrícula del curso</option>
                                        <option value="Manuales / Libros escolares">Manuales / Libros escolares</option>
                                        <option value="Clases de apoyo extra">Clases de apoyo extra</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Método de Pago</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                    >
                                        <option value="Tarjeta">Tarjeta de Crédito</option>
                                        <option value="Transferencia">Transferencia Bancaria</option>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Bizum">Bizum</option>
                                    </select>
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-500 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createPaymentMutation.isPending}
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                    >
                                        {createPaymentMutation.isPending ? 'Guardando...' : 'Confirmar Pago'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Registrar Gasto (Consumo) */}
            <AnimatePresence>
                {showExpenseModal && activeStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl text-slate-800 dark:text-slate-100"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    📉 Registrar Gasto / Consumo
                                </h3>
                                <button
                                    onClick={() => setShowExpenseModal(false)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <XIcon className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleAddManualExpense} className="space-y-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Afectado</span>
                                    <span className="text-sm font-bold">{activeStudent.name}</span>
                                    <span className="text-xs text-slate-400 block">{activeStudent.email}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cantidad</label>
                                        <input
                                            type="number"
                                            placeholder="Ej. 1"
                                            value={expenseAmount}
                                            onChange={(e) => setExpenseAmount(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Unidad</label>
                                        <select
                                            value={expenseUnit}
                                            onChange={(e) => setExpenseUnit(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                        >
                                            <option value="credits">Créditos (Infinitys)</option>
                                            <option value="eur">Euros (€)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Concepto</label>
                                    <select
                                        value={expenseConcept}
                                        onChange={(e) => setExpenseConcept(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                    >
                                        <option value="Reserva de Tutoría Individual">Reserva de Tutoría Individual</option>
                                        <option value="Acceso a Módulo Extra IA (Explicador)">Acceso a Módulo Extra IA (Explicador)</option>
                                        <option value="Descarga de Material Escolar PDF">Descarga de Material Escolar PDF</option>
                                        <option value="Examen de simulación corregido">Examen de simulación corregido</option>
                                        <option value="Compra de material de papelería física">Compra de material de papelería física</option>
                                    </select>
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowExpenseModal(false)}
                                        className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-500 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createExpenseMutation.isPending}
                                        className="flex-1 py-2 bg-slate-800 dark:bg-slate-100 hover:bg-slate-900 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all shadow-sm"
                                    >
                                        {createExpenseMutation.isPending ? 'Guardando...' : 'Confirmar Gasto'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Registrar Pago Profesor */}
            <AnimatePresence>
                {showTeacherPaymentModal && activeTeacher && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl text-slate-800 dark:text-slate-100"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    🎓 Pago a Profesor (Nómina)
                                </h3>
                                <button
                                    onClick={() => setShowTeacherPaymentModal(false)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <XIcon className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleAddTeacherPayment} className="space-y-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Docente</span>
                                    <span className="text-sm font-bold">{activeTeacher.name}</span>
                                    <span className="text-xs text-slate-400 block">{activeTeacher.email} • {activeTeacher.category || 'Apoyo'}</span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Alumno Asociado</label>
                                    <select
                                        value={teacherAssocStudentId}
                                        onChange={(e) => setTeacherAssocStudentId(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                    >
                                        <option value="">-- Selecciona Alumno --</option>
                                        {students.map((student) => (
                                            <option key={student.id} value={student.id}>
                                                {student.name} ({student.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Concepto de la Clase</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Tutoría de Matemáticas Avanzadas"
                                        value={teacherClassConcept}
                                        onChange={(e) => setTeacherClassConcept(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Precio de Clase (€)</label>
                                        <input
                                            type="number"
                                            placeholder="Ej. 25"
                                            value={teacherClassPrice}
                                            onChange={(e) => {
                                                setTeacherClassPrice(e.target.value);
                                                const price = parseFloat(e.target.value);
                                                if (!isNaN(price)) {
                                                    setTeacherPaymentAmount((price * (teacherPercentage / 100)).toFixed(2));
                                                }
                                            }}
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Porcentaje Docente (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            placeholder="Ej. 80"
                                            value={teacherPercentage}
                                            onChange={(e) => {
                                                const pct = parseInt(e.target.value);
                                                setTeacherPercentage(isNaN(pct) ? 0 : pct);
                                                const price = parseFloat(teacherClassPrice);
                                                if (!isNaN(price) && !isNaN(pct)) {
                                                    setTeacherPaymentAmount((price * (pct / 100)).toFixed(2));
                                                }
                                            }}
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-black">Cantidad a Pagar (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej. 20"
                                        value={teacherPaymentAmount}
                                        onChange={(e) => setTeacherPaymentAmount(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-indigo-600 dark:text-indigo-400 font-bold"
                                    />
                                    <span className="text-[10px] text-slate-400 block leading-tight">
                                        Calculado automáticamente del porcentaje del precio de la clase, pero totalmente editable para ajustes manuales.
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Método de Pago</label>
                                        <select
                                            value={teacherPaymentMethod}
                                            onChange={(e) => setTeacherPaymentMethod(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-xs"
                                        >
                                            <option value="Transferencia">Transferencia Bancaria</option>
                                            <option value="Bizum">Bizum</option>
                                            <option value="Tarjeta">Tarjeta de Crédito</option>
                                            <option value="Efectivo">Efectivo</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fecha</label>
                                        <input
                                            type="date"
                                            value={teacherPaymentDate}
                                            onChange={(e) => setTeacherPaymentDate(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowTeacherPaymentModal(false)}
                                        className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-500 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createTeacherPaymentMutation.isPending}
                                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                    >
                                        {createTeacherPaymentMutation.isPending ? 'Guardando...' : 'Confirmar Pago'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Modal: Reiniciar Contabilidad / Poner a Cero */}
                {showResetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200/80 dark:border-rose-900/50 space-y-5"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                                        <AlertTriangleIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            Poner Contabilidad a Cero
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Reiniciar balances, ingresos y gastos
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 bg-rose-50/60 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-150 dark:border-rose-900/30 text-xs">
                                <p className="font-bold text-rose-900 dark:text-rose-300">
                                    Esta acción eliminará todos los registros contables y empezará desde cero:
                                </p>
                                <ul className="space-y-1.5 text-rose-800 dark:text-rose-300/90 list-disc list-inside text-[11px]">
                                    <li>Historial de ingresos y pagos de alumnos ({payments.length} registros)</li>
                                    <li>Historial de gastos y consumos de créditos ({expenses.length} registros)</li>
                                    <li>Historial de pagos a profesores ({teacherPayments.length} registros)</li>
                                    <li>Transacciones y movimientos de Infinitys</li>
                                </ul>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={resetCreditBalances}
                                        onChange={(e) => setResetCreditBalances(e.target.checked)}
                                        className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                                    />
                                    <div className="text-xs">
                                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                            Poner a 0 el saldo de créditos de todos los alumnos
                                        </span>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Si se desmarca, los alumnos conservarán sus créditos actuales y solo se vaciarán los apuntes contables.
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    disabled={resetFinancialsMutation.isPending}
                                    onClick={() => setShowResetModal(false)}
                                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={resetFinancialsMutation.isPending}
                                    onClick={() => resetFinancialsMutation.mutate()}
                                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {resetFinancialsMutation.isPending ? (
                                        <>
                                            <RotateCcwIcon className="w-3.5 h-3.5 animate-spin" />
                                            <span>Reiniciando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcwIcon className="w-3.5 h-3.5" />
                                            <span>Sí, poner a cero</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
