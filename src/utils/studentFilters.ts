import type { StudentItem } from '../types';

export interface StudentFilters {
  searchTerm?: string;
  institution?: string;
  teacher?: string;
  className?: string;
  grade?: string;
  serviceStatus?: string;
}

const unique = (values: string[]) => [...new Set(values)];
const hasTeacher = (student: StudentItem, teacherName: string) => student.teacherName === teacherName || student.teacherAssignments?.some((assignment) => assignment.teacherName === teacherName);

export function getStudentFilterOptions(students: StudentItem[], filters: StudentFilters) {
  const institutionStudents = filters.institution ? students.filter((item) => item.institutionName === filters.institution) : students;
  const teacherStudents = filters.teacher ? institutionStudents.filter((item) => hasTeacher(item, filters.teacher!)) : institutionStudents;
  const classStudents = filters.className ? teacherStudents.filter((item) => item.className === filters.className) : teacherStudents;
  return {
    institutions: unique(students.map((item) => item.institutionName)),
    teachers: unique(institutionStudents.flatMap((item) => [item.teacherName, ...(item.teacherAssignments?.map((assignment) => assignment.teacherName) ?? [])]).filter(Boolean)),
    classes: unique(teacherStudents.map((item) => item.className).filter((value): value is string => Boolean(value))),
    grades: unique(classStudents.map((item) => item.grade)),
  };
}

export function filterStudents(students: StudentItem[], filters: StudentFilters) {
  const term = filters.searchTerm?.trim().toLowerCase() || '';
  return students.filter((item) => (
    (!term || [item.name, item.account, item.phone ?? '', item.teacherName, item.institutionName, ...(item.teacherAssignments?.map((assignment) => `${assignment.teacherName} ${assignment.subject}`) ?? [])].some((value) => value.toLowerCase().includes(term))) &&
    (!filters.institution || item.institutionName === filters.institution) &&
    (!filters.teacher || hasTeacher(item, filters.teacher)) &&
    (!filters.className || item.className === filters.className) &&
    (!filters.grade || item.grade === filters.grade) &&
    (!filters.serviceStatus || item.serviceStatus === filters.serviceStatus)
  ));
}
