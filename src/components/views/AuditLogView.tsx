import React, { useState } from 'react';
import { AuditLogItem } from '../../types';

interface AuditLogViewProps {
  logs: AuditLogItem[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operatorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = !moduleFilter || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const handleExport = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Overview Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[12px] font-bold text-[#64748B]">日志总数</p>
            <p className="text-[22px] font-bold text-[#0F172A] font-mono mt-1">{logs.length} <span className="text-[12px] font-normal text-[#64748B]">条</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8F7EE] text-[#16B45B] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">receipt_long</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[12px] font-bold text-[#64748B]">敏感高危操作</p>
            <p className="text-[22px] font-bold text-[#0F172A] font-mono mt-1">
              {logs.filter(l => l.action.includes('调增') || l.action.includes('废弃') || l.action.includes('删除')).length} <span className="text-[12px] font-normal text-[#64748B]">条</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">security</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[12px] font-bold text-[#64748B]">安全审计状态</p>
            <p className="text-[14px] font-bold text-[#16B45B] mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16B45B] animate-pulse"></span>
              全量实时审计中
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索操作目标、变动细节或管理员姓名..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg py-1.5 pl-9 pr-3 text-[13px] outline-none focus:border-[#16B45B] focus:bg-white"
            />
          </div>

          <div className="w-44">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg py-1.5 px-2.5 text-[13px] outline-none focus:border-[#16B45B] focus:bg-white cursor-pointer"
            >
              <option value="">全部模块</option>
              <option value="机构管理">机构管理</option>
              <option value="服务包管理">服务包管理</option>
              <option value="额度授权码">额度授权码</option>
              <option value="题库管理">题库管理</option>
              <option value="诊断管理">诊断管理</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="px-3.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] rounded-lg text-[12.5px] font-bold hover:bg-[#E8F7EE] hover:border-[#16B45B] hover:text-[#16B45B] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>导出日志 JSON</span>
        </button>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
              <tr>
                <th className="px-5 py-3.5 font-bold">时间戳</th>
                <th className="px-5 py-3.5 font-bold">操作人 / IP</th>
                <th className="px-5 py-3.5 font-bold">业务模块 / 动作</th>
                <th className="px-5 py-3.5 font-bold">目标对象</th>
                <th className="px-5 py-3.5 font-bold">变动明细</th>
                <th className="px-5 py-3.5 font-bold text-right">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                    <span className="material-symbols-outlined text-[48px] text-gray-300 mb-2 block">
                      receipt_long
                    </span>
                    <p className="text-[14px] font-medium font-sans">暂无符合条件的审计日志记录</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5 text-[#64748B] font-mono whitespace-nowrap text-[12px]">{log.timestamp}</td>

                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[#0F172A]">{log.operatorName}</div>
                      <div className="text-[11px] text-[#94A3B8] font-mono">{log.ipAddress}</div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-[#E8F7EE] text-[#0E7D3E] font-bold text-[11px]">
                        {log.module}
                      </span>
                      <div className="font-bold text-[#0F172A] mt-1">{log.action}</div>
                    </td>

                    <td className="px-5 py-3.5 font-bold text-[#0F172A]">{log.target}</td>

                    <td className="px-5 py-3.5 text-[#475569] text-[12.5px] max-w-md truncate">
                      {log.details}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-[#16B45B] hover:underline font-bold text-[12px] cursor-pointer"
                      >
                        查看明细
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#16B45B]">receipt_long</span>
                <h3 className="text-[16px] font-bold text-[#0F172A]">审计日志变动明细</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <div>
                  <span className="text-[11px] text-[#64748B] block">日志 ID</span>
                  <span className="font-mono font-bold text-[#0F172A]">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">记录时间</span>
                  <span className="font-mono font-bold text-[#0F172A]">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">执行人员</span>
                  <span className="font-bold text-[#0F172A]">{selectedLog.operatorName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">IP 地址</span>
                  <span className="font-mono text-[#0F172A]">{selectedLog.ipAddress}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block mb-1">业务模块 & 操作类型</span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8F7EE] text-[#0E7D3E] font-bold text-[11px]">
                    {selectedLog.module}
                  </span>
                  <span className="font-bold text-[#0F172A]">{selectedLog.action}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block mb-1">关联目标对象</span>
                <p className="font-bold text-[#0F172A] bg-white border border-[#E2E8F0] p-2.5 rounded-lg">{selectedLog.target}</p>
              </div>

              <div>
                <span className="text-[11px] text-[#64748B] block mb-1">变更记录详情 (Audit Details)</span>
                <div className="bg-[#0F172A] text-[#F8FAFC] font-mono text-[12px] p-3 rounded-xl overflow-x-auto leading-relaxed">
                  {selectedLog.details}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#16B45B] text-white rounded-lg font-bold text-[13px] hover:bg-[#0E7D3E] transition-colors cursor-pointer"
              >
                已知晓关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

