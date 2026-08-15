import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import { AppProviders } from './AppProviders';
import { ErrorBoundary } from './components/ErrorBoundary';

// --- CORE LAYOUT & STATIC ENTRY COMPONENTS ---
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { AppLayout } from './components/AppLayout';
import { StudentDashboard } from './components/Dashboard';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';

// --- LAZY LOADED SECONDARY & HEAVY ROUTES (Code Splitting for Optimal Performance) ---
const CoursePage = React.lazy(() => import('./components/CoursePage').then(m => ({ default: m.CoursePage })));
const VideoPage = React.lazy(() => import('./components/VideoPage').then(m => ({ default: m.VideoPage })));
const TutorIAPage = React.lazy(() => import('./components/TutorIAPage').then(m => ({ default: m.TutorIAPage })));
const TutoringPage = React.lazy(() => import('./components/TutoringPage').then(m => ({ default: m.TutoringPage })));
const RequestPage = React.lazy(() => import('./components/RequestPage').then(m => ({ default: m.RequestPage })));
const PaymentPage = React.lazy(() => import('./components/PaymentPage').then(m => ({ default: m.PaymentPage })));
const AccountPage = React.lazy(() => import('./components/AccountPage').then(m => ({ default: m.AccountPage })));
const BachilleratoPage = React.lazy(() => import('./components/BachilleratoPage').then(m => ({ default: m.BachilleratoPage })));
const AgendaPage = React.lazy(() => import('./components/AgendaPage').then(m => ({ default: m.AgendaPage })));
const StudentProgressPage = React.lazy(() => import('./components/StudentProgressPage').then(m => ({ default: m.StudentProgressPage })));
const ChatPage = React.lazy(() => import('./components/ChatPage').then(m => ({ default: m.ChatPage })));
const StudentChatPage = React.lazy(() => import('./components/StudentChatPage').then(m => ({ default: m.StudentChatPage })));
const StudyGroupsPage = React.lazy(() => import('./components/StudyGroupsPage').then(m => ({ default: m.StudyGroupsPage })));
const TeacherStudentsPage = React.lazy(() => import('./components/TeacherStudentsPage').then(m => ({ default: m.TeacherStudentsPage })));

// Admin Lazy Pages
const AdminDashboardPage = React.lazy(() => import('./components/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = React.lazy(() => import('./components/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminContentPage = React.lazy(() => import('./components/admin/AdminContentPage').then(m => ({ default: m.AdminContentPage })));
const AdminProgressPage = React.lazy(() => import('./components/admin/AdminProgressPage').then(m => ({ default: m.AdminProgressPage })));
const AdminRequestsPage = React.lazy(() => import('./components/admin/AdminRequestsPage').then(m => ({ default: m.AdminRequestsPage })));
const AdminTutoringRequestsPage = React.lazy(() => import('./components/admin/AdminTutoringRequestsPage').then(m => ({ default: m.AdminTutoringRequestsPage })));
const AdminCommentsPage = React.lazy(() => import('./components/admin/AdminCommentsPage').then(m => ({ default: m.AdminCommentsPage })));
const AdminSettingsPage = React.lazy(() => import('./components/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));
const AdminConnectionPage = React.lazy(() => import('./components/admin/AdminConnectionPage').then(m => ({ default: m.AdminConnectionPage })));
const AdminChatPage = React.lazy(() => import('./components/admin/AdminChatPage').then(m => ({ default: m.AdminChatPage })));
const AdminSubscriptionManagementPage = React.lazy(() => import('./components/admin/AdminSubscriptionManagementPage').then(m => ({ default: m.AdminSubscriptionManagementPage })));

// Lightweight Fast Loading Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4">
    <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando módulo...</span>
  </div>
);

const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <AppProviders>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path={ROUTES.LANDING} element={<LandingPage />} />
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />

              {/* Student Routes */}
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                <Route path={ROUTES.DASHBOARD.replace('/app/', '')} element={<StudentDashboard />} />
                <Route path={ROUTES.COURSE_LEVEL.replace('/app/', '')} element={<CoursePage />} />
                <Route path={ROUTES.BACHILLERATO_YEAR.replace('/app/', '')} element={<BachilleratoPage />} />
                <Route path={ROUTES.VIDEO.replace('/app/', '')} element={<VideoPage />} />
                <Route path={ROUTES.TUTOR_IA.replace('/app/', '')} element={<TutorIAPage />} />
                <Route path={ROUTES.TUTORING.replace('/app/', '')} element={<TutoringPage />} />
                <Route path={ROUTES.REQUEST.replace('/app/', '')} element={<RequestPage />} />
                <Route path={ROUTES.PAYMENT.replace('/app/', '')} element={<PaymentPage />} />
                <Route path={ROUTES.ACCOUNT.replace('/app/', '')} element={<AccountPage />} />
                <Route path={ROUTES.AGENDA.replace('/app/', '')} element={<AgendaPage />} />
                <Route path={ROUTES.PROGRESS.replace('/app/', '')} element={<StudentProgressPage />} />
                <Route path={ROUTES.CHAT.replace('/app/', '')} element={<ChatPage />} />
                <Route path={ROUTES.STUDENT_CHAT.replace('/app/', '')} element={<StudentChatPage />} />
                <Route path={ROUTES.STUDY_GROUPS.replace('/app/', '')} element={<StudyGroupsPage />} />
                <Route path={ROUTES.TEACHER_STUDENTS.replace('/app/', '')} element={<TeacherStudentsPage />} />
                <Route path={ROUTES.TEACHER_CONTENT.replace('/app/', '')} element={<AdminContentPage />} />
              </Route>

              {/* Admin Routes with Firestore Role Protection */}
              <Route path={ROUTES.ADMIN_ROOT} element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
                <Route path={ROUTES.ADMIN_DASHBOARD.replace('/admin/', '')} element={<AdminDashboardPage />} />
                <Route path={ROUTES.ADMIN_USERS.replace('/admin/', '')} element={<AdminUsersPage />} />
                <Route path={ROUTES.ADMIN_CONTENT.replace('/admin/', '')} element={<AdminContentPage />} />
                <Route path={ROUTES.ADMIN_PROGRESS.replace('/admin/', '')} element={<AdminProgressPage />} />
                <Route path={ROUTES.ADMIN_REQUESTS.replace('/admin/', '')} element={<AdminRequestsPage />} />
                <Route path={ROUTES.ADMIN_TUTORING.replace('/admin/', '')} element={<AdminTutoringRequestsPage />} />
                <Route path={ROUTES.ADMIN_COMMENTS.replace('/admin/', '')} element={<AdminCommentsPage />} />
                <Route path={ROUTES.ADMIN_SETTINGS.replace('/admin/', '')} element={<AdminSettingsPage />} />
                <Route path={ROUTES.ADMIN_CONNECTION.replace('/admin/', '')} element={<AdminConnectionPage />} />
                <Route path={ROUTES.ADMIN_CHAT.replace('/admin/', '')} element={<AdminChatPage />} />
                <Route path={ROUTES.ADMIN_TEACHER_APPROVAL.replace('/admin/', '')} element={<Navigate to={`${ROUTES.ADMIN_USERS}?view=teachers`} replace />} />
                <Route path={ROUTES.ADMIN_SUBSCRIPTION.replace('/admin/', '')} element={<AdminSubscriptionManagementPage />} />
                <Route path={ROUTES.ADMIN_AGENDA.replace('/admin/', '')} element={<AgendaPage />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppProviders>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
