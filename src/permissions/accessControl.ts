export type Role = 'super_admin' | 'institution_admin' | 'teacher';
export type Capability =
  | 'institution.manage'
  | 'institution.allocateQuota'
  | 'teacher.import'
  | 'teacher.manage'
  | 'teacher.allocateQuota'
  | 'class.manage'
  | 'student.manage'
  | 'learning.view'
  | 'institutionContent.manage'
  | 'platformContent.manage';

export interface AccessPrincipal {
  id: string;
  role: Role;
  institutionId?: string;
  teacherId?: string;
}

export interface AccessScope {
  institutionId?: string;
  teacherId?: string;
}

const institutionCapabilities = new Set<Capability>([
  'teacher.import', 'teacher.manage', 'teacher.allocateQuota', 'class.manage',
  'student.manage', 'learning.view', 'institutionContent.manage',
]);
const teacherCapabilities = new Set<Capability>(['learning.view', 'institutionContent.manage']);

export const can = (principal: AccessPrincipal, capability: Capability, scope: AccessScope): boolean => {
  if (!scope.institutionId) return false;
  if (principal.role === 'super_admin') return true;
  if (principal.institutionId !== scope.institutionId) return false;
  if (principal.role === 'institution_admin') return institutionCapabilities.has(capability);
  if (!teacherCapabilities.has(capability)) return false;
  if (capability === 'institutionContent.manage') return true;
  return Boolean(scope.teacherId && scope.teacherId === principal.teacherId);
};
