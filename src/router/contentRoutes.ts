export type ContentResourceTab = 'subjects' | 'knowledge-points' | 'questions';

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
    resource: resource === 'knowledge-points' || resource === 'questions' ? resource : 'subjects',
  };
};

export function getContentRoutePath(section: 'packages'): string;
export function getContentRoutePath(section: 'resources', resource: ContentResourceTab): string;
export function getContentRoutePath(section: ContentRouteState['section'], resource?: ContentResourceTab): string {
  return section === 'packages'
    ? '/platform/content/packages'
    : `/platform/content/resources/${resource ?? 'subjects'}`;
}
