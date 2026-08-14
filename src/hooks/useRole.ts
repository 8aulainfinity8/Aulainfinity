import { useContext, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { AnyUser, StudentUser, TeacherUser, AdminUser } from '../types';

export interface UseRoleReturn {
  user: AnyUser | null;
  role: 'student' | 'teacher' | 'admin' | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isApprovedTeacher: boolean;
  hasAdminAccess: boolean;
  hasTeacherAccess: boolean;
  studentUser: StudentUser | null;
  teacherUser: TeacherUser | null;
  adminUser: AdminUser | null;
}

/**
 * Custom hook to manage user roles and authorization.
 * Centralizes RBAC (Role-Based Access Control) logic throughout AulaInfinity.
 */
export const useRole = (): UseRoleReturn => {
  const { user } = useContext(AuthContext);

  const role = useMemo(() => {
    return user?.role || null;
  }, [user]);

  const isAdmin = useMemo(() => {
    return role === 'admin';
  }, [role]);

  const isTeacher = useMemo(() => {
    return role === 'teacher';
  }, [role]);

  const isStudent = useMemo(() => {
    return role === 'student';
  }, [role]);

  const isApprovedTeacher = useMemo(() => {
    if (isAdmin) return true;
    if (isTeacher && user) {
      return (user as TeacherUser).isApprovedForTutoring === true;
    }
    return false;
  }, [isAdmin, isTeacher, user]);

  const hasAdminAccess = useMemo(() => {
    return isAdmin;
  }, [isAdmin]);

  const hasTeacherAccess = useMemo(() => {
    return isTeacher || isAdmin;
  }, [isTeacher, isAdmin]);

  const studentUser = useMemo(() => {
    return isStudent ? (user as StudentUser) : null;
  }, [isStudent, user]);

  const teacherUser = useMemo(() => {
    return isTeacher ? (user as TeacherUser) : null;
  }, [isTeacher, user]);

  const adminUser = useMemo(() => {
    return isAdmin ? (user as AdminUser) : null;
  }, [isAdmin, user]);

  return {
    user,
    role,
    isAdmin,
    isTeacher,
    isStudent,
    isApprovedTeacher,
    hasAdminAccess,
    hasTeacherAccess,
    studentUser,
    teacherUser,
    adminUser,
  };
};
