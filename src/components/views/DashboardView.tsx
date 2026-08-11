import React from 'react';
import type { NavTab } from '../../navigation';
import type { FulfillmentSnapshot } from '../../types';
import { FulfillmentFunnel } from '../dashboard/FulfillmentFunnel';
import { FulfillmentTimeline } from '../dashboard/FulfillmentTimeline';
import { WorkItemList } from '../dashboard/WorkItemList';

interface DashboardViewProps {
  snapshot: FulfillmentSnapshot;
  onNavigateToTab: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ snapshot, onNavigateToTab }) => (
  <div className="mx-auto max-w-[1480px] space-y-5">
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[12px] font-medium text-[#0E7D3E]">平台总部 · 商业经营</p>
        <h2 className="mt-1 text-[25px] font-bold tracking-tight text-[#0F172A]">商业履约驾驶舱</h2>
        <p className="mt-1 text-[12px] text-[#64748B]">从机构签约、额度到账到学生开通与续费，统一跟踪全链路履约。</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-[#DCE7E0] bg-white px-3 py-2 text-[11px] text-[#64748B]">
        <span className="h-2 w-2 rounded-full bg-[#16B45B]" />实时履约数据
      </div>
    </div>

    <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#DDE7E1] bg-white lg:grid-cols-5">
      {snapshot.metrics.map((metric, index) => (
        <div key={metric.id} className={`px-5 py-4 ${index > 0 ? 'border-l border-[#EEF2F0]' : ''}`}>
          <p className="text-[11px] font-medium text-[#64748B]">{metric.label}</p>
          <p className={`mt-1.5 text-[22px] font-bold tabular-nums ${metric.tone === 'warning' ? 'text-[#B45309]' : metric.tone === 'positive' ? 'text-[#0E7D3E]' : 'text-[#0F172A]'}`}>{metric.displayValue}</p>
        </div>
      ))}
    </section>

    <section className="rounded-xl border border-[#DDE7E1] bg-[#F8FBF9] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-[#0F172A]">七段履约漏斗</h3>
          <p className="mt-0.5 text-[11px] text-[#94A3B8]">点击任一环节查看对应业务明细</p>
        </div>
        <span className="rounded-full bg-[#EAF7EF] px-3 py-1 text-[10px] font-semibold text-[#0E7D3E]">商业履约主线</span>
      </div>
      <FulfillmentFunnel steps={snapshot.funnel} onNavigate={onNavigateToTab} />
    </section>

    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <section className="overflow-hidden rounded-xl border border-[#DDE7E1] bg-white">
        <div className="flex items-center justify-between border-b border-[#EEF2F0] px-5 py-4">
          <div>
            <h3 className="text-[14px] font-bold text-[#0F172A]">今日待办</h3>
            <p className="mt-0.5 text-[11px] text-[#94A3B8]">优先处理会影响收款、开通或续费的事项</p>
          </div>
          <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[10px] font-semibold text-[#B45309]">{snapshot.workItems.length} 项</span>
        </div>
        <WorkItemList items={snapshot.workItems} onNavigate={onNavigateToTab} />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#DDE7E1] bg-white">
        <div className="border-b border-[#EEF2F0] px-5 py-4">
          <h3 className="text-[14px] font-bold text-[#0F172A]">机构履约健康度</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 p-5 text-center">
          <div className="rounded-lg bg-[#F0FDF4] px-2 py-3"><p className="text-[20px] font-bold text-[#15803D]">{snapshot.healthyInstitutionCount}</p><p className="text-[10px] text-[#64748B]">正常</p></div>
          <div className="rounded-lg bg-[#FFF7ED] px-2 py-3"><p className="text-[20px] font-bold text-[#B45309]">{snapshot.warningInstitutionCount}</p><p className="text-[10px] text-[#64748B]">预警</p></div>
          <div className="rounded-lg bg-[#FEF2F2] px-2 py-3"><p className="text-[20px] font-bold text-[#DC2626]">{snapshot.exceptionInstitutionCount}</p><p className="text-[10px] text-[#64748B]">异常</p></div>
        </div>
        <div className="border-t border-[#EEF2F0] px-5 py-3">
          <button type="button" onClick={() => onNavigateToTab('customers')} className="text-[11px] font-semibold text-[#0E7D3E]">查看全部客户履约状态 →</button>
        </div>
      </section>
    </div>

    <section className="overflow-hidden rounded-xl border border-[#DDE7E1] bg-white">
      <div className="flex items-center justify-between border-b border-[#EEF2F0] px-5 py-4">
        <h3 className="text-[14px] font-bold text-[#0F172A]">最近履约动态</h3>
        <button type="button" onClick={() => onNavigateToTab('audit')} className="text-[11px] font-semibold text-[#0E7D3E]">查看完整审计</button>
      </div>
      <FulfillmentTimeline events={snapshot.recentEvents} />
    </section>
  </div>
);
