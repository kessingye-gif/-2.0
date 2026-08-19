import type { AccessPrincipal } from './accessControl';

type DataScopePrincipal = Pick<AccessPrincipal, 'role' | 'institutionId' | 'teacherId'>;

export const scopeInstitutions = <T extends { id: string }>(items: T[], principal: DataScopePrincipal): T[] => {
  if (principal.role === 'super_admin') return items;
  if (!principal.institutionId) return [];
  return items.filter((item) => item.id === principal.institutionId);
};

export const scopeTeachers = <T extends { id: string; institutionId: string }>(items: T[], principal: DataScopePrincipal): T[] => {
  if (principal.role === 'super_admin') return items;
  if (!principal.institutionId) return [];
  if (principal.role === 'institution_admin') return items.filter((item) => item.institutionId === principal.institutionId);
  if (!principal.teacherId) return [];
  return items.filter((item) => item.institutionId === principal.institutionId && item.id === principal.teacherId);
};

export const scopeStudents = <T extends { institutionId: string; teacherId: string; teacherAssignments?: Array<{ teacherId: string }> }>(items: T[], principal: DataScopePrincipal): T[] => {
  if (principal.role === 'super_admin') return items;
  if (!principal.institutionId) return [];
  if (principal.role === 'institution_admin') return items.filter((item) => item.institutionId === principal.institutionId);
  if (!principal.teacherId) return [];
  return items.filter((item) => item.institutionId === principal.institutionId && (item.teacherId === principal.teacherId || item.teacherAssignments?.some((assignment) => assignment.teacherId === principal.teacherId)));
};

/** 主负责教师拥有全学科视角；任课教师只拥有明确分配给自己的学科。 */
export const getTeacherStudentSubjectScope = (
  student: { teacherId: string; subjects: string[]; teacherAssignments?: Array<{ teacherId: string; subject: string }> },
  teacherId?: string,
): 'all' | string[] | null => {
  if (!teacherId) return null;
  if (student.teacherId === teacherId) return 'all';
  const assignedSubjects = [...new Set((student.teacherAssignments ?? [])
    .filter((assignment) => assignment.teacherId === teacherId && student.subjects.includes(assignment.subject))
    .map((assignment) => assignment.subject))];
  return assignedSubjects.length ? assignedSubjects : null;
};
