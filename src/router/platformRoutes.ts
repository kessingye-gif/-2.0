export type PlatformRouteId =
  | 'dashboard'
  | 'goods'
  | 'content'
  | 'institutions'
  | 'teachers'
  | 'classes'
  | 'students'
  | 'system';

export interface PlatformRoute {
  id: PlatformRouteId;
  path: string;
  label: string;
  icon: string;
}

export const platformRoutes: PlatformRoute[] = [
  { id: 'dashboard', path: '/platform/dashboard', label: '经营驾驶舱', icon: 'space_dashboard' },
  { id: 'goods', path: '/platform/goods', label: '商品与权益', icon: 'inventory_2' },
  { id: 'content', path: '/platform/content', label: '内容管理', icon: 'library_books' },
  { id: 'institutions', path: '/platform/institutions', label: '机构管理', icon: 'domain' },
  { id: 'teachers', path: '/platform/teachers', label: '教师管理', icon: 'school' },
  { id: 'classes', path: '/platform/classes', label: '班级管理', icon: 'groups' },
  { id: 'students', path: '/platform/students', label: '学生管理', icon: 'person_search' },
  { id: 'system', path: '/platform/system', label: '系统管理', icon: 'settings' },
];

export const getPlatformRoute = (id: PlatformRouteId) => platformRoutes.find((route) => route.id === id)!;
export const getPlatformRouteId = (pathname: string): PlatformRouteId =>
  platformRoutes.find((route) => pathname === route.path || pathname.startsWith(`${route.path}/`))?.id ?? 'dashboard';
