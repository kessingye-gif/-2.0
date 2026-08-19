import { getPlatformRoute, platformRoutes, type PlatformRouteId } from './router/platformRoutes';
import type { Role } from './permissions/accessControl';

export type NavTab = PlatformRouteId;

export const navGroups = [
  { items: [getPlatformRoute('dashboard')] },
  { title: '核心运营', items: [getPlatformRoute('goods'), getPlatformRoute('content'), getPlatformRoute('institutions'), getPlatformRoute('teachers'), getPlatformRoute('students')] },
  { title: '支撑设置', items: [getPlatformRoute('system')] },
];

const roleRoutes: Record<Role, PlatformRouteId[]> = {
  super_admin: platformRoutes.map((route) => route.id),
  institution_admin: ['dashboard', 'learning', 'teachers', 'students', 'content'],
  teacher: ['learning', 'students', 'content'],
};

export const getNavGroupsForRole = (role: Role) => {
  if (role === 'super_admin') return navGroups;
  const dailyRoutes = (role === 'institution_admin' ? ['teachers', 'students', 'content'] : ['students', 'content']) as PlatformRouteId[];
  const overviewRoutes = role === 'institution_admin'
    ? [{ ...getPlatformRoute('dashboard'), label: '机构工作台' }, getPlatformRoute('learning')]
    : [getPlatformRoute('learning')];
  return [
    { items: overviewRoutes },
    { title: '工作台', items: dailyRoutes.map(getPlatformRoute) },
  ];
};

export const canAccessRoute = (role: Role, routeId: PlatformRouteId) => roleRoutes[role].includes(routeId);

export const getDefaultRouteForRole = (role: Role) => getPlatformRoute(roleRoutes[role][0]).path;
