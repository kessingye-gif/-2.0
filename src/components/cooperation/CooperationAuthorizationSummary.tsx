import React from 'react';
import type { ContentPackageItem, CooperationPlan, ServicePackage } from '../../types';

interface Props {
  plan?: CooperationPlan;
  contentPackages: ContentPackageItem[];
  servicePackages: ServicePackage[];
  contentPackageIds?: string[];
  servicePackageIds?: string[];
  overrideNote?: string;
  compact?: boolean;
}

export const CooperationAuthorizationSummary: React.FC<Props> = ({ plan, contentPackages, servicePackages, contentPackageIds, servicePackageIds, overrideNote, compact = false }) => {
  const selectedContent = contentPackages.filter((item) => (contentPackageIds || plan?.contentPackageIds || []).includes(item.id));
  const selectedServices = servicePackages.filter((item) => (servicePackageIds || plan?.servicePackageIds || []).includes(item.id));
  return <div className={`rounded-2xl border border-[#E2E8F0] bg-white ${compact ? 'p-3' : 'p-4'}`}>
    {plan && <div className="mb-3 flex items-center justify-between gap-3"><div><div className="text-[11px] text-[#64748B]">来源方案</div><div className="font-bold text-[#0F172A]">{plan.name} <span className="font-mono text-[11px] text-[#94A3B8]">V{plan.version}</span></div></div><span className="rounded-full bg-[#E8F7EE] px-2 py-1 text-[10px] font-bold text-[#0E7D3E]">明确授权</span></div>}
    <div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-[#F8FAFC] p-3"><div className="flex justify-between text-[12px]"><strong>教学内容</strong><span className="text-[#64748B]">{selectedContent.length} 个内容包</span></div><div className="mt-2 flex flex-wrap gap-1">{selectedContent.map(item=><span key={item.id} className="rounded-md border bg-white px-2 py-1 text-[10.5px] text-[#475569]">{item.name}</span>)}</div></div><div className="rounded-xl bg-[#F8FAFC] p-3"><div className="flex justify-between text-[12px]"><strong>服务权益</strong><span className="text-[#64748B]">{selectedServices.length} 个服务包</span></div><div className="mt-2 space-y-1">{selectedServices.map(item=><div key={item.id} className="flex justify-between text-[10.5px]"><span>{item.name}</span><span className="text-[#64748B]">{item.quotaCost} 点</span></div>)}</div></div></div>
    {overrideNote && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800"><strong>特殊调整：</strong>{overrideNote}</div>}
  </div>;
};
