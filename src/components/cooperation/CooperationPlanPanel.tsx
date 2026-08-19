import React, { useState } from 'react';
import type { ContentPackageItem, CooperationPlan, ServicePackage } from '../../types';
import { validateCooperationPlan } from '../../domain/cooperationPlan';
import { CooperationAuthorizationSummary } from './CooperationAuthorizationSummary';
import { ChoiceCard, controlClassName, DialogShell, FieldLabel } from '../ui/FormPrimitives';

interface CooperationPlanPanelProps {
  plans: CooperationPlan[];
  contentPackages: ContentPackageItem[];
  servicePackages: ServicePackage[];
  onAddPlan: (plan: CooperationPlan) => void;
  onUpdatePlan: (id: string, changes: Partial<CooperationPlan>) => void;
}

export const CooperationPlanPanel: React.FC<CooperationPlanPanelProps> = ({ plans, contentPackages, servicePackages, onAddPlan }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [contentIds, setContentIds] = useState<string[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [quota, setQuota] = useState(50000);
  const [duration, setDuration] = useState(365);

  const save = () => {
    const now = new Date().toISOString().slice(0, 10);
    const plan: CooperationPlan = { id: `PLAN-${Date.now()}`, code: `PLAN-${Date.now().toString().slice(-6)}`, name, contentPackageIds: contentIds, servicePackageIds: serviceIds, suggestedInitialQuota: quota, cooperationDurationDays: duration, status: 'active', version: 1, institutionCount: 0, createdAt: now, updatedAt: now };
    if (validateCooperationPlan(plan, { contentPackages, servicePackages })) return;
    onAddPlan(plan);
    setIsOpen(false);
  };

  return <div className="space-y-4">
    <div className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-4">
      <div><h3 className="font-bold text-[#0F172A]">机构授权模板</h3><p className="mt-1 text-[12px] text-[#64748B]">仅用于创建机构时快速带入选项；实际权限仍以每家机构保存的授权范围为准。</p></div>
      <button onClick={() => setIsOpen(true)} className="rounded-xl bg-[#16B45B] px-4 py-2 text-[13px] font-bold text-white">新建授权模板</button>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      {plans.map((plan) => <div key={plan.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
        <div className="flex items-start justify-between"><div><h4 className="font-bold text-[#0F172A]">{plan.name}</h4><p className="mt-1 font-mono text-[11px] text-[#94A3B8]">{plan.code} · V{plan.version}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${plan.status === 'active' ? 'bg-[#E8F7EE] text-[#0E7D3E]' : 'bg-slate-100 text-slate-500'}`}>{plan.status === 'active' ? '已启用' : plan.status === 'draft' ? '草稿' : '已停用'}</span></div>
        <div className="mt-4"><CooperationAuthorizationSummary plan={plan} contentPackages={contentPackages} servicePackages={servicePackages} compact /></div>
        <div className="mt-3 flex justify-between text-[12px] text-[#64748B]"><span>建议额度 {plan.suggestedInitialQuota.toLocaleString()} 点</span><span>{plan.institutionCount} 家机构使用</span></div>
      </div>)}
    </div>
    {isOpen && <DialogShell title="新建机构授权模板" description="模板只带入初始选项，不会自动扩大任何机构的实际权限。" onClose={()=>setIsOpen(false)} footer={<><button onClick={()=>setIsOpen(false)} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-[13px] font-bold text-[#64748B] hover:bg-[#F8FAFC]">取消</button><button disabled={!name || !contentIds.length || !serviceIds.length} onClick={save} className="rounded-xl bg-[#16B45B] px-4 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-[#139B4E] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:shadow-none">保存模板</button></>}>
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4"><div className="mb-3 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8F7EE] text-[11px] font-bold text-[#16B45B]">1</span><h4 className="text-[13px] font-bold text-[#0F172A]">基本信息</h4></div><FieldLabel label="方案名称" required><input value={name} onChange={(e) => setName(e.target.value)} className={controlClassName} placeholder="如：初中理科标准方案" /></FieldLabel></section>
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8F7EE] text-[11px] font-bold text-[#16B45B]">2</span><div><h4 className="text-[13px] font-bold text-[#0F172A]">教学内容</h4><p className="mt-0.5 text-[11px] text-[#64748B]">选择机构可以使用的已发布内容包</p></div></div><span className="text-[11px] font-bold text-[#16B45B]">已选 {contentIds.length} 个</span></div><div className="grid gap-2 sm:grid-cols-2">{contentPackages.filter(p=>p.status==='active').map(p=><ChoiceCard key={p.id} checked={contentIds.includes(p.id)} title={p.name} meta={`${p.stage} · ${p.subject} · ${p.questionCount.toLocaleString()} 道题`} onChange={()=>setContentIds(x=>x.includes(p.id)?x.filter(id=>id!==p.id):[...x,p.id])}/>)}</div></section>
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8F7EE] text-[11px] font-bold text-[#16B45B]">3</span><div><h4 className="text-[13px] font-bold text-[#0F172A]">服务权益</h4><p className="mt-0.5 text-[11px] text-[#64748B]">选择机构可以为学生办理的服务包</p></div></div><span className="text-[11px] font-bold text-[#16B45B]">已选 {serviceIds.length} 个</span></div><div className="grid gap-2 sm:grid-cols-2">{servicePackages.filter(p=>p.status==='active').map(p=><ChoiceCard key={p.id} checked={serviceIds.includes(p.id)} title={p.name} meta={`${p.quotaCost} 点 · 每日 ${p.includedAiUsage.toLocaleString()} AI 用量 · ${p.durationDays || '长期'}${p.durationDays ? ' 天' : ''}`} onChange={()=>setServiceIds(x=>x.includes(p.id)?x.filter(id=>id!==p.id):[...x,p.id])}/>)}</div></section>
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4"><div className="mb-3 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8F7EE] text-[11px] font-bold text-[#16B45B]">4</span><h4 className="text-[13px] font-bold text-[#0F172A]">商务建议</h4></div><div className="grid gap-3 sm:grid-cols-2"><FieldLabel label="建议初始额度" hint="点"><input type="number" value={quota} onChange={e=>setQuota(Number(e.target.value))} className={`${controlClassName} font-mono`}/></FieldLabel><FieldLabel label="合作期限" hint="天"><input type="number" value={duration} onChange={e=>setDuration(Number(e.target.value))} className={`${controlClassName} font-mono`}/></FieldLabel></div></section>
      </div>
    </DialogShell>}
  </div>;
};
