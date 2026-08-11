import { getPlatformRoute, platformRoutes, type PlatformRouteId } from './router/platformRoutes';

export type NavTab = PlatformRouteId;

export const navGroups = [
  { items: platformRoutes.slice(0, 4) },
  { title: '内容', items: [getPlatformRoute('content')] },
  { title: '系统', items: [getPlatformRoute('audit'), getPlatformRoute('settings')] },
];
