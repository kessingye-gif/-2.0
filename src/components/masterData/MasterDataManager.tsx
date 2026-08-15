import React, { useState } from 'react';
import { useMasterData } from '../../masterData/MasterDataContext';
import type { AnyMasterData, MasterDataEntity } from '../../masterData/types';

const entityLabels: Record<MasterDataEntity, string> = { stages: '学段', grades: '年级', subjects: '学科', textbooks: '教材版本', knowledgeTypes: '知识类型' };

interface AdminAccount {
  id: string;
  name: string;
  username: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const initialAdminAccounts: AdminAccount[] = [
  { id: 'ADM-001', name: '超级管理员', username: 'admin@kaiqiao.com', phone: '138****0001', status: 'active', createdAt: '2026-07-01' },
];

const AdminAccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<AdminAccount[]>(initialAdminAccounts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', username: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const resetForm = () => { setEditingId(null); setForm({ name: '', username: '', phone: '', password: '' }); setError(''); };
  const save = () => {
    if (!form.name.trim() || !form.username.trim() || !form.phone.trim()) return setError('请填写管理员姓名、登录账号和手机号');
    if (!editingId && !form.password.trim()) return setError('请设置初始密码');
    if (accounts.some((item) => item.username === form.username.trim() && item.id !== editingId)) return setError('登录账号已存在，请更换');
    if (editingId) {
      setAccounts((current) => current.map((item) => item.id === editingId ? { ...item, name: form.name.trim(), username: form.username.trim(), phone: form.phone.trim() } : item));
    } else {
      setAccounts((current) => [{ id: `ADM-${Date.now().toString().slice(-6)}`, name: form.name.trim(), username: form.username.trim(), phone: form.phone.trim(), status: 'active', createdAt: new Date().toISOString().slice(0, 10) }, ...current]);
    }
    resetForm();
  };
  const openEdit = (account: AdminAccount) => { setEditingId(account.id); setForm({ name: account.name, username: account.username, phone: account.phone, password: '' }); setError(''); };

  return <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
    <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
      <div className="border-b border-[#E2E8F0] px-5 py-4"><h3 className="text-[15px] font-semibold">管理员账号</h3><p className="mt-1 text-[12px] text-[#64748B]">管理平台管理员的登录账号与启用状态。</p></div>
      <table className="w-full text-left text-[13px]"><thead className="bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-4 py-3">管理员</th><th className="px-4 py-3">登录账号</th><th className="px-4 py-3">手机号</th><th className="px-4 py-3">创建时间</th><th className="px-4 py-3">状态</th><th className="px-4 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-[#EEF2F6]">{accounts.map((account) => <tr key={account.id}><td className="px-4 py-3.5 font-medium">{account.name}</td><td className="px-4 py-3.5 font-mono text-[12px]">{account.username}</td><td className="px-4 py-3.5 text-[#64748B]">{account.phone}</td><td className="px-4 py-3.5 text-[#64748B]">{account.createdAt}</td><td className={`px-4 py-3.5 ${account.status === 'active' ? 'text-[#0E7D3E]' : 'text-[#94A3B8]'}`}>{account.status === 'active' ? '已启用' : '已停用'}</td><td className="px-4 py-3.5 text-right"><button onClick={() => openEdit(account)} className="mr-4 font-medium text-[#2563EB]">编辑</button><button onClick={() => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' } : item))} className="font-medium text-[#0E7D3E]">{account.status === 'active' ? '停用' : '启用'}</button></td></tr>)}</tbody></table>
    </div>
    <div className="h-fit rounded-xl border border-[#E2E8F0] bg-white p-5"><h3 className="text-[15px] font-semibold">{editingId ? '编辑管理员账号' : '新增管理员账号'}</h3><div className="mt-4 space-y-3"><label className="block text-[12px] font-semibold">管理员姓名<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="如：张管理员" className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" /></label><label className="block text-[12px] font-semibold">登录账号<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="如：admin@kaiqiao.com" className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" /></label><label className="block text-[12px] font-semibold">手机号<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="用于账号验证" className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" /></label><label className="block text-[12px] font-semibold">{editingId ? '重置密码（可选）' : '初始密码'}<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editingId ? '不填写则不修改' : '请设置初始密码'} className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" /></label>{error && <p className="text-[12px] font-medium text-[#DC2626]">{error}</p>}<div className="flex gap-2 pt-2"><button onClick={save} className="flex-1 rounded-lg bg-[#0E7D3E] px-4 py-2 text-[12px] font-semibold text-white">{editingId ? '保存修改' : '新增管理员'}</button>{editingId && <button onClick={resetForm} className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-[12px]">取消</button>}</div></div></div>
  </div>;
};

export const MasterDataManager: React.FC = () => {
  const { state, activeStages, addItem, updateItem, toggleStatus } = useMasterData();
  const [entity, setEntity] = useState<MasterDataEntity>('stages');
  const [isAdminAccounts, setIsAdminAccounts] = useState(false);
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
    <div className="flex flex-wrap gap-2">{(Object.keys(entityLabels) as MasterDataEntity[]).map((key) => <button key={key} onClick={() => { setEntity(key); setIsAdminAccounts(false); setEditing(null); setError(''); }} className={`rounded-lg px-3 py-2 text-[12px] font-semibold ${!isAdminAccounts && entity === key ? 'bg-[#0E7D3E] text-white' : 'border border-[#E2E8F0] bg-white text-[#475569]'}`}>{entityLabels[key]} ({state[key].length})</button>)}<button onClick={() => { setIsAdminAccounts(true); setEditing(null); setError(''); }} className={`rounded-lg px-3 py-2 text-[12px] font-semibold ${isAdminAccounts ? 'bg-[#0E7D3E] text-white' : 'border border-[#E2E8F0] bg-white text-[#475569]'}`}>管理员账号</button></div>
    {isAdminAccounts ? <AdminAccountManager /> : <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white"><div className="border-b border-[#E2E8F0] px-5 py-4"><h3 className="text-[15px] font-semibold">{entityLabels[entity]}基础数据</h3><p className="mt-1 text-[12px] text-[#64748B]">系统设置修改后，全平台新建和编辑表单立即使用。</p></div><table className="w-full text-left text-[13px]"><thead className="bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-4 py-3">名称</th><th className="px-4 py-3">编码</th><th className="px-4 py-3">关联范围</th><th className="px-4 py-3">排序</th><th className="px-4 py-3">状态</th><th className="px-4 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-[#EEF2F6]">{items.map((item) => <tr key={item.id}><td className="px-4 py-3.5 font-medium">{item.name}</td><td className="px-4 py-3.5 font-mono text-[12px]">{item.code}</td><td className="px-4 py-3.5 text-[#64748B]">{'stageId' in item ? state.stages.find((stage) => stage.id === item.stageId)?.name : 'stageIds' in item ? (item.stageIds.length ? item.stageIds.map((id) => state.stages.find((stage) => stage.id === id)?.name).join('、') : '全部学段') : '全局'}</td><td className="px-4 py-3.5">{item.sortOrder}</td><td className={`px-4 py-3.5 ${item.status === 'active' ? 'text-[#0E7D3E]' : 'text-[#94A3B8]'}`}>{item.status === 'active' ? '已启用' : '已停用'}</td><td className="px-4 py-3.5 text-right"><button onClick={() => openEdit(item)} className="mr-4 font-medium text-[#2563EB]">编辑</button><button onClick={() => toggleStatus(entity, item.id)} className="font-medium text-[#0E7D3E]">{item.status === 'active' ? '停用' : '启用'}</button></td></tr>)}</tbody></table></div>
      <div className="h-fit rounded-xl border border-[#E2E8F0] bg-white p-5"><h3 className="text-[15px] font-semibold">{editing ? `编辑${entityLabels[entity]}` : `新增${entityLabels[entity]}`}</h3><div className="mt-4 space-y-3"><label className="block text-[12px] font-semibold">名称<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" /></label><label className="block text-[12px] font-semibold">编码<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 font-mono" /></label><label className="block text-[12px] font-semibold">排序<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" /></label>{entity === 'grades' && <label className="block text-[12px] font-semibold">所属学段<select value={form.stageId} onChange={(event) => setForm({ ...form, stageId: event.target.value })} className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2"><option value="">请选择学段</option>{activeStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>}{(entity === 'subjects' || entity === 'textbooks') && <fieldset><legend className="text-[12px] font-semibold">适用学段（不选表示全部）</legend><div className="mt-2 flex flex-wrap gap-2">{activeStages.map((stage) => <label key={stage.id} className="flex items-center gap-1 text-[12px]"><input type="checkbox" checked={form.stageIds.includes(stage.id)} onChange={(event) => setForm({ ...form, stageIds: event.target.checked ? [...form.stageIds, stage.id] : form.stageIds.filter((id) => id !== stage.id) })} />{stage.name}</label>)}</div></fieldset>}{error && <p className="text-[12px] font-medium text-[#DC2626]">{error}</p>}<div className="flex gap-2 pt-2"><button onClick={save} className="flex-1 rounded-lg bg-[#0E7D3E] px-4 py-2 text-[12px] font-semibold text-white">保存</button>{editing && <button onClick={resetForm} className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-[12px]">取消</button>}</div></div></div>
    </div>}
  </div>;
};
