export type ContentResourceTab = 'knowledge-points' | 'questions';

export type ContentRouteState =
  | { section: 'resources'; resource: ContentResourceTab }
  | { section: 'packages'; resource: null };

export const getContentRouteState = (pathname: string): ContentRouteState => {
  if (pathname === '/platform/content/packages' || pathname.startsWith('/platform/content/packages/')) {
    return { section: 'packages', resource: null };
  }

  const resource = pathname.split('/').filter(Boolean).at(-1);
  return {
    section: 'resources',
    resource: resource === 'questions' ? resource : 'knowledge-points',
  };
};

export function getContentRoutePath(section: 'packages'): string;
export function getContentRoutePath(section: 'resources', resource: ContentResourceTab): string;
export function getContentRoutePath(section: ContentRouteState['section'], resource?: ContentResourceTab): string {
  return section === 'packages'
    ? '/platform/content/packages'
    : `/platform/content/resources/${resource ?? 'knowledge-points'}`;
}
