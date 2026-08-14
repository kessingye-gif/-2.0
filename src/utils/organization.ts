import type { OrganizationNode } from '../types';

export const getOrganizationChildren = <T extends OrganizationNode>(nodes: readonly T[], institutionId: string, parentId?: string) =>
  nodes.filter((node) => node.institutionId === institutionId && node.parentId === parentId);
