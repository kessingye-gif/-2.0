import React from 'react';
import type { AuthCode, Institution, OrderLedgerRecord } from '../../types';
import { FulfillmentProgress, getInstitutionFulfillmentProgress } from './FulfillmentProgress';

interface InstitutionCommercialSummaryProps {
  institution: Institution;
  authCodes: AuthCode[];
  orders: OrderLedgerRecord[];
}

export const InstitutionCommercialSummary: React.FC<InstitutionCommercialSummaryProps> = ({ institution, authCodes, orders }) => {
  const relatedCodes = authCodes.filter((item) => item.institutionId === institution.id);
  const relatedOrders = orders.filter((item) => item.institutionId === institution.id);
  const activated = relatedCodes.filter((item) => item.status === 'used').length;
  const consumedCredits = Math.max(0, institution.totalQuota - institution.remainingQuota);
  const progress = getInstitutionFulfillmentProgress(institution, authCodes, orders);

  return (
    <div className="space-y-4 rounded-2xl border border-[#BBE7CC] bg-[#F4FCF7] p-4">
      <div className="flex items-start justify-between gap-3">
        <div><h4 className="text-[13.5px] font-bold text-[#0F172A]">商业履约进度</h4><p className="mt-1 text-[11px] text-[#64748B]">合同到期：{institution.contractExpireAt ?? '未设置'}</p></div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#0E7D3E]">
          {institution.contractStatus === 'active' ? '合同履约中' : institution.contractStatus === 'expiring' ? '合同将到期' : '待完善'}
        </span>
      </div>
      <FulfillmentProgress steps={progress} />
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white p-2.5"><p className="text-[9px] text-[#94A3B8]">合同金额</p><p className="mt-1 text-[13px] font-bold text-[#0F172A]">¥{(institution.contractAmount ?? 0).toLocaleString('zh-CN')}</p></div>
        <div className="rounded-lg bg-white p-2.5"><p className="text-[9px] text-[#94A3B8]">累计消耗</p><p className="mt-1 text-[13px] font-bold text-[#0F172A]">{consumedCredits.toLocaleString('zh-CN')} 点</p></div>
        <div className="rounded-lg bg-white p-2.5"><p className="text-[9px] text-[#94A3B8]">已激活学生</p><p className="mt-1 text-[13px] font-bold text-[#0F172A]">{activated} 人</p></div>
      </div>
      <p className="text-[10px] text-[#64748B]">关联 {relatedOrders.length} 笔订单 · {relatedCodes.length} 个学生开通码</p>
    </div>
  );
};
