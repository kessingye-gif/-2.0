import React, { useState } from 'react';
import { AuditLogItem } from '../../types';

interface AuditLogViewProps {
  logs: AuditLogItem[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operatorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = !moduleFilter || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex flex-wrap items-center gap-3 shadow-2xs">
        <div className="flex-1 min-w-[200px] relative">
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

        <div className="w-40">
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

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
              <tr>
                <th className="px-6 py-4 font-bold">时间戳</th>
                <th className="px-6 py-4 font-bold">操作人 / IP</th>
                <th className="px-6 py-4 font-bold">业务模块 / 动作</th>
                <th className="px-6 py-4 font-bold">目标对象</th>
                <th className="px-6 py-4 font-bold">变动明细</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                    <span className="material-symbols-outlined text-[48px] text-gray-300 mb-2 block">
                      receipt_long
                    </span>
                    <p className="text-[14px] font-medium font-sans">暂无符合条件的审计日志记录</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 text-[#64748B] whitespace-nowrap">{log.timestamp}</td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0F172A] font-sans">{log.operatorName}</div>
                      <div className="text-[11px] text-[#94A3B8]">{log.ipAddress}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E8F7EE] text-[#0E7D3E] font-bold text-[11px] font-sans">
                        {log.module}
                      </span>
                      <div className="font-bold text-[#0F172A] mt-1 font-sans">{log.action}</div>
                    </td>

                    <td className="px-6 py-4 font-bold text-[#0F172A] font-sans">{log.target}</td>

                    <td className="px-6 py-4 text-[#475569] font-sans text-[12.5px] max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
