import React, { useState } from 'react';
import { AuditLogItem, AiModelConfig, FulfillmentWorkItem, AiUsageCompensation } from '../../types';
import { AuditLogView } from './AuditLogView';
import { canDeleteKnowledgeType, defaultKnowledgeTypes } from '../../utils/knowledgeTypeRegistry';

interface SystemViewProps {
  auditLogs: AuditLogItem[];
  mode: 'exceptions' | 'settings';
  workItems?: FulfillmentWorkItem[];
  onResolveWorkItem?: (id: string, resolution: string) => void;
  onNotify?: (message: string, tone?: 'success' | 'warning' | 'error') => void;
}

const initialAiModels: AiModelConfig[] = [
  { id: 'MOD-01', name: 'Gemini 1.5 Flash (推理高响应)', provider: 'Google AI Studio', capability: '文本解析', usageMultiplier: 1.0, isDefault: true, status: 'active', updatedAt: '2026-08-01' },
  { id: 'MOD-02', name: 'Gemini 1.5 Pro (深度学习分析)', provider: 'Google AI Studio', capability: '多模态识图', usageMultiplier: 1.5, isDefault: false, status: 'active', updatedAt: '2026-08-01' },
  { id: 'MOD-03', name: 'TTS 智能提问与口语练习', provider: 'Native Audio Synthesizer', capability: '语音合成', usageMultiplier: 2.0, isDefault: false, status: 'active', updatedAt: '2026-07-20' },
];

const initialCompensations: AiUsageCompensation[] = [
  { id: 'COMP-101', studentId: 'STU-001', studentName: '张伟强', institutionName: '浙江大学附属中学', usageAmount: 50000, reason: '7月30日线上网络超时导致题目AI诊断中断补偿', operatorName: '超级管理员', timestamp: '2026-07-31 10:00' },
  { id: 'COMP-102', studentId: 'STU-003', studentName: '李思思', institutionName: '上海青葱教育培训中心', usageAmount: 100000, reason: '活动特邀体验学员非付费算力补充', operatorName: '超级管理员', timestamp: '2026-08-02 14:30' },
];

type SystemTab = 'aiRules' | 'masterData' | 'compensation' | 'auditLogs' | 'exceptionReversal';

