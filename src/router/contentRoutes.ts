export type ContentResourceTab = 'knowledge-points' | 'questions';

export type ContentRouteState =
  | { section: 'resources'; resource: ContentResourceTab }
  | { section: 'packages'; resource: null; packageId: string | null };

export const getContentRouteState = (pathname: string): ContentRouteState => {
  if (pathname === '/platform/content' || pathname === '/platform/content/packages' || pathname.startsWith('/platform/content/packages/')) {
    const segments = pathname.split('/').filter(Boolean);
    const packageIndex = segments.indexOf('packages');
    return { section: 'packages', resource: null, packageId: packageIndex >= 0 ? segments[packageIndex + 1] ?? null : null };
  }

  const resource = pathname.split('/').filter(Boolean).at(-1);
  return {
    section: 'resources',
    resource: resource === 'questions' ? resource : 'knowledge-points',
  };
};

export function getContentRoutePath(section: 'packages', packageId?: string | null): string;
export function getContentRoutePath(section: 'resources', resource: ContentResourceTab): string;
export function getContentRoutePath(section: ContentRouteState['section'], resource?: ContentResourceTab): string {
  return section === 'packages'
    ? `/platform/content/packages${resource ? `/${resource}` : ''}`
    : `/platform/content/resources/${resource ?? 'knowledge-points'}`;
}
