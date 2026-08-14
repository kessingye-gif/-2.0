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

export const scopeStudents = <T extends { institutionId: string; teacherId: string }>(items: T[], principal: DataScopePrincipal): T[] => {
  if (principal.role === 'super_admin') return items;
  if (!principal.institutionId) return [];
  if (principal.role === 'institution_admin') return items.filter((item) => item.institutionId === principal.institutionId);
  if (!principal.teacherId) return [];
  return items.filter((item) => item.institutionId === principal.institutionId && item.teacherId === principal.teacherId);
};
