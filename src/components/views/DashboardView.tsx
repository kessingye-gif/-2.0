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
  return (
    <div className="space-y-5">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex justify-between items-center text-[#64748B] mb-2">
            <span className="text-[12px] font-bold">运行机构数</span>
            <span className="material-symbols-outlined text-[20px] text-[#16B45B]">corporate_fare</span>
          </div>
          <p className="text-[24px] font-bold text-[#0F172A] font-mono">
            {stats.activeInstitutions}
          </p>
          <div className="text-[11px] text-[#16B45B] font-bold mt-1">
            本月新增 +{stats.activeInstitutionsGrowth} 家
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex justify-between items-center text-[#64748B] mb-2">
            <span className="text-[12px] font-bold">平台剩余额度</span>
            <span className="material-symbols-outlined text-[20px] text-[#2563EB]">token</span>
          </div>
          <p className="text-[24px] font-bold text-[#0F172A] font-mono">
            {stats.platformRemainingQuota}
          </p>
          <div className="text-[11px] text-[#D97706] font-bold mt-1">
            {stats.alertInstitutionsCount} 家机构可用额度不足 15%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex justify-between items-center text-[#64748B] mb-2">
            <span className="text-[12px] font-bold">授权码激活率</span>
            <span className="material-symbols-outlined text-[20px] text-[#16B45B]">verified</span>
          </div>
          <p className="text-[24px] font-bold text-[#0F172A] font-mono">
            {stats.totalPackageActivationRate}%
          </p>
          <div className="text-[11px] text-[#64748B] mt-1">
            实时卡号绑卡核销正常
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex justify-between items-center text-[#64748B] mb-2">
            <span className="text-[12px] font-bold">今日 AI 批改与答疑</span>
            <span className="material-symbols-outlined text-[20px] text-[#F5B700]">auto_awesome</span>
          </div>
          <p className="text-[24px] font-bold text-[#0F172A] font-mono">
            {stats.dailyAiRequests.toLocaleString()} <span className="text-[12px] font-normal text-[#64748B]">次</span>
          </p>
          <div className="text-[11px] text-[#16B45B] font-bold mt-1">
            平均响应时间 1.8 秒
          </div>
        </div>
      </div>

      {/* Alert Institutions & Realtime Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Quota Alert Institutions Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#E2E8F0]">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#F5B700] text-[18px]">warning</span>
              重点关注机构 (额度低)
            </h3>
            <button
              onClick={() => onNavigateToTab('institutions')}
              className="text-[12px] font-bold text-[#16B45B] hover:underline cursor-pointer"
            >
              全部机构 &rarr;
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead className="bg-[#F8FAFC] text-[#64748B]">
                <tr>
                  <th className="p-2.5 font-bold">机构名称</th>
                  <th className="p-2.5 font-bold">负责人 / 电话</th>
                  <th className="p-2.5 font-bold">剩余额度</th>
                  <th className="p-2.5 font-bold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {institutions.slice(0, 5).map((inst) => {
                  const pct = inst.totalQuota > 0 ? Math.round((inst.remainingQuota / inst.totalQuota) * 100) : 0;
                  return (
                    <tr key={inst.id} className="hover:bg-[#F8FAFC]">
                      <td className="p-2.5">
                        <div className="font-bold text-[#0F172A]">{inst.name}</div>
                        <div className="text-[10.5px] text-[#94A3B8] font-mono">{inst.id}</div>
                      </td>
                      <td className="p-2.5">
                        <div className="font-medium text-[#0F172A]">{inst.contactPerson}</div>
                        <div className="text-[10.5px] text-[#64748B] font-mono">{inst.phone}</div>
                      </td>
                      <td className="p-2.5 font-mono">
                        <div className="font-bold text-[#0F172A]">
                          {inst.remainingQuota.toLocaleString()}
                        </div>
                        <div
                          className={`text-[10.5px] font-bold ${
                            pct <= 15 ? 'text-[#D97706]' : 'text-[#16B45B]'
                          }`}
                        >
                          {inst.status === 'inactive' ? '停用' : `余 ${pct}%`}
                        </div>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => onNavigateToTab('institutions')}
                          className="px-2.5 py-1 bg-[#E8F7EE] text-[#16B45B] rounded-md text-[11.5px] font-bold hover:bg-[#16B45B] hover:text-white transition-all cursor-pointer"
                        >
                          划拨
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
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#E2E8F0]">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#16B45B] text-[18px]">history</span>
              操作日志
            </h3>
            <button
              onClick={() => onNavigateToTab('auditLogs')}
              className="text-[12px] font-bold text-[#16B45B] hover:underline cursor-pointer"
            >
              查看更多 &rarr;
            </button>
          </div>

          <div className="space-y-2.5 text-[12px]">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-lg space-y-0.5">
                <div className="flex justify-between text-[#64748B]">
                  <span className="font-bold text-[#16B45B]">{log.action}</span>
                  <span className="text-[10px] text-[#94A3B8] font-mono">{log.timestamp.slice(11)}</span>
                </div>
                <p className="font-bold text-[#0F172A] text-[12.5px] truncate">{log.target}</p>
                <p className="text-[11px] text-[#64748B] truncate">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
