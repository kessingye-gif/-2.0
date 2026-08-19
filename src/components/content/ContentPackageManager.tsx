import React, { useState } from 'react';
import { useMasterData } from '../../masterData/MasterDataContext';
import type { KnowledgeTypeMaster } from '../../masterData/types';
import type { KnowledgePointNode } from '../../types';
import { knowledgePointAiFields, knowledgePointBaseFields } from '../../domain/contentFields';

export interface ContentSubjectSummary {
  id: string;
  name: string;
  stage: string;
  textbook: string;
  kpCount: number;
  questionCount: number;
}

export interface ContentPackageRecord {
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
  knowledgePointIds: string[];
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
  return errors;
};

const seedPackages: ContentPackageRecord[] = [
  { id: 'CP-01', code: 'CP-MATH-CZ', name: '人教版初中数学全套内容包', subjectId: 'SUB-01', status: 'active', kpCount: 156, questionCount: 1280, institutionCount: 4, updatedAt: '2026-08-08 16:20', description: '自动引用初中数学下已发布的知识点与题目', knowledgePointIds: ['KP-L3-01', 'KP-L3-02'] },
  { id: 'CP-02', code: 'CP-PHYS-CZ', name: '人教版初中物理精选内容包', subjectId: 'SUB-02', status: 'active', kpCount: 98, questionCount: 840, institutionCount: 3, updatedAt: '2026-08-07 11:10', description: '自动引用初中物理下已发布的知识点与题目', knowledgePointIds: ['KP-L3-03'] },
  { id: 'CP-03', code: 'CP-CHEM-CZ', name: '人教版初中化学核心内容包', subjectId: 'SUB-03', status: 'active', kpCount: 75, questionCount: 620, institutionCount: 2, updatedAt: '2026-08-06 09:45', description: '自动引用初中化学下已发布的知识点与题目', knowledgePointIds: [] },
  { id: 'CP-04', code: 'CP-MATH-GZ', name: '人教版高中数学必修与选择性必修包', subjectId: 'SUB-06', status: 'active', kpCount: 210, questionCount: 1850, institutionCount: 1, updatedAt: '2026-08-05 18:30', description: '自动引用高中数学下已发布的知识点与题目', knowledgePointIds: [] },
  { id: 'CP-05', code: 'CP-ENG-CZ', name: '初中英语词汇与阅读专项包', subjectId: 'SUB-04', status: 'inactive', kpCount: 110, questionCount: 950, institutionCount: 0, updatedAt: '2026-08-03 14:00', description: '自动引用初中英语下已发布的知识点与题目', knowledgePointIds: [] },
];

interface ContentPackageManagerProps {
  subjects: ContentSubjectSummary[];
  onOpenResource?: (resource: 'knowledge-points' | 'questions', subjectId: string) => void;
  selectedPackageId?: string | null;
  onSelectedPackageChange?: (packageId: string | null) => void;
  knowledgePoints?: KnowledgePointNode[];
  onViewQuestions?: (knowledgePointId: string) => void;
  onBatchImportKnowledgePoints?: () => void;
  onAddKnowledgePoint?: () => void;
  authorizedPackageNames?: string[];
  canCreatePackage?: boolean;
  showNewPackageAction?: boolean;
}

type PackageWizardStep = 'basics' | 'review';

export const resolveKnowledgeTypeName = (knowledgeTypes: KnowledgeTypeMaster[], knowledgeTypeId: string) =>
  knowledgeTypes.find((item) => item.id === knowledgeTypeId && item.status === 'active')?.name ?? '未配置';

export function filterAuthorizedContentPackages<T extends { name: string }>(packages: T[], authorizedPackageNames?: string[]): T[] {
  return authorizedPackageNames === undefined
    ? packages
    : packages.filter((item) => authorizedPackageNames.includes(item.name));
}

