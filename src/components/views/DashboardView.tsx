import React from 'react';
import { PlatformStats, Institution, AuditLogItem } from '../../types';
import { NavTab } from '../../navigation';

interface DashboardViewProps {
  stats: PlatformStats;
  institutions: Institution[];
  auditLogs: AuditLogItem[];
  onNavigateToTab: (tab: NavTab) => void;
}

const actions: { label: string; hint: string; icon: string; tab: NavTab; primary?: boolean }[] = [
  { label: '新增机构并分配额度', hint: '机构开户', icon: 'add_business', tab: 'institutions', primary: true },
  { label: '导入知识点和题目', hint: '内容入库', icon: 'upload_file', tab: 'content' },
  { label: '处理异常', hint: '补发、扣回与作废', icon: 'error', tab: 'exceptions' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, institutions, auditLogs, onNavigateToTab }) => {
  const riskInstitutions = institutions
    .filter((item) => item.status === 'inactive' || (item.totalQuota > 0 && item.remainingQuota / item.totalQuota <= 0.2))
    .slice(0, 5);

  const metrics = [
    { label: '运行机构', value: stats.activeInstitutions.toLocaleString() },
    { label: '平台可用额度', value: stats.platformRemainingQuota.toLocaleString() },
    { label: '授权码激活率', value: `${stats.totalPackageActivationRate}%` },
    { label: '额度预警', value: `${stats.alertInstitutionsCount} 家`, alert: stats.alertInstitutionsCount > 0 },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-[#64748B]">平台总部</p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight text-[#0F172A]">运营工作台</h2>
        </div>
        <span className="text-[12px] text-[#94A3B8]">数据已更新</span>
      </div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => onNavigateToTab(action.tab)}
            className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
              action.primary
                ? 'border-[#0E7D3E] bg-[#0E7D3E] text-white hover:bg-[#0B6A35]'
                : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#94A3B8]'
            }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${action.primary ? 'text-white' : 'text-[#0E7D3E]'}`}>
              {action.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">{action.label}</span>
              <span className={`mt-0.5 block text-[12px] ${action.primary ? 'text-white/70' : 'text-[#94A3B8]'}`}>
                {action.hint}
              </span>
            </span>
            <span className={`material-symbols-outlined text-[18px] ${action.primary ? 'text-white/70' : 'text-[#CBD5E1]'}`}>arrow_forward</span>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} className={`px-5 py-4 ${index > 0 ? 'border-l border-[#E2E8F0]' : ''}`}>
            <p className="text-[12px] text-[#64748B]">{metric.label}</p>
            <p className={`mt-1 text-[22px] font-semibold tabular-nums ${metric.alert ? 'text-[#B45309]' : 'text-[#0F172A]'}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-[#0F172A]">需要关注</h3>
              {riskInstitutions.length > 0 && <span className="rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[11px] font-medium text-[#B45309]">{riskInstitutions.length}</span>}
            </div>
            <button onClick={() => onNavigateToTab('institutions')} className="text-[12px] font-medium text-[#0E7D3E]">全部机构</button>
          </div>

          {riskInstitutions.length === 0 ? (
            <div className="px-5 py-12 text-center text-[13px] text-[#94A3B8]">暂无机构风险</div>
          ) : (
            <div className="divide-y divide-[#EEF2F6]">
              {riskInstitutions.map((institution) => {
                const percent = institution.totalQuota > 0 ? Math.round((institution.remainingQuota / institution.totalQuota) * 100) : 0;
                return (
                  <button key={institution.id} onClick={() => onNavigateToTab('institutions')} className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-[#F8FAFC]">
                    <span className={`h-2 w-2 rounded-full ${institution.status === 'inactive' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[#0F172A]">{institution.name}</span>
                      <span className="mt-0.5 block text-[11px] text-[#94A3B8]">{institution.status === 'inactive' ? '机构已停用' : `可用额度 ${institution.remainingQuota.toLocaleString()} 点`}</span>
                    </span>
                    <span className="text-[12px] tabular-nums text-[#64748B]">{institution.status === 'inactive' ? '停用' : `${percent}%`}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
            <h3 className="text-[15px] font-semibold text-[#0F172A]">最近操作</h3>
            <button onClick={() => onNavigateToTab('audit')} className="text-[12px] font-medium text-[#0E7D3E]">查看审计</button>
          </div>
          <div className="divide-y divide-[#EEF2F6]">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[13px] font-medium text-[#0F172A]">{log.action}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-[#94A3B8]">{log.timestamp.slice(11, 16)}</span>
                </div>
                <p className="mt-1 truncate text-[12px] text-[#64748B]">{log.target}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
