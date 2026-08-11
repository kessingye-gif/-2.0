import React, { useMemo, useState } from 'react';

export interface ContentSubjectSummary {
  id: string;
  name: string;
  stage: string;
  textbook: string;
  kpCount: number;
  questionCount: number;
}

interface ContentPackageRecord {
  id: string;
  code: string;
  name: string;
  subjectId: string;
  status: 'draft' | 'active' | 'inactive';
  kpCount: number;
  questionCount: number;
  institutionCount: number;
  updatedAt: string;
  description: string;
}

export interface ContentPackageDraft {
  name: string;
  subjectId: string;
  kpCount: number;
  questionCount: number;
}

export const validateContentPackageDraft = (draft: ContentPackageDraft) => {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push('请填写内容包名称');
  if (!draft.subjectId) errors.push('请选择学科');
  if (draft.kpCount < 1 && draft.questionCount < 1) errors.push('请选择至少一个知识点或一道题目');
  return errors;
};

const seedPackages: ContentPackageRecord[] = [
  { id: 'CP-01', code: 'CP-MATH-CZ', name: '人教版初中数学全套内容包', subjectId: 'SUB-01', status: 'active', kpCount: 156, questionCount: 1280, institutionCount: 4, updatedAt: '2026-08-08 16:20', description: '引用初中数学下已发布的知识点与题目' },
  { id: 'CP-02', code: 'CP-PHYS-CZ', name: '人教版初中物理精选内容包', subjectId: 'SUB-02', status: 'active', kpCount: 98, questionCount: 840, institutionCount: 3, updatedAt: '2026-08-07 11:10', description: '引用初中物理下已发布的知识点与题目' },
  { id: 'CP-03', code: 'CP-CHEM-CZ', name: '人教版初中化学核心内容包', subjectId: 'SUB-03', status: 'active', kpCount: 75, questionCount: 620, institutionCount: 2, updatedAt: '2026-08-06 09:45', description: '引用初中化学下已发布的知识点与题目' },
  { id: 'CP-04', code: 'CP-MATH-GZ', name: '人教版高中数学必修与选择性必修包', subjectId: 'SUB-06', status: 'active', kpCount: 210, questionCount: 1850, institutionCount: 1, updatedAt: '2026-08-05 18:30', description: '引用高中数学下已发布的知识点与题目' },
  { id: 'CP-05', code: 'CP-ENG-CZ', name: '初中英语词汇与阅读专项包', subjectId: 'SUB-04', status: 'inactive', kpCount: 110, questionCount: 950, institutionCount: 0, updatedAt: '2026-08-03 14:00', description: '引用初中英语下已发布的知识点与题目' },
];

interface ContentPackageManagerProps {
  subjects: ContentSubjectSummary[];
  onOpenResource: (resource: 'knowledge-points' | 'questions', subjectId: string) => void;
}

type PackageWizardStep = 'basics' | 'content' | 'review';

const statusLabel = { draft: '草稿', active: '已发布', inactive: '已停用' } as const;

