import React, { useState } from 'react';
import { AuditLogItem, AiModelConfig, TokenCompensation } from '../../types';
import { AuditLogView } from './AuditLogView';

interface SystemViewProps {
  auditLogs: AuditLogItem[];
}

const initialAiModels: AiModelConfig[] = [
  { id: 'MOD-01', name: 'Gemini 1.5 Flash (推理高响应)', provider: 'Google AI Studio', capability: '文本解析', tokenMultiplier: 1.0, isDefault: true, status: 'active', updatedAt: '2026-08-01' },
  { id: 'MOD-02', name: 'Gemini 1.5 Pro (深度学习分析)', provider: 'Google AI Studio', capability: '多模态识图', tokenMultiplier: 1.5, isDefault: false, status: 'active', updatedAt: '2026-08-01' },
  { id: 'MOD-03', name: 'TTS 智能提问与口语练习', provider: 'Native Audio Synthesizer', capability: '语音合成', tokenMultiplier: 2.0, isDefault: false, status: 'active', updatedAt: '2026-07-20' },
];

const initialCompensations: TokenCompensation[] = [
  { id: 'COMP-101', studentId: 'STU-001', studentName: '张伟强', institutionName: '浙江大学附属中学', tokenAmount: 50000, reason: '7月30日线上网络超时导致题目AI诊断中断补偿', operatorName: '超级管理员', timestamp: '2026-07-31 10:00' },
  { id: 'COMP-102', studentId: 'STU-003', studentName: '李思思', institutionName: '上海青葱教育培训中心', tokenAmount: 100000, reason: '活动特邀体验学员非付费算力补充', operatorName: '超级管理员', timestamp: '2026-08-02 14:30' },
];

