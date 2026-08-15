import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PlatformDashboardSnapshot } from '../../dashboardSnapshot';
import { DashboardSection } from '../dashboard/DashboardSection';

type DashboardTab = PlatformDashboardSnapshot['sections'][number]['id'] | 'work-items';

export const DashboardView: React.FC<{ snapshot: PlatformDashboardSnapshot; title?: string }> = ({ snapshot, title = '平台经营驾驶舱' }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(snapshot.sections[0]?.id ?? 'work-items');
  const activeSection = snapshot.sections.find((section) => section.id === activeTab);
  const navigation = [
    ...snapshot.sections.map((section) => ({ id: section.id as DashboardTab, label: section.title })),
    { id: 'work-items' as DashboardTab, label: '待办与异常' },
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-5">
      <div><h2 className="text-[22px] font-bold text-[#0F172A]">{title}</h2><p className="mt-1 text-[12px] text-[#64748B]">数据更新：{snapshot.updatedAt}</p></div>
      <nav aria-label="驾驶舱分区" className="max-w-full overflow-x-auto border-b border-[#E2E8F0]">
        <div role="tablist" className="flex min-w-max items-center gap-6">
          {navigation.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(item.id)}
                className={`pb-2 text-[13.5px] font-bold transition-colors ${isActive ? 'border-b-2 border-[#16B45B] text-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div role="tabpanel">
        {activeSection ? (
          <DashboardSection section={activeSection} />
        ) : (
          <section className="rounded-xl border border-[#E2E8F0] bg-white">
            <div className="border-b border-[#EEF2F0] px-5 py-4"><h3 className="text-[15px] font-bold text-[#0F172A]">待办与异常</h3><p className="mt-1 text-[11px] text-[#64748B]">点击待办直接进入已筛选的处理页面</p></div>
            <div className="divide-y divide-[#EEF2F0]">
              {snapshot.workItems.length > 0 ? snapshot.workItems.map((item) => <Link key={item.id} to={item.targetPath} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFDFB]"><span className={`h-2.5 w-2.5 rounded-full ${item.tone === 'danger' ? 'bg-[#DC2626]' : 'bg-[#F59E0B]'}`} /><span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-[#0F172A]">{item.title}</span><span className="mt-1 block text-[11px] text-[#64748B]">{item.description}</span></span><strong className="text-[14px] text-[#0F172A]">{item.count} 项</strong><span aria-hidden="true" className="text-[#0E7D3E]">→</span></Link>) : <p className="px-5 py-8 text-center text-[12px] text-[#64748B]">当前暂无待办与异常</p>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
import React from 'react';
