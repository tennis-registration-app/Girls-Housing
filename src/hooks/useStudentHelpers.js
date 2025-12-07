import { useCallback, useMemo } from 'react';

export function useStudentHelpers(students) {
  const getStudentName = useCallback((id) => {
    const student = students.find(s => s.id === id);
    if (!student) return 'Unknown';
    const fullName = `${student.firstName} ${student.lastName}`.trim();
    return fullName || `Student ${id}`;
  }, [students]);

  const hasMutualPreference = useCallback((studentId1, studentId2) => {
    const student1 = students.find(s => s.id === studentId1);
    const student2 = students.find(s => s.id === studentId2);
    return student1?.preferences.includes(studentId2) && student2?.preferences.includes(studentId1);
  }, [students]);

  const getStudentById = useCallback((id) => {
    return students.find(s => s.id === id);
  }, [students]);

  const getMutualCount = useCallback((studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return 0;
    return student.preferences.filter(prefId => hasMutualPreference(studentId, prefId)).length;
  }, [students, hasMutualPreference]);

  // Memoized student stats
  const studentStats = useMemo(() => {
    return {
      total: students.length,
      withPreferences: students.filter(s => s.preferences.length > 0).length,
      withAvoids: students.filter(s => s.avoids.length > 0).length,
      totalPreferences: students.reduce((sum, s) => sum + s.preferences.length, 0),
      totalAvoids: students.reduce((sum, s) => sum + s.avoids.length, 0)
    };
  }, [students]);

  return {
    getStudentName,
    hasMutualPreference,
    getStudentById,
    getMutualCount,
    studentStats
  };
}
