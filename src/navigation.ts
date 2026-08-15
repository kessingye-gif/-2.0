import { getPlatformRoute, platformRoutes, type PlatformRouteId } from './router/platformRoutes';
import type { Role } from './permissions/accessControl';

export type NavTab = PlatformRouteId;

export const navGroups = [
  { items: [getPlatformRoute('dashboard')] },
  { title: '业务模块', items: platformRoutes.slice(1, 7) },
  { title: '系统', items: [getPlatformRoute('system')] },
];

const roleRoutes: Record<Role, PlatformRouteId[]> = {
  super_admin: platformRoutes.map((route) => route.id),
  institution_admin: ['dashboard', 'content', 'teachers', 'classes', 'students'],
  teacher: ['dashboard', 'content', 'classes', 'students'],
};

export const getNavGroupsForRole = (role: Role) => navGroups
  .map((group) => ({ ...group, items: group.items.filter((item) => roleRoutes[role].includes(item.id)) }))
  .filter((group) => group.items.length > 0);

export const canAccessRoute = (role: Role, routeId: PlatformRouteId) => roleRoutes[role].includes(routeId);

export const getDefaultRouteForRole = (role: Role) => getPlatformRoute(roleRoutes[role][0]).path;