export const getPackageWorkspaceKnowledgePoints = (knowledgePoints: KnowledgePointNode[], selectedKnowledgePointIds: string[]) => knowledgePoints
  .filter((point) => point.level === 3 && selectedKnowledgePointIds.includes(point.id))
  .map((point) => ({
    ...point,
    knowledgeTypeId: point.knowledgeType ?? 'KT-01',
    questions: point.questionCount,
    displayStatus: point.status === 'active' && point.coreContent && point.learningObjective ? '可发布' : '待补全',
    tone: point.status === 'active' && point.coreContent && point.learningObjective ? 'green' : 'amber',
    content: point.coreContent ?? '尚未填写核心学习内容。',
    goal: point.learningObjective ?? '尚未填写教学目标。',
    suggestion: point.teachingSuggestion ?? '尚未填写教学建议。',
    prerequisites: (point.prerequisiteKnowledgePointIds ?? []).map((id) => knowledgePoints.find((item) => item.id === id)?.name ?? id),
  }));

interface ContentPackageWorkspaceProps {
  pkg: ContentPackageRecord;
  subject?: ContentSubjectSummary;
  knowledgePoints: KnowledgePointNode[];
  onBack: () => void;
  onNewPackage: () => void;
  onViewQuestions: (knowledgePointId: string) => void;
  onBatchImportKnowledgePoints: () => void;
  onAddKnowledgePoint: () => void;
  canCreatePackage: boolean;
  showNewPackageAction: boolean;
}