export const ContentPackageManager: React.FC<ContentPackageManagerProps> = ({ subjects, onOpenResource }) => {
  const [packages, setPackages] = useState(seedPackages);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [selected, setSelected] = useState<ContentPackageRecord | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<PackageWizardStep>('basics');
  const [draft, setDraft] = useState<ContentPackageDraft>({ name: '', subjectId: subjects[0]?.id ?? '', kpCount: 0, questionCount: 0 });

  const subjectById = (id: string) => subjects.find((item) => item.id === id);
  const filtered = useMemo(() => packages.filter((pkg) => {
    const subject = subjectById(pkg.subjectId);
    return (!search || `${pkg.name}${pkg.code}`.toLowerCase().includes(search.toLowerCase())) && (!stage || subject?.stage === stage);
  }), [packages, search, stage, subjects]);

  const openWizard = () => {
    setDraft({ name: '', subjectId: subjects[0]?.id ?? '', kpCount: 0, questionCount: 0 });
    setStep('basics');
    setWizardOpen(true);
  };

  const publish = (status: 'draft' | 'active') => {
    const subject = subjectById(draft.subjectId);
    if (!subject || (status === 'active' && validateContentPackageDraft(draft).length)) return;
    setPackages((current) => [{
      id: `CP-${Date.now().toString().slice(-5)}`,
      code: `CP-${subject.id.replace('SUB-', '')}-${Date.now().toString().slice(-3)}`,
      name: draft.name || `${subject.name}内容包草稿`,
      subjectId: subject.id,
      status,
      kpCount: draft.kpCount,
      questionCount: draft.questionCount,
      institutionCount: 0,
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16),
      description: `引用${subject.name}下已发布的知识点与题目`,
    }, ...current]);
    setWizardOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[12px] font-medium text-[#0E7D3E]">内容资产 · 内容包</p>
          <h2 className="mt-1 text-[20px] font-bold text-[#0F172A]">内容包</h2>
          <p className="mt-1 text-[12px] text-[#64748B]">把已发布的知识点和题目组装成可单独授权给机构的内容资产。</p>
        </div>
        <button type="button" onClick={openWizard} className="flex items-center justify-center gap-1 rounded-xl bg-[#16B45B] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#139B4E] cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">add</span>新增内容包
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
        <div className="relative min-w-[260px] flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2 text-[18px] text-[#94A3B8]">search</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索内容包名称或代码" className="w-full rounded-xl border border-[#E2E8F0] py-2 pl-9 pr-3 text-[13px] outline-none focus:border-[#16B45B]" />
        </div>
        <select value={stage} onChange={(event) => setStage(event.target.value)} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-[13px] font-bold outline-none">
          <option value="">全部学段</option><option value="初中">初中</option><option value="高中">高中</option>
        </select>
        <span className="text-[12px] text-[#64748B]">共 <strong className="text-[#0F172A]">{filtered.length}</strong> 个内容包</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-4 py-3">内容包</th><th className="px-4 py-3">内容来源</th><th className="px-4 py-3 text-center">知识点</th><th className="px-4 py-3 text-center">题目</th><th className="px-4 py-3 text-center">授权机构</th><th className="px-4 py-3 text-center">状态</th><th className="px-4 py-3 text-right">操作</th></tr></thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filtered.map((pkg) => {
                const subject = subjectById(pkg.subjectId);
                return <tr key={pkg.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3"><button type="button" onClick={() => setSelected(pkg)} className="text-left cursor-pointer"><span className="block font-bold text-[#0F172A]">{pkg.name}</span><span className="font-mono text-[11px] text-[#94A3B8]">{pkg.code}</span></button></td>
                  <td className="px-4 py-3"><span className="block font-bold text-[#334155]">{subject?.name}</span><span className="text-[11px] text-[#94A3B8]">{subject?.stage} · {subject?.textbook}</span></td>
                  <td className="px-4 py-3 text-center"><button type="button" onClick={() => onOpenResource('knowledge-points', pkg.subjectId)} className="font-mono font-bold text-[#0E7D3E] hover:underline cursor-pointer">{pkg.kpCount}</button></td>
                  <td className="px-4 py-3 text-center"><button type="button" onClick={() => onOpenResource('questions', pkg.subjectId)} className="font-mono font-bold text-[#0E7D3E] hover:underline cursor-pointer">{pkg.questionCount}</button></td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-[#334155]">{pkg.institutionCount}</td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${pkg.status === 'active' ? 'bg-[#E8F7EE] text-[#0E7D3E]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{statusLabel[pkg.status]}</span></td>
                  <td className="px-4 py-3 text-right"><button type="button" onClick={() => setSelected(pkg)} className="font-bold text-[#16B45B] hover:underline cursor-pointer">查看详情</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={() => setSelected(null)}>
        <aside className="h-full w-full max-w-[520px] overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4"><div><p className="text-[11px] font-bold text-[#0E7D3E]">内容包详情</p><h3 className="mt-1 text-[19px] font-bold text-[#0F172A]">{selected.name}</h3><p className="mt-1 font-mono text-[11px] text-[#94A3B8]">{selected.code}</p></div><button type="button" onClick={() => setSelected(null)} className="cursor-pointer text-[#64748B]"><span className="material-symbols-outlined">close</span></button></div>
          <div className="mt-5 grid grid-cols-2 gap-3">{[['学科', subjectById(selected.subjectId)?.name], ['学段与版本', `${subjectById(selected.subjectId)?.stage} · ${subjectById(selected.subjectId)?.textbook}`], ['授权机构', `${selected.institutionCount} 家`], ['最近更新', selected.updatedAt]].map(([label, value]) => <div key={label} className="rounded-xl bg-[#F8FAFC] p-3"><span className="text-[11px] text-[#64748B]">{label}</span><strong className="mt-1 block text-[13px] text-[#0F172A]">{value}</strong></div>)}</div>
          <div className="mt-5 rounded-xl border border-[#E2E8F0] p-4"><h4 className="font-bold text-[#0F172A]">内容范围</h4><p className="mt-1 text-[12px] text-[#64748B]">{selected.description}</p><div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={() => onOpenResource('knowledge-points', selected.subjectId)} className="rounded-xl bg-[#EAF7EF] p-3 text-left cursor-pointer"><span className="block text-[11px] text-[#64748B]">包含知识点</span><strong className="text-[20px] text-[#0E7D3E]">{selected.kpCount}</strong><span className="ml-2 text-[11px] text-[#0E7D3E]">查看明细 →</span></button><button type="button" onClick={() => onOpenResource('questions', selected.subjectId)} className="rounded-xl bg-[#EAF7EF] p-3 text-left cursor-pointer"><span className="block text-[11px] text-[#64748B]">包含题目</span><strong className="text-[20px] text-[#0E7D3E]">{selected.questionCount}</strong><span className="ml-2 text-[11px] text-[#0E7D3E]">查看明细 →</span></button></div></div>
        </aside>
      </div>}

      {wizardOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between"><div><p className="text-[11px] font-bold text-[#0E7D3E]">{step === 'basics' ? '第 1 步，共 3 步' : step === 'content' ? '第 2 步，共 3 步' : '第 3 步，共 3 步'}</p><h3 className="mt-1 text-[18px] font-bold">{step === 'basics' ? '填写基本信息' : step === 'content' ? '选择内容范围' : '确认并发布'}</h3></div><button type="button" onClick={() => setWizardOpen(false)} className="cursor-pointer text-[#64748B]"><span className="material-symbols-outlined">close</span></button></div>
        <div className="my-5 grid grid-cols-3 gap-2">{['basics', 'content', 'review'].map((item, index) => <div key={item} className={`h-1.5 rounded-full ${['basics', 'content', 'review'].indexOf(step) >= index ? 'bg-[#16B45B]' : 'bg-[#E2E8F0]'}`} />)}</div>
        {step === 'basics' && <div className="space-y-4"><label className="block text-[12px] font-bold text-[#475569]">内容包名称<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-1 block w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-[14px] outline-none focus:border-[#16B45B]" placeholder="如：人教版初中数学基础包" /></label><label className="block text-[12px] font-bold text-[#475569]">来源学科<select value={draft.subjectId} onChange={(event) => setDraft({ ...draft, subjectId: event.target.value, kpCount: 0, questionCount: 0 })} className="mt-1 block w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-[14px]">{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.stage} · {subject.name} · {subject.textbook}</option>)}</select></label></div>}
        {step === 'content' && <div><p className="text-[12px] text-[#64748B]">从该学科已发布资源中选择内容范围。演示版使用整科范围，数量来自内容资源。</p><div className="mt-4 grid grid-cols-2 gap-3">{(() => { const subject = subjectById(draft.subjectId); return <><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E2E8F0] p-4"><input type="checkbox" checked={draft.kpCount > 0} onChange={(event) => setDraft({ ...draft, kpCount: event.target.checked ? subject?.kpCount ?? 0 : 0 })} /><span><strong className="block">全部已发布知识点</strong><span className="text-[12px] text-[#64748B]">{subject?.kpCount ?? 0} 个</span></span></label><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E2E8F0] p-4"><input type="checkbox" checked={draft.questionCount > 0} onChange={(event) => setDraft({ ...draft, questionCount: event.target.checked ? subject?.questionCount ?? 0 : 0 })} /><span><strong className="block">全部已发布题目</strong><span className="text-[12px] text-[#64748B]">{subject?.questionCount ?? 0} 道</span></span></label></>; })()}</div>{draft.kpCount < 1 && draft.questionCount < 1 && <p className="mt-3 text-[12px] font-medium text-[#C2410C]">请选择至少一个知识点或一道题目</p>}</div>}
        {step === 'review' && <div className="rounded-xl bg-[#F8FAFC] p-4 text-[13px]"><h4 className="font-bold text-[#0F172A]">{draft.name}</h4><p className="mt-2 text-[#64748B]">来源：{subjectById(draft.subjectId)?.name} · {subjectById(draft.subjectId)?.textbook}</p><p className="mt-1 text-[#64748B]">范围：{draft.kpCount} 个知识点 · {draft.questionCount} 道题目</p></div>}
        <div className="mt-6 flex items-center justify-between border-t border-[#E2E8F0] pt-4"><button type="button" onClick={() => step === 'basics' ? setWizardOpen(false) : setStep(step === 'review' ? 'content' : 'basics')} className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-[13px] font-bold cursor-pointer">{step === 'basics' ? '取消' : '上一步'}</button><div className="flex gap-2">{step === 'review' && <button type="button" onClick={() => publish('draft')} className="rounded-xl border border-[#16B45B] px-4 py-2 text-[13px] font-bold text-[#0E7D3E] cursor-pointer">保存草稿</button>}<button type="button" disabled={(step === 'basics' && (!draft.name.trim() || !draft.subjectId)) || (step === 'content' && draft.kpCount < 1 && draft.questionCount < 1)} onClick={() => step === 'basics' ? setStep('content') : step === 'content' ? setStep('review') : publish('active')} className="rounded-xl bg-[#16B45B] px-4 py-2 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer">{step === 'review' ? '确认发布' : '下一步'}</button></div></div>
      </div></div>}
    </div>
  );
};
