import React, { useState } from 'react';
import { AuthCode } from '../../types';

interface QuotaAndAuthCodeViewProps {
  authCodes: AuthCode[];
  onRevokeAuthCode: (codeId: string) => void;
  onGenerateCodeForTest: (institutionName: string, teacherName: string, studentName: string, pkgName: string) => void;
}

export const QuotaAndAuthCodeView: React.FC<QuotaAndAuthCodeViewProps> = ({
  authCodes,
  onRevokeAuthCode,
  onGenerateCodeForTest,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [globalClaimDays, setGlobalClaimDays] = useState<number>(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Test Code Generation Modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testForm, setTestForm] = useState({
    institutionName: '浙江大学附属中学',
    teacherName: '张敏老师',
    studentName: '赵雷',
    packageName: '全科高量包',
  });

  const filteredCodes = authCodes.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.studentName && item.studentName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = (item: AuthCode) => {
    if (item.status === 'used') {
      alert('无法作废：该授权码已由学生成功激活绑定，已生效服务不受影响！');
      return;
    }
    if (confirm(`确定要作废授权码【${item.code}】吗？作废后学生将无法激活。`)) {
      onRevokeAuthCode(item.id);
    }
  };

  const handleExportCSV = () => {
    const headers = ['授权码', '机构名称', '责任教师', '绑定学生', '服务包名称', '生成时间', '截止时间', '状态'];
    const rows = filteredCodes.map((c) => [
      c.code,
      c.institutionName,
      c.teacherName,
      c.studentName || '未绑定',
      c.packageName,
      c.createdAt,
      c.expireAt,
      c.status === 'used' ? '已使用' : c.status === 'pending' ? '待激活' : c.status === 'revoked' ? '已作废' : '已过期',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `开窍AI学伴_授权码履约表_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filter & Global Setting Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex flex-wrap items-center gap-3 shadow-2xs">
        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索 12 位授权码、机构、教师或学生..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg py-1.5 pl-9 pr-3 text-[13px] font-mono focus:border-[#16B45B] focus:bg-white outline-none"
          />
        </div>

        <div className="w-40">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg py-1.5 px-2.5 text-[13px] focus:border-[#16B45B] focus:bg-white outline-none cursor-pointer"
          >
            <option value="all">全部状态</option>
            <option value="pending">待激活</option>
            <option value="used">已激活</option>
            <option value="expired">已过期</option>
            <option value="revoked">已作废</option>
          </select>
        </div>

        <div className="flex items-center gap-2 border-l border-[#E2E8F0] pl-3 text-[12px] text-[#64748B]">
          <span>有效期:</span>
          <input
            type="number"
            min={1}
            max={365}
            value={globalClaimDays}
            onChange={(e) => setGlobalClaimDays(Number(e.target.value))}
            className="w-14 border border-[#E2E8F0] rounded py-1 px-1 text-center font-bold outline-none text-[#0F172A]"
          />
          <span>天</span>
          <button
            onClick={() => alert(`已更新全局授权码有效期为 ${globalClaimDays} 天`)}
            className="px-2 py-1 bg-[#E8F7EE] text-[#16B45B] rounded text-[11.5px] font-bold hover:bg-[#16B45B] hover:text-white cursor-pointer transition-all"
          >
            保存
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] px-2.5 py-1 rounded-lg font-bold text-[12px] hover:bg-gray-100 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>导出 CSV</span>
          </button>
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-1 bg-[#16B45B] text-white px-3 py-1 rounded-lg font-bold text-[12px] shadow-xs hover:bg-[#139B4E] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>生成测试码</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B]">12 位学生授权码</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B]">所属机构 / 责任教师</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B]">绑定学生 / 服务包</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B]">生成时间 / 截止时间</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B]">履约状态</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B] text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                    <span className="material-symbols-outlined text-[48px] text-gray-300 mb-2 block">
                      confirmation_number
                    </span>
                    <p className="text-[14px] font-medium">未找到符合条件的授权码记录</p>
                  </td>
                </tr>
              ) : (
                filteredCodes.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-[14px] text-[#16B45B] bg-[#E8F7EE] px-2.5 py-1 rounded-lg border border-[#16B45B]/20">
                          {item.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(item.code, item.id)}
                          className="text-[#64748B] hover:text-[#16B45B] p-1 cursor-pointer"
                          title="复制授权码"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {copiedId === item.id ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0F172A]">{item.institutionName}</div>
                      <div className="text-[11px] text-[#64748B]">{item.teacherName}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0F172A]">
                        {item.studentName || <span className="text-gray-400 font-normal">待学生激活</span>}
                      </div>
                      <div className="text-[11px] text-[#16B45B] font-medium">
                        {item.packageName} ({item.quotaConsumed}点)
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-[12px] text-[#64748B]">
                      <div>生成: {item.createdAt}</div>
                      <div className="text-[11px] text-[#94A3B8]">截止: {item.expireAt}</div>
                    </td>

                    <td className="px-6 py-4">
                      {item.status === 'used' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F7EE] text-[#16B45B] text-[12px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16B45B]"></span>
                          已使用
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[12px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                          待激活
                        </span>
                      )}
                      {item.status === 'expired' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[12px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                          已过期
                        </span>
                      )}
                      {item.status === 'revoked' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] text-[12px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                          已作废
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {item.status === 'pending' ? (
                        <button
                          onClick={() => handleRevoke(item)}
                          className="px-3 py-1 bg-[#FEF2F2] text-[#DC2626] rounded-lg hover:bg-red-100 text-[12px] font-bold cursor-pointer transition-colors"
                        >
                          作废该码
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-mono">不可作废</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-[17px] font-bold text-[#0F172A]">
                测试生成 12 位学生授权码
              </h3>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onGenerateCodeForTest(
                  testForm.institutionName,
                  testForm.teacherName,
                  testForm.studentName,
                  testForm.packageName
                );
                setIsTestModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">所属机构全称</label>
                <input
                  type="text"
                  required
                  value={testForm.institutionName}
                  onChange={(e) => setTestForm({ ...testForm, institutionName: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#16B45B]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">责任教师姓名</label>
                <input
                  type="text"
                  required
                  value={testForm.teacherName}
                  onChange={(e) => setTestForm({ ...testForm, teacherName: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#16B45B]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">目标学生姓名</label>
                <input
                  type="text"
                  required
                  value={testForm.studentName}
                  onChange={(e) => setTestForm({ ...testForm, studentName: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#16B45B]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">选择开通服务包</label>
                <select
                  value={testForm.packageName}
                  onChange={(e) => setTestForm({ ...testForm, packageName: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none cursor-pointer focus:border-[#16B45B]"
                >
                  <option value="单科低量包">单科低量包 (扣减50点，含20万 AI 用量)</option>
                  <option value="单科高量包">单科高量包 (扣减120点，含100万 AI 用量)</option>
                  <option value="全科低量包">全科低量包 (扣减180点，含200万 AI 用量)</option>
                  <option value="全科高量包">全科高量包 (扣减350点，含500万 AI 用量)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[14px] text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#16B45B] text-white rounded-lg text-[14px] font-bold hover:bg-[#139B4E] cursor-pointer shadow-2xs"
                >
                  扣减额度并生成 12 位码
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