export const SystemView: React.FC<SystemViewProps> = ({ auditLogs }) => {
  const [activeTab, setActiveTab] = useState<'aiRules' | 'masterData' | 'compensation' | 'auditLogs' | 'exceptionReversal'>('aiRules');

  // AI Models State
  const [aiModels, setAiModels] = useState<AiModelConfig[]>(initialAiModels);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [modelForm, setModelForm] = useState({
    name: '',
    provider: 'Google AI Studio',
    capability: '文本解析' as '文本解析' | '多模态识图' | '语音合成',
    tokenMultiplier: 1.0,
  });

  // Token Compensations State
  const [compensations, setCompensations] = useState<TokenCompensation[]>(initialCompensations);
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [compForm, setCompForm] = useState({
    studentId: 'STU-001',
    studentName: '张伟强',
    institutionName: '浙江大学附属中学',
    tokenAmount: 50000,
    reason: '',
  });

  // Handlers
  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    const newM: AiModelConfig = {
      id: `MOD-${Date.now().toString().slice(-3)}`,
      name: modelForm.name,
      provider: modelForm.provider,
      capability: modelForm.capability,
      tokenMultiplier: Number(modelForm.tokenMultiplier),
      isDefault: false,
      status: 'active',
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setAiModels((prev) => [...prev, newM]);
    setIsModelModalOpen(false);
  };

  const handleSaveCompensation = (e: React.FormEvent) => {
    e.preventDefault();
    const newC: TokenCompensation = {
      id: `COMP-${Date.now().toString().slice(-3)}`,
      studentId: compForm.studentId,
      studentName: compForm.studentName,
      institutionName: compForm.institutionName,
      tokenAmount: Number(compForm.tokenAmount),
      reason: compForm.reason || '运营补发 Token 额度',
      operatorName: '超级管理员',
      timestamp: new Date().toLocaleString().slice(0, 16),
    };
    setCompensations((prev) => [newC, ...prev]);
    setIsCompModalOpen(false);
    alert(`成功向学生【${compForm.studentName}】补发非付费 ${compForm.tokenAmount} Token 算力额度！`);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-6 text-[13.5px] font-bold">
        <button
          onClick={() => setActiveTab('aiRules')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'aiRules' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          AI 模型与 Token 换算规则
        </button>

        <button
          onClick={() => setActiveTab('compensation')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'compensation' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          非付费 Token 补偿发放 ({compensations.length})
        </button>
      </div>

      {/* Tab 1: AI Model & Token Rules */}
      {activeTab === 'aiRules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E2E8F0]">
            <span className="text-[13px] text-[#64748B]">
              针对不同 AI 模型与请求能力类型配置全局 Token 扣减倍率系数
            </span>
            <button
              onClick={() => {
                setModelForm({ name: '', provider: 'Google AI Studio', capability: '文本解析', tokenMultiplier: 1.0 });
                setIsModelModalOpen(true);
              }}
              className="bg-[#16B45B] text-white px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold flex items-center gap-1 shadow-xs hover:bg-[#139B4E] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              新增 AI 模型映射
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <tr>
                  <th className="py-3 px-4">AI 模型名称</th>
                  <th className="py-3 px-4">能力类型</th>
                  <th className="py-3 px-4">技术服务商</th>
                  <th className="py-3 px-4 text-center">Token 换算倍率</th>
                  <th className="py-3 px-4 text-center">默认模型</th>
                  <th className="py-3 px-4 text-center">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {aiModels.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-bold text-[#0F172A]">{m.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold">
                        {m.capability}
                      </span>
                    </td>
                    <td className="py-3 px-4">{m.provider}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#16B45B] text-[14px]">
                      {m.tokenMultiplier}x
                    </td>
                    <td className="py-3 px-4 text-center">
                      {m.isDefault ? (
                        <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded text-[11px]">
                          默认主模型
                        </span>
                      ) : (
                        <span className="text-[#94A3B8] text-[11px]">备用</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-green-600">已启用</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Non-paid Token Compensation */}
      {activeTab === 'compensation' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E2E8F0]">
            <span className="text-[13px] text-[#64748B]">
              针对技术网络故障、退款纠纷或特邀体验，直接向指定学生补发非付费算力 Token 额度
            </span>
            <button
              onClick={() => setIsCompModalOpen(true)}
              className="bg-[#16B45B] text-white px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold flex items-center gap-1 shadow-xs hover:bg-[#139B4E] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              补发 Token 额度
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <tr>
                  <th className="py-3 px-4">补偿编号</th>
                  <th className="py-3 px-4">受补学生</th>
                  <th className="py-3 px-4">所属机构</th>
                  <th className="py-3 px-4 text-right">补发 Token 数量</th>
                  <th className="py-3 px-4">补发事由说明</th>
                  <th className="py-3 px-4">经办人</th>
                  <th className="py-3 px-4">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {compensations.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{c.id}</td>
                    <td className="py-3 px-4 font-bold">{c.studentName}</td>
                    <td className="py-3 px-4">{c.institutionName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#16B45B] text-[14px]">
                      +{c.tokenAmount.toLocaleString()} Token
                    </td>
                    <td className="py-3 px-4 text-[12px] text-[#64748B]">{c.reason}</td>
                    <td className="py-3 px-4 font-bold">{c.operatorName}</td>
                    <td className="py-3 px-4 text-[12px] text-[#94A3B8]">{c.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Master Data */}
      {activeTab === 'masterData' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3">
            <h3 className="text-[15px] font-bold text-[#0F172A]">全平台学科主数据</h3>
            <div className="flex flex-wrap gap-2 text-[12px]">
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold">数学</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold">物理</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold">化学</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold">生物</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold">英语</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold">语文</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3">
            <h3 className="text-[15px] font-bold text-[#0F172A]">适用学段与年级</h3>
            <div className="flex flex-wrap gap-2 text-[12px]">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold">初一</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold">初二</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold">初三</span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">高一</span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">高二</span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">高三</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3">
            <h3 className="text-[15px] font-bold text-[#0F172A]">权威教材版本规范</h3>
            <div className="flex flex-wrap gap-2 text-[12px]">
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold">人教版 (PEP)</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold">浙教版</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold">苏教版</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold">北师大版</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'auditLogs' && <AuditLogView logs={auditLogs} />}

      {/* Tab 5: Exception Reversal */}
      {activeTab === 'exceptionReversal' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
          <h3 className="text-[16px] font-bold text-[#0F172A]">异常冲正与退款纠错追溯</h3>
          <p className="text-[12.5px] text-[#64748B]">
            遵循 PRD 规范，所有错充点数或误扣减交易均禁止直接擦除原记录。系统必须通过“逆向冲正订单”进行平账追溯。
          </p>

          <div className="border border-red-200 bg-red-50/50 p-4 rounded-xl text-[12.5px] text-red-700 space-y-1">
            <div className="font-bold">冲正安全提示：</div>
            <div>发起冲正后将自动扣减/退回对应机构采购点数，并联动产生不可更改的负向充值流水凭证。</div>
          </div>
        </div>
      )}

      {/* Compensation Modal */}
      {isCompModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3 mb-4">补发非付费 Token 额度</h3>
            <form onSubmit={handleSaveCompensation} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">受补学生姓名</label>
                <input
                  type="text"
                  required
                  value={compForm.studentName}
                  onChange={(e) => setCompForm({ ...compForm, studentName: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">所属机构</label>
                <input
                  type="text"
                  required
                  value={compForm.institutionName}
                  onChange={(e) => setCompForm({ ...compForm, institutionName: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">补偿 Token 数量</label>
                <input
                  type="number"
                  required
                  value={compForm.tokenAmount}
                  onChange={(e) => setCompForm({ ...compForm, tokenAmount: Number(e.target.value) })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">补发事由</label>
                <textarea
                  rows={2}
                  required
                  value={compForm.reason}
                  onChange={(e) => setCompForm({ ...compForm, reason: e.target.value })}
                  placeholder="如：线上答疑超时中断补发算力"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E]"
                >
                  确认发放到账号
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Model Modal */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3 mb-4">新增 AI 模型映射</h3>
            <form onSubmit={handleSaveModel} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">模型名称</label>
                <input
                  type="text"
                  required
                  value={modelForm.name}
                  onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                  placeholder="如：Gemini 1.5 Pro"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">能力类型</label>
                  <select
                    value={modelForm.capability}
                    onChange={(e) => setModelForm({ ...modelForm, capability: e.target.value as any })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                  >
                    <option value="文本解析">文本解析</option>
                    <option value="多模态识图">多模态识图</option>
                    <option value="语音合成">语音合成</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">换算系数倍率</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={modelForm.tokenMultiplier}
                    onChange={(e) => setModelForm({ ...modelForm, tokenMultiplier: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E]"
                >
                  保存配置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
