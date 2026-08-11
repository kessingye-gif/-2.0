import React, { useState } from 'react';
import { useMasterData } from '../../masterData/MasterDataContext';
import type { AnyMasterData, MasterDataEntity } from '../../masterData/types';

const entityLabels: Record<MasterDataEntity, string> = { stages: '学段', grades: '年级', subjects: '学科', textbooks: '教材版本', knowledgeTypes: '知识类型' };

export const MasterDataManager: React.FC = () => {
  const { state, activeStages, addItem, updateItem, toggleStatus } = useMasterData();
  const [entity, setEntity] = useState<MasterDataEntity>('stages');
  const [editing, setEditing] = useState<AnyMasterData | null>(null);
  const [form, setForm] = useState({ name: '', code: '', sortOrder: 1, stageId: '', stageIds: [] as string[] });
  const [error, setError] = useState('');
  const items = state[entity] as AnyMasterData[];

  const resetForm = () => { setEditing(null); setError(''); setForm({ name: '', code: '', sortOrder: items.length + 1, stageId: '', stageIds: [] }); };
  const openEdit = (item: AnyMasterData) => { setEditing(item); setError(''); setForm({ name: item.name, code: item.code, sortOrder: item.sortOrder, stageId: 'stageId' in item ? item.stageId : '', stageIds: 'stageIds' in item ? item.stageIds : [] }); };
  const save = () => {
    if (!form.name.trim() || !form.code.trim()) return setError('名称和编码不能为空');
    if (entity === 'grades' && !form.stageId) return setError('年级必须关联学段');
    const base = { id: editing?.id || `${entity.toUpperCase()}-${Date.now()}`, name: form.name.trim(), code: form.code.trim().toUpperCase(), sortOrder: Number(form.sortOrder), status: editing?.status || 'active' as const };
    const item: AnyMasterData = entity === 'grades' ? { ...base, stageId: form.stageId } : entity === 'subjects' || entity === 'textbooks' ? { ...base, stageIds: form.stageIds } : entity === 'knowledgeTypes' ? { ...base, applicableSubjectIds: [], usageCount: editing && 'usageCount' in editing ? editing.usageCount : 0 } : base;
    const result = editing ? updateItem(entity, editing.id, item) : addItem(entity, item);
    if (result) return setError(result);
    resetForm();
  };

  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2">{(Object.keys(entityLabels) as MasterDataEntity[]).map((key) => <button key={key} onClick={() => { setEntity(key); setEditing(null); setError(''); }} className={`rounded-lg px-3 py-2 text-[12px] font-semibold ${entity === key ? 'bg-[#0E7D3E] text-white' : 'border border-[#E2E8F0] bg-white text-[#475569]'}`}>{entityLabels[key]} ({state[key].length})</button>)}</div>
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white"><div className="border-b border-[#E2E8F0] px-5 py-4"><h3 className="text-[15px] font-semibold">{entityLabels[entity]}基础数据</h3><p className="mt-1 text-[12px] text-[#64748B]">系统设置修改后，全平台新建和编辑表单立即使用。</p></div><table className="w-full text-left text-[13px]"><thead className="bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-4 py-3">名称</th><th className="px-4 py-3">编码</th><th className="px-4 py-3">关联范围</th><th className="px-4 py-3">排序</th><th className="px-4 py-3">状态</th><th className="px-4 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-[#EEF2F6]">{items.map((item) => <tr key={item.id}><td className="px-4 py-3.5 font-medium">{item.name}</td><td className="px-4 py-3.5 font-mono text-[12px]">{item.code}</td><td className="px-4 py-3.5 text-[#64748B]">{'stageId' in item ? state.stages.find((stage) => stage.id === item.stageId)?.name : 'stageIds' in item ? (item.stageIds.length ? item.stageIds.map((id) => state.stages.find((stage) => stage.id === id)?.name).join('、') : '全部学段') : '全局'}</td><td className="px-4 py-3.5">{item.sortOrder}</td><td className={`px-4 py-3.5 ${item.status === 'active' ? 'text-[#0E7D3E]' : 'text-[#94A3B8]'}`}>{item.status === 'active' ? '已启用' : '已停用'}</td><td className="px-4 py-3.5 text-right"><button onClick={() => openEdit(item)} className="mr-4 font-medium text-[#2563EB]">编辑</button><button onClick={() => toggleStatus(entity, item.id)} className="font-medium text-[#0E7D3E]">{item.status === 'active' ? '停用' : '启用'}</button></td></tr>)}</tbody></table></div>
      <div className="h-fit rounded-xl border border-[#E2E8F0] bg-white p-5"><h3 className="text-[15px] font-semibold">{editing ? `编辑${entityLabels[entity]}` : `新增${entityLabels[entity]}`}</h3><div className="mt-4 space-y-3"><label className="block text-[12px] font-semibold">名称<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" /></label><label className="block text-[12px] font-semibold">编码<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 font-mono" /></label><label className="block text-[12px] font-semibold">排序<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" /></label>{entity === 'grades' && <label className="block text-[12px] font-semibold">所属学段<select value={form.stageId} onChange={(event) => setForm({ ...form, stageId: event.target.value })} className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2"><option value="">请选择学段</option>{activeStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>}{(entity === 'subjects' || entity === 'textbooks') && <fieldset><legend className="text-[12px] font-semibold">适用学段（不选表示全部）</legend><div className="mt-2 flex flex-wrap gap-2">{activeStages.map((stage) => <label key={stage.id} className="flex items-center gap-1 text-[12px]"><input type="checkbox" checked={form.stageIds.includes(stage.id)} onChange={(event) => setForm({ ...form, stageIds: event.target.checked ? [...form.stageIds, stage.id] : form.stageIds.filter((id) => id !== stage.id) })} />{stage.name}</label>)}</div></fieldset>}{error && <p className="text-[12px] font-medium text-[#DC2626]">{error}</p>}<div className="flex gap-2 pt-2"><button onClick={save} className="flex-1 rounded-lg bg-[#0E7D3E] px-4 py-2 text-[12px] font-semibold text-white">保存</button>{editing && <button onClick={resetForm} className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-[12px]">取消</button>}</div></div></div>
    </div>
  </div>;
};