export const SystemView: React.FC<SystemViewProps> = ({ auditLogs, mode, workItems = [], onResolveWorkItem, onNotify }) => {
  const [activeTab, setActiveTab] = useState<SystemTab>(mode === 'settings' ? 'aiRules' : 'compensation');
  const tabs: { id: SystemTab; label: string }[] = mode === 'settings'
    ? [
        { id: 'aiRules', label: 'AI 模型' },
        { id: 'masterData', label: '基础数据' },
        { id: 'auditLogs', label: '操作审计' },
        { id: 'exceptionReversal', label: '异常处理' },
      ]
    : [
        { id: 'compensation', label: '额度补发' },
        { id: 'exceptionReversal', label: '异常处理' },
      ];

  // AI Models State
  const [aiModels, setAiModels] = useState<AiModelConfig[]>(initialAiModels);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [modelForm, setModelForm] = useState({
    name: '',
    provider: 'Google AI Studio',
    capability: '文本解析' as '文本解析' | '多模态识图' | '语音合成',
    usageMultiplier: 1.0,
  });

  // AI usage compensation state
  const [compensations, setCompensations] = useState<AiUsageCompensation[]>(initialCompensations);
  const [knowledgeTypes, setKnowledgeTypes] = useState(defaultKnowledgeTypes);
  const [newKnowledgeTypeName, setNewKnowledgeTypeName] = useState('');
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [compForm, setCompForm] = useState({
    studentId: 'STU-001',
    studentName: '张伟强',
    institutionName: '浙江大学附属中学',
    usageAmount: 50000,
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
      usageMultiplier: Number(modelForm.usageMultiplier),
      isDefault: false,
      status: 'active',
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setAiModels((prev) => [...prev, newM]);
    setIsModelModalOpen(false);
  };

  const handleSaveCompensation = (e: React.FormEvent) => {
    e.preventDefault();
    const newC: AiUsageCompensation = {
      id: `COMP-${Date.now().toString().slice(-3)}`,
      studentId: compForm.studentId,
      studentName: compForm.studentName,
      institutionName: compForm.institutionName,
      usageAmount: Number(compForm.usageAmount),
      reason: compForm.reason || '运营补发 AI 用量',
      operatorName: '超级管理员',
      timestamp: new Date().toLocaleString().slice(0, 16),
    };
    setCompensations((prev) => [newC, ...prev]);
    setIsCompModalOpen(false);
    onNotify?.(`已向学生【${compForm.studentName}】补发 ${Number(compForm.usageAmount).toLocaleString('zh-CN')} AI 用量`);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[12px] font-medium text-[#0E7D3E]">{mode === 'settings' ? '系统与基础配置' : '商业履约 · 问题闭环'}</p>
        <h2 className="mt-1 text-[24px] font-semibold tracking-tight text-[#0F172A]">
          {mode === 'settings' ? '平台设置' : '售后与异常'}
        </h2>
        <p className="mt-1 text-[12px] text-[#64748B]">{mode === 'settings' ? '管理 AI 模型、基础数据和学生加油包。' : '处理会影响开通、续费和退款的履约待办，并留下审计记录。'}</p>
      </div>

      {mode === 'exceptions' && (
        <section className="overflow-hidden rounded-xl border border-[#DDE7E1] bg-white">
          <div className="flex items-center justify-between border-b border-[#EEF2F0] px-5 py-4">
            <div><h3 className="text-[14px] font-bold text-[#0F172A]">履约待办</h3><p className="mt-0.5 text-[11px] text-[#94A3B8]">处理后会同步更新驾驶舱和审计动态</p></div>
            <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[10px] font-semibold text-[#B45309]">{workItems.length} 项待处理</span>
          </div>
          {workItems.length === 0 ? (
            <div className="px-5 py-10 text-center text-[12px] text-[#94A3B8]">当前没有未处理的商业履约异常</div>
          ) : (
            <div className="divide-y divide-[#EEF2F0]">
              {workItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.severity === 'high' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} />
                  <div className="min-w-0 flex-1"><p className="text-[12.5px] font-semibold text-[#0F172A]">{item.title} · {item.institutionName}</p><p className="mt-1 text-[11px] text-[#64748B]">{item.description}</p></div>
                  <button type="button" onClick={() => onResolveWorkItem?.(item.id, item.type === 'low_credit' ? '已联系机构并发起续费' : '已通知责任教师跟进激活')} className="rounded-lg bg-[#0E7D3E] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#0B6A35]">标记已处理</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-6 text-[13.5px] font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2 transition-colors cursor-pointer ${
              activeTab === tab.id ? 'text-[#0E7D3E] border-b-2 border-[#0E7D3E]' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.label}{tab.id === 'compensation' ? ` (${compensations.length})` : ''}
          </button>
        ))}
      </div>

      {/* AI model usage rules */}
      {activeTab === 'aiRules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E2E8F0]">
            <span className="text-[13px] text-[#64748B]">
              针对不同 AI 模型与请求能力类型配置全局 AI 用量倍率
            </span>
            <button
              onClick={() => {
                setModelForm({ name: '', provider: 'Google AI Studio', capability: '文本解析', usageMultiplier: 1.0 });
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
                  <th className="py-3 px-4 text-center">AI 用量倍率</th>
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
                      {m.usageMultiplier}x
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

      {/* Non-paid AI usage compensation */}
      {activeTab === 'compensation' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E2E8F0]">
            <span className="text-[13px] text-[#64748B]">
              针对技术网络故障、退款纠纷或特邀体验，向指定学生补发非付费 AI 用量
            </span>
            <button
              onClick={() => setIsCompModalOpen(true)}
              className="bg-[#16B45B] text-white px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold flex items-center gap-1 shadow-xs hover:bg-[#139B4E] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              补发 AI 用量
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <tr>
                  <th className="py-3 px-4">补偿编号</th>
                  <th className="py-3 px-4">受补学生</th>
                  <th className="py-3 px-4">所属机构</th>
                  <th className="py-3 px-4 text-right">补发 AI 用量</th>
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
                      +{c.usageAmount.toLocaleString()} AI 用量
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[['学科', '数学、语文、英语、物理、化学、生物'], ['学段与年级', '小学、初中、高中'], ['教材版本', '人教版、浙教版、苏教版、北师大版']].map(([title, value]) => (
              <div key={title} className="rounded-xl border border-[#E2E8F0] bg-white p-4"><p className="text-[12px] text-[#64748B]">{title}</p><p className="mt-2 text-[13px] font-medium text-[#0F172A]">{value}</p></div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
              <div><h3 className="text-[15px] font-semibold text-[#0F172A]">知识类型</h3><p className="mt-1 text-[12px] text-[#64748B]">内容中心和导入模板统一使用这里启用的类型</p></div>
              <div className="flex gap-2"><input value={newKnowledgeTypeName} onChange={(event) => setNewKnowledgeTypeName(event.target.value)} placeholder="输入新类型名称" className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-[12px] outline-none focus:border-[#0E7D3E]" /><button disabled={!newKnowledgeTypeName.trim()} onClick={() => { const name = newKnowledgeTypeName.trim(); if (!name) return; setKnowledgeTypes((items) => [...items, { id: `KT-${Date.now()}`, name, applicableSubjects: '全学科', status: 'active', usageCount: 0 }]); setNewKnowledgeTypeName(''); }} className="rounded-lg bg-[#0E7D3E] px-4 py-2 text-[12px] font-semibold text-white disabled:bg-[#CBD5E1]">新增类型</button></div>
            </div>
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-4 py-3">类型名称</th><th className="px-4 py-3">适用学科</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">使用知识点</th><th className="px-4 py-3 text-right">操作</th></tr></thead>
              <tbody className="divide-y divide-[#EEF2F6]">
                {knowledgeTypes.map((item) => (
                  <tr key={item.id}><td className="px-4 py-3.5 font-medium text-[#0F172A]">{item.name}</td><td className="px-4 py-3.5 text-[#64748B]">{item.applicableSubjects}</td><td className={`px-4 py-3.5 ${item.status === 'active' ? 'text-[#0E7D3E]' : 'text-[#94A3B8]'}`}>{item.status === 'active' ? '已启用' : '已停用'}</td><td className="px-4 py-3.5 tabular-nums">{item.usageCount}</td><td className="px-4 py-3.5 text-right"><button onClick={() => setKnowledgeTypes((items) => items.map((type) => type.id === item.id ? { ...type, status: type.status === 'active' ? 'inactive' : 'active' } : type))} className="mr-4 font-medium text-[#0E7D3E]">{item.status === 'active' ? '停用' : '启用'}</button><button disabled={!canDeleteKnowledgeType(item)} onClick={() => setKnowledgeTypes((items) => items.filter((type) => type.id !== item.id))} title={canDeleteKnowledgeType(item) ? '删除' : '已被知识点使用，只能停用'} className="font-medium text-[#DC2626] disabled:cursor-not-allowed disabled:text-[#CBD5E1]">删除</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'auditLogs' && <AuditLogView logs={auditLogs} />}

      {/* Tab 5: Exception Reversal */}
      {activeTab === 'exceptionReversal' && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-10 text-center">
          <span className="material-symbols-outlined text-[34px] text-[#94A3B8]">rule</span>
          <h3 className="mt-2 text-[15px] font-semibold text-[#0F172A]">异常处理</h3>
          <p className="mx-auto mt-2 max-w-xl text-[12px] leading-5 text-[#64748B]">正常订单退款请在“商品与权益 → 学生加油包订单”直接处理。这里仅承接已使用、支付差错等需要人工审核的异常事项。</p>
        </div>
      )}

      {/* Compensation Modal */}
      {isCompModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3 mb-4">补发非付费 AI 用量</h3>
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
                <label className="block text-[12px] font-bold text-[#475569] mb-1">补偿 AI 用量</label>
                <input
                  type="number"
                  required
                  value={compForm.usageAmount}
                  onChange={(e) => setCompForm({ ...compForm, usageAmount: Number(e.target.value) })}
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
                    value={modelForm.usageMultiplier}
                    onChange={(e) => setModelForm({ ...modelForm, usageMultiplier: Number(e.target.value) })}
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
