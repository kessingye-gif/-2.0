import React, { useMemo, useState } from 'react';
import type { ContentPackageItem, Institution, ServiceFulfillmentResult, ServicePackage, StudentItem, StudentServiceRight } from '../../types';
import { createServiceFulfillment } from '../../domain/serviceFulfillment';

interface ServiceFulfillmentPanelProps {
  student: StudentItem;
  packages: ServicePackage[];
  institutionRemainingQuota?: number;
  institution?: Institution;
  contentPackages?: ContentPackageItem[];
  existingRights?: StudentServiceRight[];
  onFulfill: (result: ServiceFulfillmentResult) => void;
  compact?: boolean;
}

export const ServiceFulfillmentPanel: React.FC<ServiceFulfillmentPanelProps> = ({ student, packages, institutionRemainingQuota, institution, contentPackages = [], existingRights = [], onFulfill, compact = false }) => {
  const availablePackages = useMemo(() => packages.filter((item) => item.status === 'active' && (!institution || institution.availableServicePackageIds?.includes(item.id))), [packages, institution]);
  const [packageId, setPackageId] = useState(availablePackages[0]?.id ?? '');
  const [result, setResult] = useState<ServiceFulfillmentResult | null>(null);
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const selectedPackage = availablePackages.find((item) => item.id === packageId);
  const availableContentPackages = contentPackages.filter((item) => item.status === 'active'
    && (!selectedPackage?.selectableContentPackageIds?.length || selectedPackage.selectableContentPackageIds.includes(item.id))
    && (!institution || (institution.availableContentPackages ?? []).some((value) => value === item.id || value === item.name)));
  const requiredContentCount = selectedPackage?.selectableContentPackageCount ?? 1;
  const selectedContentPackages = availableContentPackages.filter((item) => selectedContentIds.includes(item.id));
  const insufficientCredits = Boolean(selectedPackage && institutionRemainingQuota !== undefined && institutionRemainingQuota < selectedPackage.quotaCost);
  const isRenewal = existingRights.some((item) => item.studentId === student.id && item.status === 'active');

  const handleConfirm = () => {
    if (!selectedPackage || result) return;
    try {
      const fulfillment = createServiceFulfillment({
        student,
        servicePackage: selectedPackage,
        now: new Date(),
        nonce: Math.random().toString().slice(2, 6).padEnd(4, '0'),
        contentPackages: selectedContentPackages,
        existingRights,
      });
      onFulfill(fulfillment);
      setResult(fulfillment);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '服务办理失败');
    }
  };

  return (
    <div className="space-y-5">
      {!compact && <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
        <div className="mb-5">
          <h3 className="text-[17px] font-bold text-[#0F172A]">办理学生服务</h3>
          <p className="mt-1 text-[12px] text-[#64748B]">{isRenewal ? '当前用户服务中，续费后有效期直接顺延，无需重新激活。' : '首次办理会生成激活凭证，服务有效期从学生首次激活当天开始计算。'}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['学生', student.name],
            ['所属机构', student.institutionName],
            ['负责教师', student.teacherName],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[#F8FAFC] px-4 py-3">
              <div className="text-[11px] font-bold text-[#94A3B8]">{label}</div>
              <div className="mt-1 text-[14px] font-bold text-[#0F172A]">{value}</div>
            </div>
          ))}
        </div>
      </div>}

      <div className={compact ? '' : 'rounded-2xl border border-[#E2E8F0] bg-white p-5'}>
        <h4 className="mb-3 text-[14px] font-bold text-[#0F172A]">选择服务包</h4>
        <div className="grid gap-3 lg:grid-cols-3">
          {availablePackages.map((item) => (
            <button key={item.id} type="button" disabled={Boolean(result)} onClick={() => { setPackageId(item.id); setSelectedContentIds([]); }} className={`rounded-xl border p-4 text-left transition-colors ${packageId === item.id ? 'border-[#16B45B] bg-[#F0FBF4]' : 'border-[#E2E8F0] hover:border-[#86D6A5]'}`}>
              <div className="font-bold text-[#0F172A]">{item.name}</div>
              <div className="mt-3 space-y-1 text-[12px] text-[#64748B]">
                <div>消耗采购点数：<strong className="text-[#0F172A]">{item.quotaCost.toLocaleString()}</strong></div>
                <div>包含 AI 用量：<strong className="text-[#0F172A]">{item.includedAiUsage.toLocaleString()}</strong></div>
                <div>服务有效期：<strong className="text-[#0F172A]">{item.durationDays === null ? '长期有效' : `${item.durationDays} 天`}</strong></div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between"><h4 className="text-[13px] font-bold text-[#0F172A]">选择内容包</h4><span className="text-[11px] text-[#64748B]">需选 {requiredContentCount} 个</span></div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">{availableContentPackages.map((item) => <label key={item.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-[12px] ${selectedContentIds.includes(item.id) ? 'border-[#16B45B] bg-[#F0FBF4]' : 'border-[#E2E8F0]'}`}><input type="checkbox" checked={selectedContentIds.includes(item.id)} onChange={(event) => setSelectedContentIds((current) => event.target.checked ? (current.length < requiredContentCount ? [...current, item.id] : current) : current.filter((id) => id !== item.id))} /><span><strong className="block text-[#0F172A]">{item.name}</strong><span className="mt-0.5 block text-[#64748B]">{item.stage} · {item.subject}</span></span></label>)}</div>
          {availableContentPackages.length === 0 && <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-700">该机构暂无可用内容包，请先完成机构内容授权。</div>}
        </div>
        {institutionRemainingQuota !== undefined && <div className={`mt-4 rounded-xl px-3 py-2 text-[12px] ${insufficientCredits ? 'bg-red-50 text-red-700' : 'bg-[#F0FBF4] text-[#0E7D3E]'}`}>
          所属机构统一账户：<strong>{institutionRemainingQuota.toLocaleString()} 点</strong>
          {selectedPackage && <span className="ml-2">本次扣除 {selectedPackage.quotaCost.toLocaleString()} 点{insufficientCredits ? `，还差 ${(selectedPackage.quotaCost - institutionRemainingQuota).toLocaleString()} 点` : `，办理后剩余 ${(institutionRemainingQuota - selectedPackage.quotaCost).toLocaleString()} 点`}</span>}
        </div>}
        {error && <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700" role="alert">{error}</div>}
        <div className="mt-5 flex justify-end">
          <button type="button" disabled={!selectedPackage || selectedContentIds.length !== requiredContentCount || Boolean(result) || insufficientCredits} onClick={handleConfirm} className="rounded-xl bg-[#16B45B] px-5 py-2.5 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#94A3B8]">
            {result ? (isRenewal ? '已完成续费' : '已完成办理') : (isRenewal ? '确认续费并顺延' : '确认办理并生成激活凭证')}
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-2xl border border-[#A7E4BE] bg-[#F0FBF4] p-5">
          <h4 className="font-bold text-[#0E7D3E]">{result.right.fulfillmentKind === 'renewal' ? '服务续费成功' : '服务办理成功'}</h4>
          <p className="mt-1 text-[12px] text-[#4B8060]">{result.right.fulfillmentKind === 'renewal' ? `有效期已顺延至 ${result.right.serviceExpireAt ?? '长期有效'}，学生无需重新激活。` : '激活凭证已生成；学生首次激活后开始计算服务有效期。'}</p>
          {result.authCode && result.guardianBindingCode && <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-white p-4"><div className="text-[11px] text-[#64748B]">学生授权码</div><div className="mt-1 font-mono text-[16px] font-bold text-[#16B45B]">{result.authCode.code}</div></div>
            <div className="rounded-xl bg-white p-4"><div className="text-[11px] text-[#64748B]">家长绑定码</div><div className="mt-1 font-mono text-[16px] font-bold text-[#16B45B]">{result.guardianBindingCode.code}</div></div>
          </div>}
        </div>
      )}
    </div>
  );
};
