import React, { useState } from 'react';
import { useMasterData } from '../../masterData/MasterDataContext';
import type { KnowledgeTypeMaster } from '../../masterData/types';

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
  authorizedPackageNames?: string[];
  canCreatePackage?: boolean;
}

type PackageWizardStep = 'basics' | 'content' | 'review';

const statusLabel = { draft: '草稿', active: '已发布', inactive: '已停用' } as const;

export const resolveKnowledgeTypeName = (knowledgeTypes: KnowledgeTypeMaster[], knowledgeTypeId: string) =>
  knowledgeTypes.find((item) => item.id === knowledgeTypeId && item.status === 'active')?.name ?? '未配置';

export function filterAuthorizedContentPackages<T extends { name: string }>(packages: T[], authorizedPackageNames?: string[]): T[] {
  return authorizedPackageNames === undefined
    ? packages
    : packages.filter((item) => authorizedPackageNames.includes(item.name));
}

const workspaceKnowledgePoints = [
  { id: 'KP-071', name: '等式的性质', knowledgeTypeId: 'KT-01', questions: 18, status: '可发布', tone: 'green', content: '等式两边同时加上或减去同一个数，等式仍然成立；等式两边同时乘以同一个数，或除以同一个不为 0 的数，等式仍然成立。', goal: '学生能够说明两条等式性质，并在解简单方程时选择和正确使用对应性质。', suggestion: '先用天平平衡情境建立直观，再转换为代数表达，重点提醒除数不能为 0。' },
  { id: 'KP-072', name: '解一元一次方程', knowledgeTypeId: 'KT-02', questions: 12, status: '待补全', tone: 'amber', content: '通过移项、合并同类项、系数化为 1 等步骤求出一元一次方程的解。', goal: '掌握一元一次方程的标准解法，并能完成结果检验。', suggestion: '强化移项变号和等式性质之间的联系。' },
  { id: 'KP-073', name: '一元一次方程的实际应用', knowledgeTypeId: 'KT-02', questions: 16, status: '可发布', tone: 'green', content: '从实际问题中抽象数量关系，设未知数并列出一元一次方程解决问题。', goal: '能够识别等量关系，完成设元、列式、求解和作答。', suggestion: '使用行程、工程与销售问题进行分类练习。', prerequisites: ['等式的性质', '解一元一次方程'] },
  { id: 'KP-074', name: '一元一次方程的概念', knowledgeTypeId: 'KT-01', questions: 0, status: '待补全', tone: 'amber', content: '只含有一个未知数，未知数次数为 1，且等号两边都是整式的方程。', goal: '能够判断一个方程是否为一元一次方程。', suggestion: '通过正例和反例对比概念中的三个关键条件。' },
] as const;

