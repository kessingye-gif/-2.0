import React from 'react';
import { PlatformStats, Institution, AuditLogItem } from '../../types';

interface DashboardViewProps {
  stats: PlatformStats;
  institutions: Institution[];
  auditLogs: AuditLogItem[];
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  institutions,
  auditLogs,
  onNavigateToTab,
}) => {
  const quickActions = [
    { label: '划拨机构额度', icon: 'account_balance_wallet', tab: 'institutions', bg: 'bg-[#E8F7EE]', text: 'text-[#16B45B]' },
    { label: '导入试题资源', icon: 'menu_book', tab: 'questionBank', bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]' },
    { label: '生成授权激活码', icon: 'key', tab: 'goods', bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' },
    { label: '班级与教师管理', icon: 'groups', tab: 'teacherClass', bg: 'bg-[#F3E8FF]', text: 'text-[#9333EA]' },
    { label: '系统日志审计', icon: 'receipt_long', tab: 'auditLogs', bg: 'bg-[#F1F5F9]', text: 'text-[#475569]' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
        <div className="text-[12px] font-bold text-[#64748B] mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[#0F172A]">
            <span className="material-symbols-outlined text-[18px] text-[#16B45B]">bolt</span>
            常用高频快捷操作
          </span>
          <span className="text-[11px] font-normal text-[#94A3B8]">点击直达业务模块进行快速处理</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {quickActions.map((act, i) => (
            <button
              key={i}
              onClick={() => onNavigateToTab(act.tab)}
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all cursor-pointer group text-left"
            >
              <div className={`w-8 h-8 rounded-lg ${act.bg} ${act.text} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                <span className="material-symbols-outlined text-[18px]">{act.icon}</span>
              </div>
              <span className="text-[12.5px] font-bold text-[#0F172A] group-hover:text-[#16B45B] transition-colors truncate">
                {act.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs hover:border-[#CBD5E1] transition-all">
          <div className="flex justify-between items-center text-[#64748B] mb-3">
            <span className="text-[12px] font-bold text-[#475569]">运行机构数</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F7EE] text-[#16B45B] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-[26px] font-bold text-[#0F172A] font-mono tracking-tight">
              {stats.activeInstitutions}
            </p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F7EE] text-[#16B45B]">
              本月新增 +{stats.activeInstitutionsGrowth}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs hover:border-[#CBD5E1] transition-all">
          <div className="flex justify-between items-center text-[#64748B] mb-3">
            <span className="text-[12px] font-bold text-[#475569]">平台剩余额度</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">token</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-[26px] font-bold text-[#0F172A] font-mono tracking-tight">
              {stats.platformRemainingQuota}
            </p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706]">
              {stats.alertInstitutionsCount} 家预警
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs hover:border-[#CBD5E1] transition-all">
          <div className="flex justify-between items-center text-[#64748B] mb-3">
            <span className="text-[12px] font-bold text-[#475569]">授权码激活率</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F7EE] text-[#16B45B] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-[26px] font-bold text-[#0F172A] font-mono tracking-tight">
              {stats.totalPackageActivationRate}%
            </p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">
              绑定核销正常
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs hover:border-[#CBD5E1] transition-all">
          <div className="flex justify-between items-center text-[#64748B] mb-3">
            <span className="text-[12px] font-bold text-[#475569]">今日 AI 批改与答疑</span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-[26px] font-bold text-[#0F172A] font-mono tracking-tight">
              {stats.dailyAiRequests.toLocaleString()} <span className="text-[12px] font-normal text-[#64748B]">次</span>
            </p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F7EE] text-[#16B45B]">
              均耗时 1.8s
            </span>
          </div>
        </div>
      </div>

      {/* Alert Institutions & Realtime Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Quota Alert Institutions Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 flex justify-between items-center border-b border-[#E2E8F0] bg-[#FAFAFA]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F5B700] animate-pulse"></span>
              <h3 className="text-[14px] font-bold text-[#0F172A]">
                重点关注机构 <span className="text-[12px] font-normal text-[#64748B]">(额度受限或偏低)</span>
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab('institutions')}
              className="text-[12px] font-bold text-[#16B45B] hover:text-[#0E7D3E] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>查看全部机构</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3 font-bold">机构名称</th>
                  <th className="px-4 py-3 font-bold">负责人 / 电话</th>
                  <th className="px-4 py-3 font-bold">余量百分比</th>
                  <th className="px-4 py-3 font-bold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {institutions.slice(0, 5).map((inst) => {
                  const pct = inst.totalQuota > 0 ? Math.round((inst.remainingQuota / inst.totalQuota) * 100) : 0;
                  const isLow = pct <= 15;
                  const isInactive = inst.status === 'inactive';

                  return (
                    <tr key={inst.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-[#0F172A]">{inst.name}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-[#0F172A]">{inst.contactPerson}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">{inst.phone}</div>
                      </td>
                      <td className="px-4 py-3.5 w-48">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="font-bold text-[#0F172A]">{inst.remainingQuota.toLocaleString()} 点</span>
                          <span className={`font-bold ${isInactive ? 'text-[#94A3B8]' : isLow ? 'text-[#D97706]' : 'text-[#16B45B]'}`}>
                            {isInactive ? '已停用' : `${pct}%`}
                          </span>
                        </div>
                        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isInactive
                                ? 'bg-[#94A3B8]'
                                : isLow
                                ? 'bg-[#F5B700]'
                                : 'bg-[#16B45B]'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onNavigateToTab('institutions')}
                          className="px-3 py-1 bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] rounded-lg text-[11.5px] font-bold hover:border-[#16B45B] hover:bg-[#E8F7EE] hover:text-[#16B45B] transition-all cursor-pointer shadow-2xs"
                        >
                          调整额度
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Audit Feed */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#16B45B] text-[18px]">receipt_long</span>
                <h3 className="text-[14px] font-bold text-[#0F172A]">最新操作日志</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('auditLogs')}
                className="text-[12px] font-bold text-[#16B45B] hover:text-[#0E7D3E] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>更多</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-[2px] before:bg-[#E2E8F0]">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="relative pl-6 space-y-1">
                  <div className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#16B45B] ring-4 ring-white" />
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className="font-bold text-[#0F172A] bg-[#E8F7EE] text-[#16B45B] px-1.5 py-0.5 rounded text-[10.5px]">
                      {log.action}
                    </span>
                    <span className="font-mono text-[#94A3B8]">{log.timestamp.slice(11)}</span>
                  </div>
                  <p className="font-bold text-[#0F172A] text-[12px] leading-snug">{log.target}</p>
                  <p className="text-[11px] text-[#64748B] leading-normal line-clamp-2">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

