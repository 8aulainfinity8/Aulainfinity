import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import { AppProviders } from './AppProviders';
import { ErrorBoundary } from './components/ErrorBoundary';

// --- STATIC COMPONENTS ---

// General Components
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';

// Student Layout & Components
import { AppLayout } from './components/AppLayout';
import { StudentDashboard } from './components/Dashboard';
import { CoursePage } from './components/CoursePage';
import { VideoPage } from './components/VideoPage';
import { TutorIAPage } from './components/TutorIAPage';
import { TutoringPage } from './components/TutoringPage';
import { RequestPage } from './components/RequestPage';
import { PaymentPage } from './components/PaymentPage';
import { AccountPage } from './components/AccountPage';
import { BachilleratoPage } from './components/BachilleratoPage';
import { AgendaPage } from './components/AgendaPage';
import { StudentProgressPage } from './components/StudentProgressPage';
import { ChatPage } from './components/ChatPage';
import { StudentChatPage } from './components/StudentChatPage';
import { StudyGroupsPage } from './components/StudyGroupsPage';
import { TeacherStudentsPage } from './components/TeacherStudentsPage';

import { AdminProtectedRoute } from './components/AdminProtectedRoute';

// Admin Layout & Components
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './components/admin/AdminDashboardPage';
import { AdminUsersPage } from './components/admin/AdminUsersPage';
import { AdminContentPage } from './components/admin/AdminContentPage';
import { AdminProgressPage } from './components/admin/AdminProgressPage';
import { AdminRequestsPage } from './components/admin/AdminRequestsPage';
import { AdminTutoringRequestsPage } from './components/admin/AdminTutoringRequestsPage';
import { AdminCommentsPage } from './components/admin/AdminCommentsPage';
import { AdminSettingsPage } from './components/admin/AdminSettingsPage';
import { AdminConnectionPage } from './components/admin/AdminConnectionPage';
import { AdminChatPage } from './components/admin/AdminChatPage';
import { AdminSubscriptionManagementPage } from './components/admin/AdminSubscriptionManagementPage';


const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <AppProviders>
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
        </AppProviders>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
