import React, { useMemo, useState } from 'react';
import type { ServiceFulfillmentResult, ServicePackage, StudentItem } from '../../types';
import { createServiceFulfillment } from '../../domain/serviceFulfillment';

interface ServiceFulfillmentPanelProps {
  student: StudentItem;
  packages: ServicePackage[];
  teacherRemainingQuota?: number;
  onFulfill: (result: ServiceFulfillmentResult) => void;
  compact?: boolean;
}

export const ServiceFulfillmentPanel: React.FC<ServiceFulfillmentPanelProps> = ({ student, packages, teacherRemainingQuota, onFulfill, compact = false }) => {
  const availablePackages = useMemo(() => packages.filter((item) => item.status === 'active'), [packages]);
  const [packageId, setPackageId] = useState(availablePackages[0]?.id ?? '');
  const [result, setResult] = useState<ServiceFulfillmentResult | null>(null);
  const [error, setError] = useState('');
  const selectedPackage = availablePackages.find((item) => item.id === packageId);
  const insufficientCredits = Boolean(selectedPackage && teacherRemainingQuota !== undefined && teacherRemainingQuota < selectedPackage.quotaCost);

  const handleConfirm = () => {
    if (!selectedPackage || result) return;
    const fulfillment = createServiceFulfillment({
      student,
      servicePackage: selectedPackage,
      now: new Date(),
      nonce: Math.random().toString().slice(2, 6).padEnd(4, '0'),
    });
    try {
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
          <p className="mt-1 text-[12px] text-[#64748B]">核对学生归属并选择服务包，确认后同时生成授权码、家长绑定码和服务权益。</p>
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
            <button key={item.id} type="button" disabled={Boolean(result)} onClick={() => setPackageId(item.id)} className={`rounded-xl border p-4 text-left transition-colors ${packageId === item.id ? 'border-[#16B45B] bg-[#F0FBF4]' : 'border-[#E2E8F0] hover:border-[#86D6A5]'}`}>
              <div className="font-bold text-[#0F172A]">{item.name}</div>
              <div className="mt-3 space-y-1 text-[12px] text-[#64748B]">
                <div>消耗采购点数：<strong className="text-[#0F172A]">{item.quotaCost.toLocaleString()}</strong></div>
                <div>包含 AI 用量：<strong className="text-[#0F172A]">{item.includedAiUsage.toLocaleString()}</strong></div>
                <div>服务有效期：<strong className="text-[#0F172A]">{item.durationDays === null ? '长期有效' : `${item.durationDays} 天`}</strong></div>
              </div>
            </button>
          ))}
        </div>
        {teacherRemainingQuota !== undefined && <div className={`mt-4 rounded-xl px-3 py-2 text-[12px] ${insufficientCredits ? 'bg-red-50 text-red-700' : 'bg-[#F0FBF4] text-[#0E7D3E]'}`}>
          教师可用点数：<strong>{teacherRemainingQuota.toLocaleString()} 点</strong>
          {selectedPackage && <span className="ml-2">本次扣除 {selectedPackage.quotaCost.toLocaleString()} 点{insufficientCredits ? `，还差 ${(selectedPackage.quotaCost - teacherRemainingQuota).toLocaleString()} 点` : `，办理后剩余 ${(teacherRemainingQuota - selectedPackage.quotaCost).toLocaleString()} 点`}</span>}
        </div>}
        {error && <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700" role="alert">{error}</div>}
        <div className="mt-5 flex justify-end">
          <button type="button" disabled={!selectedPackage || Boolean(result) || insufficientCredits} onClick={handleConfirm} className="rounded-xl bg-[#16B45B] px-5 py-2.5 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#94A3B8]">
            {result ? '已完成办理' : '确认办理并生成全部凭证'}
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-2xl border border-[#A7E4BE] bg-[#F0FBF4] p-5">
          <h4 className="font-bold text-[#0E7D3E]">服务办理成功</h4>
          <p className="mt-1 text-[12px] text-[#4B8060]">结果已同步写入学生管理，无需再次手工生成。</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-white p-4"><div className="text-[11px] text-[#64748B]">学生授权码</div><div className="mt-1 font-mono text-[16px] font-bold text-[#16B45B]">{result.authCode.code}</div></div>
            <div className="rounded-xl bg-white p-4"><div className="text-[11px] text-[#64748B]">家长绑定码</div><div className="mt-1 font-mono text-[16px] font-bold text-[#16B45B]">{result.guardianBindingCode.code}</div></div>
          </div>
        </div>
      )}
    </div>
  );
};
