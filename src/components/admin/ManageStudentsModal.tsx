
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../services/api';
import type { StudentUser } from '../../types';
import { Spinner } from '../ui/Spinner';

interface ManageStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
}

export const ManageStudentsModal: React.FC<ManageStudentsModalProps> = ({ isOpen, onClose, courseId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: allStudents, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: api.fetchUsers,
  });

  const filteredStudents = React.useMemo(() => {
    if (!allStudents) return [];
    const queryLower = debouncedQuery.toLowerCase();
    return allStudents.filter(student => 
      student.name.toLowerCase().includes(queryLower) || 
      student.email.toLowerCase().includes(queryLower) ||
      (student.phone && student.phone.includes(debouncedQuery))
    );
  }, [allStudents, debouncedQuery]);

  const updateStudentCourseMutation = useMutation({
    mutationFn: ({ studentId, courseIds }: { studentId: string; courseIds: string[] }) => api.updateStudentCourse(studentId, courseIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  if (!isOpen) return null;

  const handleToggleStudent = (student: StudentUser) => {
    const isEnrolled = student.enrolledCourseIds.includes(courseId);
    const newCourseIds = isEnrolled
      ? student.enrolledCourseIds.filter(id => id !== courseId)
      : [...student.enrolledCourseIds, courseId];
    
    updateStudentCourseMutation.mutate({ studentId: student.id, courseIds: newCourseIds });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Administrar alumnos del grupo</h3>
        
        {isStudentsLoading ? (
          <div className="flex justify-center p-4"><Spinner /></div>
        ) : (
          <>
            <input 
              type="text" 
              placeholder="Buscar por nombre, email o teléfono..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 mb-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100"
            />
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredStudents?.map(student => {
                const isMutatingThisStudent = updateStudentCourseMutation.isPending && updateStudentCourseMutation.variables?.studentId === student.id;
                return (
                  <div key={student.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{student.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{student.email}</span>
                    </div>
                    <button
                      onClick={() => handleToggleStudent(student)}
                      disabled={updateStudentCourseMutation.isPending}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition disabled:opacity-50 ${
                        student.enrolledCourseIds.includes(courseId)
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      }`}
                    >
                      {isMutatingThisStudent ? 'Guardando...' : (student.enrolledCourseIds.includes(courseId) ? 'Eliminar' : 'Añadir')}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
        
        <button
          onClick={onClose}
          className="mt-6 w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold text-sm"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
