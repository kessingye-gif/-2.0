import type { ContentPackageItem, CooperationPlan, ServicePackage } from '../types';

interface CooperationCatalogs {
  contentPackages: ContentPackageItem[];
  servicePackages: ServicePackage[];
}

export function validateCooperationPlan(plan: CooperationPlan, catalogs: CooperationCatalogs): string | null {
  if (plan.status === 'draft') return null;
  if (plan.contentPackageIds.length === 0) return '至少选择一个内容包';
  if (plan.servicePackageIds.length === 0) return '至少选择一个服务包';

  for (const id of plan.contentPackageIds) {
    const item = catalogs.contentPackages.find((candidate) => candidate.id === id);
    if (!item) return `内容包 ${id} 不存在`;
    if (item.status !== 'active') return `内容包“${item.name}”已停用`;
  }
  for (const id of plan.servicePackageIds) {
    const item = catalogs.servicePackages.find((candidate) => candidate.id === id);
    if (!item) return `服务包 ${id} 不存在`;
    if (item.status !== 'active') return `服务包“${item.name}”已停用`;
  }
  return null;
}