export const ContentPackageWorkspace: React.FC<ContentPackageWorkspaceProps> = ({ pkg, subject, knowledgePoints, onBack, onNewPackage, onViewQuestions, onBatchImportKnowledgePoints, onAddKnowledgePoint, canCreatePackage, showNewPackageAction }) => {
  const { state: masterDataState } = useMasterData();
  const automaticallyReferencedIds = knowledgePoints
    .filter((point) => point.level === 3 && point.status === 'active' && Boolean(subject?.name.includes(point.subject)))
    .map((point) => point.id);
  const workspaceKnowledgePoints = getPackageWorkspaceKnowledgePoints(knowledgePoints, automaticallyReferencedIds);
  const [activePointId, setActivePointId] = useState(workspaceKnowledgePoints[0]?.id ?? '');
  const activePoint = workspaceKnowledgePoints.find((item) => item.id === activePointId) ?? workspaceKnowledgePoints[0];
  const activePointNode = knowledgePoints.find((point) => point.id === activePoint?.id);
  const sectionNode = activePointNode?.parentId ? knowledgePoints.find((point) => point.id === activePointNode.parentId) : undefined;
  const chapterNode = sectionNode?.parentId ? knowledgePoints.find((point) => point.id === sectionNode.parentId) : undefined;
  const levelValues: Record<string, string> = {
    chapter: chapterNode?.name ?? '-',
    section: sectionNode?.name ?? '-',
    knowledgePoint: activePoint?.name ?? '-',
  };

  return <div className="space-y-4">
    <div className="flex justify-end">
      {canCreatePackage && showNewPackageAction && <button type="button" onClick={onNewPackage} className="self-start rounded-xl bg-[#0F755A] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#0A624B]">新建内容包</button>}
    </div>

    <section className="flex flex-col gap-4 rounded-2xl border border-[#DCE5E1] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
      <div><h3 className="text-[17px] font-bold text-[#0F172A]">{subject?.name ?? pkg.name}</h3><p className="mt-1 text-[12px] text-[#64748B]">当前所有目录、知识点和题目操作均受所选内容包约束</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} className="rounded-xl border border-[#DCE5E1] bg-white px-4 py-2 text-[13px] font-medium text-[#334155] hover:bg-[#F8FAFC]">返回内容包</button>
        <div className="flex rounded-xl bg-[#EDF2F0] p-1">
          <button type="button" className="rounded-lg bg-white px-4 py-2 text-[13px] font-bold text-[#0F755A] shadow-sm">大纲与知识点</button>
          <button type="button" disabled={!activePoint} onClick={() => activePoint && onViewQuestions(activePoint.id)} className="rounded-lg px-4 py-2 text-[13px] text-[#475569] disabled:cursor-not-allowed disabled:opacity-50">题目</button>
        </div>
        <button type="button" onClick={onBatchImportKnowledgePoints} className="rounded-xl border border-[#DCE5E1] bg-white px-4 py-2 text-[13px] font-medium">批量导入知识点</button>
        <button type="button" onClick={onAddKnowledgePoint} className="rounded-xl bg-[#0F755A] px-4 py-2 text-[13px] font-bold text-white">新增章 / 节 / 知识点</button>
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
            <div className="flex items-center gap-2"><strong className="text-[14px] text-[#0F172A]">{point.name}</strong><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${point.tone === 'green' ? 'bg-[#E3F5EC] text-[#0E7D3E]' : 'bg-[#FFF1DD] text-[#B86608]'}`}>{point.displayStatus}</span></div>
            <p className="mt-1 text-[11px] text-[#64748B]">{point.id} · {point.questions ? `已关联 ${point.questions} 道` : '未关联题目'}{point.questions < 15 ? ' · 缺最小验证题' : ''}</p>
          </button>)}
        </div>
      </div>

      <aside className="min-w-0">
        <div className="border-b border-[#DCE5E1] px-4 py-3"><strong className="text-[14px]">知识点详情</strong></div>
        {activePoint ? <div className="space-y-4 p-4 text-[12px] leading-5 text-[#0F172A]">
          <div><h3 className="text-[17px] font-bold">{activePoint.name}</h3><span className="mt-2 inline-block rounded-full bg-[#E3F5EC] px-2.5 py-1 text-[10px] font-medium text-[#0E7D3E]">平台内容 · 已发布</span></div>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-3"><div><dt className="text-[#64748B]">知识点 ID</dt><dd className="mt-1 font-mono">{activePoint.id}</dd></div><div><dt className="text-[#64748B]">学科 / 学段</dt><dd className="mt-1">{subject?.name ?? '数学'} / {subject?.stage ?? '初中'}</dd></div><div><dt className="text-[#64748B]">适用年级</dt><dd className="mt-1">{activePoint.grade}</dd></div><div><dt className="text-[#64748B]">教材版本</dt><dd className="mt-1">{activePoint.textbook}</dd></div>{knowledgePointBaseFields.slice(-3).map((field) => <div key={field.key}><dt className="text-[#64748B]">{field.label}</dt><dd className="mt-1">{levelValues[field.key]}</dd></div>)}</dl>
          <div><p className="text-[#64748B]">前置知识点</p><div className="mt-1 flex flex-wrap gap-1.5">{activePoint.prerequisites.length ? activePoint.prerequisites.map((name) => <button key={name} type="button" onClick={() => { const point = workspaceKnowledgePoints.find((item) => item.name === name); if (point) setActivePointId(point.id); }} className="rounded-lg bg-[#E7F3EE] px-2 py-1 text-[11px] font-medium text-[#0F755A] hover:bg-[#D8EDE3]">{name}</button>) : <span className="text-[#64748B]">无</span>}</div></div>
          <div><p className="text-[#64748B]">知识类型</p><p className="mt-1 font-medium">{resolveKnowledgeTypeName(masterDataState.knowledgeTypes, activePoint.knowledgeTypeId)}</p></div>
          {knowledgePointAiFields.slice(1).map((field) => {
            const value = field.key === 'coreContent' ? activePoint.content : field.key === 'learningObjective' ? activePoint.goal : activePoint.suggestion;
            return <div key={field.key}><p className="text-[#64748B]">{field.label}</p><p className="mt-1">{value}</p></div>;
          })}
        </div> : <div className="p-8 text-center text-[12px] text-[#94A3B8]">当前内容包暂无可维护知识点</div>}
      </aside>
    </section>
  </div>;
};

export const ContentPackageManager: React.FC<ContentPackageManagerProps> = ({ subjects, selectedPackageId = null, onSelectedPackageChange = (_packageId: string | null) => undefined, knowledgePoints = [], onViewQuestions = () => undefined, onBatchImportKnowledgePoints = () => undefined, onAddKnowledgePoint = () => undefined, authorizedPackageNames, canCreatePackage = true, showNewPackageAction = true }) => {
  const [packages, setPackages] = useState(seedPackages);
  const [packageSearch, setPackageSearch] = useState('');
  const [packageStatus, setPackageStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const authorizedPackages = filterAuthorizedContentPackages<ContentPackageRecord>(packages, authorizedPackageNames);
  const visiblePackages = authorizedPackages.filter((pkg) => {
    const matchesSearch = !packageSearch || pkg.name.toLowerCase().includes(packageSearch.toLowerCase()) || pkg.code.toLowerCase().includes(packageSearch.toLowerCase());
    const matchesStatus = packageStatus === 'all' || pkg.status === packageStatus;
    return matchesSearch && matchesStatus;
  });
  const selected = packages.find((pkg) => pkg.id === selectedPackageId) ?? null;
  const [wizardOpen, setWizardOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ pkg: ContentPackageRecord; nextStatus: 'active' | 'inactive' } | null>(null);
  const [step, setStep] = useState<PackageWizardStep>('basics');
  const [draft, setDraft] = useState<ContentPackageDraft>({ name: '', subjectId: subjects[0]?.id ?? '', kpCount: 0, questionCount: 0 });

  const subjectById = (id: string) => subjects.find((item) => item.id === id);

  const openWizard = () => {
    setDraft({ name: '', subjectId: subjects[0]?.id ?? '', kpCount: 0, questionCount: 0 });
    setStep('basics');
    setWizardOpen(true);
  };

  const publish = () => {
    const subject = subjectById(draft.subjectId);
    if (!subject || validateContentPackageDraft(draft).length) return;
    const referencedKnowledgePointIds = knowledgePoints
      .filter((point) => point.level === 3 && point.status === 'active' && subject.name.includes(point.subject))
      .map((point) => point.id);
    setPackages((current) => [{
      id: `CP-${Date.now().toString().slice(-5)}`,
      code: `CP-${subject.id.replace('SUB-', '')}-${Date.now().toString().slice(-3)}`,
      name: draft.name || `${subject.name}内容包草稿`,
      subjectId: subject.id,
      status: 'active',
      kpCount: subject.kpCount,
      questionCount: subject.questionCount,
      institutionCount: 0,
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16),
      description: `自动引用${subject.name}下已发布的知识点与题目`,
      knowledgePointIds: referencedKnowledgePointIds,
    }, ...current]);
    setWizardOpen(false);
    setNotice(`内容包已创建，已自动引用${subject.name}下已发布的知识点与题目。`);
  };

  const confirmStatusChange = () => {
    if (!statusChangeTarget) return;
    const { pkg, nextStatus } = statusChangeTarget;
    setPackages((current) => current.map((item) => item.id === pkg.id ? { ...item, status: nextStatus, updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16) } : item));
    setNotice(nextStatus === 'inactive' ? `“${pkg.name}”已停用，新的机构授权将不再使用该内容包。` : `“${pkg.name}”已重新启用，可以继续授权给机构。`);
    setStatusChangeTarget(null);
  };

  if (selected) {
    return <ContentPackageWorkspace pkg={selected} subject={subjectById(selected.subjectId)} knowledgePoints={knowledgePoints} onBack={() => onSelectedPackageChange(null)} onNewPackage={() => { onSelectedPackageChange(null); openWizard(); }} onViewQuestions={onViewQuestions} onBatchImportKnowledgePoints={onBatchImportKnowledgePoints} onAddKnowledgePoint={onAddKnowledgePoint} canCreatePackage={canCreatePackage} showNewPackageAction={showNewPackageAction} />;
  }

  return (
    <div className="space-y-4">
      {notice && <div role="status" aria-live="polite" className="flex items-center justify-between rounded-xl border border-[#A7E4BE] bg-[#F0FBF4] px-4 py-3 text-[12px] font-medium text-[#0E7D3E]"><span>{notice}</span><button type="button" onClick={() => setNotice('')} className="rounded-lg px-2 py-1 font-bold hover:bg-[#DFF4E7]">知道了</button></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3">
        <div className="flex flex-wrap items-center gap-2"><input aria-label="搜索内容包" value={packageSearch} onChange={(event) => setPackageSearch(event.target.value)} placeholder="搜索内容包名称或编码…" className="w-64 rounded-xl border border-[#E2E8F0] px-3 py-2 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16B45B]" /><select aria-label="按状态筛选内容包" value={packageStatus} onChange={(event) => setPackageStatus(event.target.value as typeof packageStatus)} className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16B45B]"><option value="all">全部状态</option><option value="active">可使用</option><option value="inactive">已停用</option></select></div>
      {canCreatePackage && showNewPackageAction && <div className="flex justify-end">
        <button type="button" onClick={openWizard} className="flex items-center justify-center gap-1 rounded-xl bg-[#16B45B] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#139B4E] cursor-pointer">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">add</span>新增内容包
        </button>
      </div>}
      </div>

      {visiblePackages.length > 0 ? (
        <div data-content-package-grid="true" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiblePackages.map((pkg) => {
            const subject = subjectById(pkg.subjectId);
            const completenessLabel = pkg.status === 'inactive' ? '已停用' : '可使用';
            const statusTone = pkg.status === 'inactive' ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#E8F7EE] text-[#0E7D3E]';

            return (
              <article key={pkg.id} className="flex min-h-[292px] flex-col rounded-2xl border border-[#DCE5E1] bg-white p-4 shadow-2xs transition hover:-translate-y-0.5 hover:border-[#B7D7C7] hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusTone}`}>{completenessLabel}</span>
                  {canCreatePackage && <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setStatusChangeTarget({ pkg, nextStatus: pkg.status === 'inactive' ? 'active' : 'inactive' })} className={`cursor-pointer text-[12px] font-bold hover:underline ${pkg.status === 'inactive' ? 'text-[#16B45B]' : 'text-[#DC2626]'}`}>{pkg.status === 'inactive' ? '启用' : '停用'}</button>
                  </div>}
                </div>

                <div className="mt-3 min-h-[66px]">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[16px] font-bold leading-6 text-[#0F172A]">{pkg.name}</h3>
                    <span className="shrink-0 font-mono text-[10px] text-[#94A3B8]">{pkg.code}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-[#64748B]">{subject?.name ?? '未关联学科'} · {subject?.stage ?? '未设置学段'} · {subject?.textbook ?? '未设置教材'}</p>
                </div>

                <dl className="mt-3 divide-y divide-[#E8EEEB] border-y border-[#E8EEEB] text-[13px]">
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-[#64748B]">知识点</dt>
                    <dd><button type="button" onClick={() => onSelectedPackageChange(pkg.id)} className="cursor-pointer font-mono font-bold text-[#0F172A] hover:text-[#0E7D3E] hover:underline">{pkg.kpCount.toLocaleString('zh-CN')}</button></dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-[#64748B]">关联题目</dt>
                    <dd><button type="button" onClick={() => onSelectedPackageChange(pkg.id)} className="cursor-pointer font-mono font-bold text-[#0F172A] hover:text-[#0E7D3E] hover:underline">{pkg.questionCount.toLocaleString('zh-CN')}</button></dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-[#64748B]">授权机构</dt>
                    <dd className="font-mono font-bold text-[#0F172A]">{pkg.institutionCount.toLocaleString('zh-CN')}</dd>
                  </div>
                </dl>

                <div className={`mt-3 rounded-lg px-3 py-2 text-[11px] ${pkg.status === 'inactive' ? 'bg-[#F8FAFC] text-[#64748B]' : 'bg-[#F0FBF4] text-[#0E7D3E]'}`}><strong>内容来源：</strong>{pkg.status === 'inactive' ? '已停用，当前不能授权给新机构' : `自动同步${subject?.name ?? '来源学科'}下已发布的知识点与精选题`}</div>

                <div className="mt-3">
                  <button type="button" onClick={() => onSelectedPackageChange(pkg.id)} className="cursor-pointer rounded-lg border border-[#D6E2DC] px-3 py-1.5 text-[12px] font-bold text-[#0E7D3E] transition hover:border-[#16B45B] hover:bg-[#EAF7EF]">
                    进入内容包
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-14 text-center">
          <p className="font-bold text-[#334155]">{authorizedPackages.length ? '没有符合当前条件的内容包' : '当前机构暂无已授权内容包'}</p>
          <p className="mt-1 text-[12px] text-[#94A3B8]">{authorizedPackages.length ? '请调整搜索词或状态筛选。' : '请联系平台超级管理员完成内容授权。'}</p>
        </div>
      )}

      <div className="rounded-2xl border border-[#CDE7DA] bg-[#F1FBF6] px-4 py-3 text-[12px] leading-5 text-[#476358]">
        <strong className="mr-1 text-[#0E7D3E]">机构边界：</strong>
        机构只能使用平台已授权的内容包；机构内部维护的知识点和题目仅在自身范围内生效。
      </div>

      {statusChangeTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="content-status-dialog-title" className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl"><h3 id="content-status-dialog-title" className="text-[17px] font-bold text-[#0F172A]">{statusChangeTarget.nextStatus === 'inactive' ? '确认停用内容包？' : '确认重新启用？'}</h3><p className="mt-2 text-[12px] leading-5 text-[#64748B]">{statusChangeTarget.nextStatus === 'inactive' ? `停用“${statusChangeTarget.pkg.name}”后，将不能继续授权给新机构；已有数据不会删除，可以随时重新启用。` : `重新启用“${statusChangeTarget.pkg.name}”后，可以继续授权给机构。`}</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setStatusChangeTarget(null)} className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-[13px] font-bold text-[#64748B] hover:bg-[#F8FAFC]">取消</button><button type="button" onClick={confirmStatusChange} className={`rounded-xl px-4 py-2 text-[13px] font-bold text-white ${statusChangeTarget.nextStatus === 'inactive' ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : 'bg-[#16B45B] hover:bg-[#139B4E]'}`}>{statusChangeTarget.nextStatus === 'inactive' ? '确认停用' : '确认启用'}</button></div></div></div>}

      {wizardOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between"><div><p className="text-[11px] font-bold text-[#0E7D3E]">{step === 'basics' ? '第 1 步，共 2 步' : '第 2 步，共 2 步'}</p><h3 className="mt-1 text-[18px] font-bold">{step === 'basics' ? '填写基本信息' : '确认创建'}</h3></div><button type="button" onClick={() => setWizardOpen(false)} className="cursor-pointer text-[#64748B]"><span className="material-symbols-outlined">close</span></button></div>
        <div className="my-5 grid grid-cols-2 gap-2">{['basics', 'review'].map((item, index) => <div key={item} className={`h-1.5 rounded-full ${['basics', 'review'].indexOf(step) >= index ? 'bg-[#16B45B]' : 'bg-[#E2E8F0]'}`} />)}</div>
        {step === 'basics' && <div className="space-y-4"><label className="block text-[12px] font-bold text-[#475569]">内容包名称<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-1 block w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-[14px] outline-none focus:border-[#16B45B]" placeholder="如：人教版初中数学基础包" /></label><label className="block text-[12px] font-bold text-[#475569]">内容来源学科<select value={draft.subjectId} onChange={(event) => setDraft({ ...draft, subjectId: event.target.value })} className="mt-1 block w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-[14px]">{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} · {subject.stage} · {subject.textbook}</option>)}</select><span className="mt-2 block font-normal leading-5 text-[#64748B]">内容包自动引用该学科下已发布的知识点与精选题，后续内容更新会自动同步。</span></label></div>}
        {step === 'review' && (() => { const subject = subjectById(draft.subjectId); return <div className="rounded-xl bg-[#F8FAFC] p-4 text-[13px]"><h4 className="font-bold text-[#0F172A]">{draft.name}</h4><p className="mt-2 text-[#64748B]">来源：{subject?.name} · {subject?.textbook}</p><p className="mt-1 text-[#64748B]">将自动引用：{subject?.kpCount ?? 0} 个知识点 · {subject?.questionCount ?? 0} 道精选题</p></div>; })()}
        <div className="mt-6 flex items-center justify-between border-t border-[#E2E8F0] pt-4"><button type="button" onClick={() => step === 'basics' ? setWizardOpen(false) : setStep('basics')} className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-[13px] font-bold cursor-pointer">{step === 'basics' ? '取消' : '上一步'}</button><button type="button" disabled={step === 'basics' && (!draft.name.trim() || !draft.subjectId)} onClick={() => step === 'basics' ? setStep('review') : publish()} className="rounded-xl bg-[#16B45B] px-4 py-2 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer">{step === 'review' ? '确认创建' : '下一步'}</button></div>
      </div></div>}
    </div>
  );
};