const ContentPackageWorkspace: React.FC<{ pkg: ContentPackageRecord; subject?: ContentSubjectSummary; onBack: () => void; onNewPackage: () => void; onOpenResource: ContentPackageManagerProps['onOpenResource']; canCreatePackage: boolean }> = ({ pkg, subject, onBack, onNewPackage, onOpenResource, canCreatePackage }) => {
  const { state: masterDataState } = useMasterData();
  const [activePointId, setActivePointId] = useState(workspaceKnowledgePoints[0].id);
  const activePoint = workspaceKnowledgePoints.find((item) => item.id === activePointId) ?? workspaceKnowledgePoints[0];

  return <div className="space-y-4">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-[24px] font-bold text-[#10231D]">内容管理</h2><p className="mt-1 text-[12px] text-[#64748B]">先选择内容包，再在该内容包的边界内维护大纲、知识点和题目。</p></div>
      {canCreatePackage && <button type="button" onClick={onNewPackage} className="self-start rounded-xl bg-[#0F755A] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#0A624B]">新建内容包</button>}
    </div>

    <section className="flex flex-col gap-4 rounded-2xl border border-[#DCE5E1] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
      <div><h3 className="text-[17px] font-bold text-[#0F172A]">{subject?.name ?? pkg.name}</h3><p className="mt-1 text-[12px] text-[#64748B]">当前所有目录、知识点和题目操作均受所选内容包约束</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} className="rounded-xl border border-[#DCE5E1] bg-white px-4 py-2 text-[13px] font-medium text-[#334155] hover:bg-[#F8FAFC]">返回内容包</button>
        <div className="flex rounded-xl bg-[#EDF2F0] p-1">
          <button type="button" className="rounded-lg bg-white px-4 py-2 text-[13px] font-bold text-[#0F755A] shadow-sm">大纲与知识点</button>
          <button type="button" onClick={() => onOpenResource('questions', pkg.subjectId)} className="rounded-lg px-4 py-2 text-[13px] text-[#475569]">题目</button>
        </div>
        <button type="button" className="rounded-xl border border-[#DCE5E1] bg-white px-4 py-2 text-[13px] font-medium">批量导入知识点</button>
        <button type="button" className="rounded-xl bg-[#0F755A] px-4 py-2 text-[13px] font-bold text-white">新建知识点</button>
      </div>
    </section>

    <section className="grid min-h-[600px] overflow-hidden rounded-2xl border border-[#DCE5E1] bg-white lg:grid-cols-[245px_minmax(360px,1fr)_370px]">
      <aside className="border-b border-[#DCE5E1] lg:border-b-0 lg:border-r">
        <div className="border-b border-[#DCE5E1] px-4 py-4 text-[13px] font-bold text-[#0F172A]">{subject?.name ?? '内容包'} · 大纲目录</div>
        <nav className="p-3 text-[13px] text-[#334155]">
          <div className="rounded-lg px-2 py-2">⌄　一级大纲　数与代数</div>
          <div className="ml-4 rounded-lg px-2 py-2">⌄　二级大纲　方程与不等式</div>
          <div className="ml-8 rounded-lg bg-[#E7F3EE] px-3 py-2 font-medium text-[#0F755A]">三级大纲　一元一次方程</div>
          <div className="ml-8 rounded-lg px-3 py-2">三级大纲　二元一次方程组</div>
          <div className="ml-4 rounded-lg px-2 py-2">›　二级大纲　函数</div>
          <div className="rounded-lg px-2 py-2">›　一级大纲　图形与几何</div>
          <div className="rounded-lg px-2 py-2">›　一级大纲　统计与概率</div>
        </nav>
      </aside>

      <div className="border-b border-[#DCE5E1] lg:border-b-0 lg:border-r">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE5E1] px-4 py-3">
          <strong className="text-[14px]">知识点（{workspaceKnowledgePoints.length}）</strong>
          <div className="flex gap-2"><select className="rounded-xl border border-[#DCE5E1] px-3 py-2 text-[12px]"><option>全部完整性</option><option>可发布</option><option>待补全</option></select><input className="w-36 rounded-xl border border-[#DCE5E1] px-3 py-2 text-[12px]" placeholder="在目录内搜索" /></div>
        </div>
        <div className="divide-y divide-[#E8EEEB]">
          {workspaceKnowledgePoints.map((point) => <button key={point.id} type="button" onClick={() => setActivePointId(point.id)} className={`block w-full border-l-2 px-4 py-4 text-left transition ${activePointId === point.id ? 'border-[#0F755A] bg-[#F1F8F5]' : 'border-transparent hover:bg-[#F8FAFC]'}`}>
            <div className="flex items-center gap-2"><strong className="text-[14px] text-[#0F172A]">{point.name}</strong><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${point.tone === 'green' ? 'bg-[#E3F5EC] text-[#0E7D3E]' : 'bg-[#FFF1DD] text-[#B86608]'}`}>{point.status}</span></div>
            <p className="mt-1 text-[11px] text-[#64748B]">{point.id} · {point.questions ? `已关联 ${point.questions} 道` : '未关联题目'}{point.questions < 15 ? ' · 缺最小验证题' : ''}</p>
          </button>)}
        </div>
      </div>

      <aside className="min-w-0">
        <div className="flex items-center justify-between border-b border-[#DCE5E1] px-4 py-3"><strong className="text-[14px]">知识点详情</strong><button type="button" className="rounded-lg border border-[#DCE5E1] px-3 py-1.5 text-[12px] font-bold">编辑</button></div>
        <div className="space-y-4 p-4 text-[12px] leading-5 text-[#0F172A]">
          <div><h3 className="text-[17px] font-bold">{activePoint.name}</h3><span className="mt-2 inline-block rounded-full bg-[#E3F5EC] px-2.5 py-1 text-[10px] font-medium text-[#0E7D3E]">平台内容 · 已发布</span></div>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-3"><div><dt className="text-[#64748B]">知识点 ID</dt><dd className="mt-1 font-mono">{activePoint.id}</dd></div><div><dt className="text-[#64748B]">学科 / 学段</dt><dd className="mt-1">{subject?.name ?? '数学'} / {subject?.stage ?? '初中'}</dd></div><div><dt className="text-[#64748B]">适用年级</dt><dd className="mt-1">初一</dd></div><div><dt className="text-[#64748B]">适用地区</dt><dd className="mt-1">全国</dd></div></dl>
          <div><p className="text-[#64748B]">大纲层级路径</p><p className="mt-1 font-medium">数与代数 / 方程与不等式 / 一元一次方程</p></div>
          <div><p className="text-[#64748B]">前置知识点</p><div className="mt-1 flex flex-wrap gap-1.5">{'prerequisites' in activePoint && activePoint.prerequisites?.length ? activePoint.prerequisites.map((name) => <button key={name} type="button" onClick={() => { const point = workspaceKnowledgePoints.find((item) => item.name === name); if (point) setActivePointId(point.id); }} className="rounded-lg bg-[#E7F3EE] px-2 py-1 text-[11px] font-medium text-[#0F755A] hover:bg-[#D8EDE3]">{name}</button>) : <span className="text-[#64748B]">无</span>}</div></div>
          <div><p className="text-[#64748B]">知识类型</p><p className="mt-1 font-medium">{resolveKnowledgeTypeName(masterDataState.knowledgeTypes, activePoint.knowledgeTypeId)}</p></div>
          <div><p className="text-[#64748B]">核心学习内容</p><p className="mt-1">{activePoint.content}</p></div>
          <div><p className="text-[#64748B]">教学目标</p><p className="mt-1">{activePoint.goal}</p></div>
          <div><p className="text-[#64748B]">教学建议</p><p className="mt-1">{activePoint.suggestion}</p></div>
        </div>
      </aside>
    </section>
  </div>;
};

export const ContentPackageManager: React.FC<ContentPackageManagerProps> = ({ subjects, onOpenResource, authorizedPackageNames, canCreatePackage = true }) => {
  const [packages, setPackages] = useState(seedPackages);
  const visiblePackages = filterAuthorizedContentPackages<ContentPackageRecord>(packages, authorizedPackageNames);
  const [selected, setSelected] = useState<ContentPackageRecord | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<PackageWizardStep>('basics');
  const [draft, setDraft] = useState<ContentPackageDraft>({ name: '', subjectId: subjects[0]?.id ?? '', kpCount: 0, questionCount: 0 });

  const subjectById = (id: string) => subjects.find((item) => item.id === id);

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

  if (selected) {
    return <ContentPackageWorkspace pkg={selected} subject={subjectById(selected.subjectId)} onBack={() => setSelected(null)} onNewPackage={() => { setSelected(null); openWizard(); }} onOpenResource={onOpenResource} canCreatePackage={canCreatePackage} />;
  }

  return (
    <div className="space-y-4">
      {canCreatePackage && <div className="flex justify-end">
        <button type="button" onClick={openWizard} className="flex items-center justify-center gap-1 rounded-xl bg-[#16B45B] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#139B4E] cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">add</span>新增内容包
        </button>
      </div>}

      {visiblePackages.length > 0 ? (
        <div data-content-package-grid="true" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiblePackages.map((pkg) => {
            const subject = subjectById(pkg.subjectId);
            const statusTone = pkg.status === 'active'
              ? 'bg-[#E8F7EE] text-[#0E7D3E]'
              : pkg.status === 'draft'
                ? 'bg-[#FFF4DD] text-[#B86608]'
                : 'bg-[#F1F5F9] text-[#64748B]';

            return (
              <article key={pkg.id} className="flex min-h-[292px] flex-col rounded-2xl border border-[#DCE5E1] bg-white p-4 shadow-2xs transition hover:-translate-y-0.5 hover:border-[#B7D7C7] hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusTone}`}>{statusLabel[pkg.status]}</span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">{pkg.code}</span>
                </div>

                <div className="mt-3 min-h-[66px]">
                  <h3 className="text-[16px] font-bold leading-6 text-[#0F172A]">{pkg.name}</h3>
                  <p className="mt-1 text-[12px] text-[#64748B]">{subject?.name ?? '未关联学科'} · {subject?.stage ?? '未设置学段'} · {subject?.textbook ?? '未设置教材'}</p>
                </div>

                <dl className="mt-3 divide-y divide-[#E8EEEB] border-y border-[#E8EEEB] text-[13px]">
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-[#64748B]">知识点</dt>
                    <dd><button type="button" onClick={() => onOpenResource('knowledge-points', pkg.subjectId)} className="cursor-pointer font-mono font-bold text-[#0F172A] hover:text-[#0E7D3E] hover:underline">{pkg.kpCount.toLocaleString('zh-CN')}</button></dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-[#64748B]">关联题目</dt>
                    <dd><button type="button" onClick={() => onOpenResource('questions', pkg.subjectId)} className="cursor-pointer font-mono font-bold text-[#0F172A] hover:text-[#0E7D3E] hover:underline">{pkg.questionCount.toLocaleString('zh-CN')}</button></dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-[#64748B]">授权机构</dt>
                    <dd className="font-mono font-bold text-[#0F172A]">{pkg.institutionCount.toLocaleString('zh-CN')}</dd>
                  </div>
                </dl>

                <button type="button" onClick={() => setSelected(pkg)} className="mt-3 w-fit cursor-pointer rounded-lg border border-[#D6E2DC] px-3 py-1.5 text-[12px] font-bold text-[#0E7D3E] transition hover:border-[#16B45B] hover:bg-[#EAF7EF]">
                  进入内容包
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-14 text-center">
          <p className="font-bold text-[#334155]">当前机构暂无已授权内容包</p>
          <p className="mt-1 text-[12px] text-[#94A3B8]">请联系平台超级管理员在“商品与权益”中完成内容授权。</p>
        </div>
      )}

      <div className="rounded-2xl border border-[#CDE7DA] bg-[#F1FBF6] px-4 py-3 text-[12px] leading-5 text-[#476358]">
        <strong className="mr-1 text-[#0E7D3E]">机构边界：</strong>
        机构只能使用平台已授权的内容包；机构内部维护的知识点和题目仅在自身范围内生效。
      </div>

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
