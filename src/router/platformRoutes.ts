export type PlatformRouteId = 'dashboard' | 'institutions' | 'activations' | 'afterSales' | 'content' | 'audit' | 'settings';

export interface PlatformRoute {
  id: PlatformRouteId;
  path: string;
  label: string;
  icon: string;
}

export const platformRoutes: PlatformRoute[] = [
  { id: 'dashboard', path: '/platform/dashboard', label: '经营驾驶舱', icon: 'space_dashboard' },
  { id: 'institutions', path: '/platform/institutions', label: '机构与额度', icon: 'domain' },
  { id: 'activations', path: '/platform/activations', label: '开通与使用', icon: 'verified_user' },
  { id: 'afterSales', path: '/platform/after-sales', label: '售后与异常', icon: 'support_agent' },
  { id: 'content', path: '/platform/content', label: '内容中心', icon: 'library_books' },
  { id: 'audit', path: '/platform/audit', label: '数据与审计', icon: 'history' },
  { id: 'settings', path: '/platform/settings', label: '平台设置', icon: 'settings' },
];

export const getPlatformRoute = (id: PlatformRouteId) => platformRoutes.find((route) => route.id === id)!;
export const getPlatformRouteId = (pathname: string): PlatformRouteId =>
  platformRoutes.find((route) => pathname === route.path || pathname.startsWith(`${route.path}/`))?.id ?? 'dashboard';
