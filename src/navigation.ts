import { getPlatformRoute, platformRoutes, type PlatformRouteId } from './router/platformRoutes';

export type NavTab = PlatformRouteId;

export const navGroups = [
  { items: [getPlatformRoute('dashboard')] },
  { title: '业务模块', items: platformRoutes.slice(1, 7) },
  { title: '系统', items: [getPlatformRoute('system')] },
];
