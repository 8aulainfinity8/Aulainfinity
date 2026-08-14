// This file defines constants for all application routes, making them easy to manage.

export const ROUTES = {
  LANDING: '/',
  LOGIN: '/login',
  
  // Student
  DASHBOARD: '/app/dashboard',
  COURSE_LEVEL: '/app/course/:level',
  BACHILLERATO_YEAR: '/app/bach/:year',
  VIDEO: '/app/video/:videoId',
  TUTOR_IA: '/app/tutor-ia',
  TUTORING: '/app/tutoring',
  REQUEST: '/app/request',
  PAYMENT: '/app/payment',
  ACCOUNT: '/app/account',
  AGENDA: '/app/agenda',
  PROGRESS: '/app/progress',
  CHAT: '/app/chat',
  STUDENT_CHAT: '/app/student-chat',
  STUDY_GROUPS: '/app/study-groups',
  TEACHER_STUDENTS: '/app/teacher-students',
  TEACHER_CONTENT: '/app/content',

  // Admin
  ADMIN_ROOT: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_CONTENT: '/admin/content',
  ADMIN_PROGRESS: '/admin/progress',
  ADMIN_REQUESTS: '/admin/requests',
  ADMIN_TUTORING: '/admin/tutoring',
  ADMIN_COMMENTS: '/admin/comments',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_CONNECTION: '/admin/connection',
  ADMIN_CHAT: '/admin/chat',
  ADMIN_TEACHER_APPROVAL: '/admin/teacher-approval',
  ADMIN_SUBSCRIPTION: '/admin/subscription',
  ADMIN_AGENDA: '/admin/agenda',
};

// Helper functions to generate dynamic routes
export const generateCourseLevelPath = (levelId: string) => `/app/course/${levelId}`;
export const generateBachilleratoPath = (year: number | string) => `/app/bach/${year}`;
export const generateVideoPath = (videoId: string) => `/app/video/${videoId}`;