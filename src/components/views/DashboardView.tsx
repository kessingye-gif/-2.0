import { Link } from 'react-router-dom';
import type { PlatformDashboardSnapshot } from '../../dashboardSnapshot';
import { DashboardSection } from '../dashboard/DashboardSection';

const dashboardNavigation = [
  { label: '运营总览', to: '#institutions', current: true },
  { label: '学生与开通', to: '#students' },
  { label: '学习与使用', to: '#learning' },
  { label: '待办与异常', to: '#work-items' },
];

export const DashboardView: React.FC<{ snapshot: PlatformDashboardSnapshot; title?: string }> = ({ snapshot, title = '平台经营驾驶舱' }) => (
  <div className="mx-auto max-w-[1480px] space-y-5">
    <div><h2 className="text-[22px] font-bold text-[#0F172A]">{title}</h2><p className="mt-1 text-[12px] text-[#64748B]">数据更新：{snapshot.updatedAt}</p></div>
    <nav aria-label="驾驶舱分区" className="max-w-full overflow-x-auto rounded-[24px] border border-[#DCE7E1] bg-[#EEF4F1] p-2 shadow-inner shadow-[#DCE7E1]/60">
      <div className="flex min-w-max items-center gap-1">
        {dashboardNavigation.map((item) => (
          <a
            key={item.label}
            href={item.to}
            aria-current={item.current ? 'page' : undefined}
            className={`rounded-[16px] px-7 py-3 text-[16px] font-medium transition-colors ${item.current ? 'bg-white font-bold text-[#0E7D5A] shadow-sm' : 'text-[#5E6F69] hover:bg-white/70 hover:text-[#0F172A]'}`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
    {snapshot.sections.map((section) => <DashboardSection key={section.id} section={section} />)}
    <section id="work-items" className="scroll-mt-5 rounded-xl border border-[#E2E8F0] bg-white">
      <div className="border-b border-[#EEF2F0] px-5 py-4"><h3 className="text-[15px] font-bold text-[#0F172A]">待办与异常</h3><p className="mt-1 text-[11px] text-[#64748B]">点击待办直接进入已筛选的处理页面</p></div>
      <div className="divide-y divide-[#EEF2F0]">{snapshot.workItems.map((item) => <Link key={item.id} to={item.targetPath} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFDFB]"><span className={`h-2.5 w-2.5 rounded-full ${item.tone === 'danger' ? 'bg-[#DC2626]' : 'bg-[#F59E0B]'}`} /><span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-[#0F172A]">{item.title}</span><span className="mt-1 block text-[11px] text-[#64748B]">{item.description}</span></span><strong className="text-[14px] text-[#0F172A]">{item.count} 项</strong><span aria-hidden="true" className="text-[#0E7D3E]">→</span></Link>)}</div>
    </section>
  </div>
);
import React from 'react';
