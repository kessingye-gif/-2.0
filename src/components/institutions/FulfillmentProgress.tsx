import React from 'react';
import type { AuthCode, FulfillmentStageId, Institution, OrderLedgerRecord } from '../../types';

export interface InstitutionProgressStep {
  id: FulfillmentStageId;
  label: string;
  count: number;
  status: 'complete' | 'current' | 'pending';
}

export const getInstitutionFulfillmentProgress = (
  institution: Institution,
  authCodes: AuthCode[],
  orders: OrderLedgerRecord[],
): InstitutionProgressStep[] => {
  const codes = authCodes.filter((item) => item.institutionId === institution.id);
  const institutionOrders = orders.filter((item) => item.institutionId === institution.id);
  const activated = codes.filter((item) => item.status === 'used').length;
  const hasRenewal = institutionOrders.some((item) => item.type === 'ai_usage_pack_buy' || item.type === 'refund');
  const values = [
    { id: 'contracted' as const, label: '机构签约', count: institution.contractStatus === 'active' || institution.contractStatus === 'expiring' ? 1 : 0 },
    { id: 'funded' as const, label: '额度到账', count: institution.totalQuota > 0 ? 1 : 0 },
    { id: 'configured' as const, label: '服务配置', count: institution.availableServicePackageIds?.length ?? 0 },
    { id: 'issued' as const, label: '开通码生成', count: codes.length },
    { id: 'activated' as const, label: '学生激活', count: activated },
    { id: 'servicing' as const, label: '服务履约', count: activated },
    { id: 'renewal' as const, label: '续费 / 退款', count: hasRenewal ? 1 : 0 },
  ];
  return values.map((item) => ({
    ...item,
    status: item.count > 0 ? 'complete' : 'pending',
  }));
};

export const FulfillmentProgress: React.FC<{ steps: InstitutionProgressStep[] }> = ({ steps }) => (
  <div className="grid grid-cols-7 gap-1.5">
    {steps.map((step, index) => (
      <div key={step.id} className="min-w-0 text-center">
        <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${step.status === 'complete' ? 'bg-[#16B45B] text-white' : step.status === 'current' ? 'bg-[#FFF7ED] text-[#B45309] ring-1 ring-[#F59E0B]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
          {step.status === 'complete' ? '✓' : index + 1}
        </div>
        <p className="mt-1.5 truncate text-[9px] font-medium text-[#64748B]" title={step.label}>{step.label}</p>
      </div>
    ))}
  </div>
);
