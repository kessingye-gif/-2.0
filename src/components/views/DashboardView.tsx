import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PlatformDashboardSnapshot } from '../../dashboardSnapshot';
import type { StudentItem } from '../../types';
import { DashboardSection } from '../dashboard/DashboardSection';
import { MetricLink } from '../dashboard/MetricLink';
import { DiagnosticsView } from './DiagnosticsView';

const number = (value: number) => value.toLocaleString('zh-CN');

const PlatformOverview: React.FC<{ snapshot: PlatformDashboardSnapshot; students: StudentItem[]; onGenerateReport: (studentId: string, subject: string, startDate: string, endDate: string) => void }> = ({ snapshot, students, onGenerateReport }) => {
  const overview = snapshot.platformOverview!;
  const [activeTab, setActiveTab] = useState<'institutions' | 'users' | 'content' | 'work' | 'usage'>('institutions');
  const contentSection = snapshot.sections.find((section) => section.id === 'contentAssets');

  const tabs = [
    { id: 'institutions' as const, label: '机构运营' },
    { id: 'users' as const, label: '用户与使用' },
    { id: 'content' as const, label: '内容管理' },
    { id: 'work' as const, label: `待办异常 (${snapshot.workItems.length})` },
    { id: 'usage' as const, label: '使用情况' },
  ];
  const coveragePanel = <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
    <div className="flex items-start justify-between gap-4"><div><h3 className="text-[15px] font-bold text-[#0F172A]">学科知识点与精选题完整度</h3><p className="mt-1 text-[11px] text-[#64748B]">查看各学科启用知识点是否有精选题承接学习验证。</p></div><Link to="/platform/content/resources/knowledge-points" className="shrink-0 text-[11px] font-bold text-[#0E7D3E]">管理内容 →</Link></div>
    <div className="mt-5 space-y-4">{overview.subjectCoverage.length > 0 ? overview.subjectCoverage.slice(0, 7).map((item) => <div key={item.subject} className="grid grid-cols-[72px_1fr_auto] items-center gap-3"><strong className="truncate text-[12px] text-[#334155]">{item.subject}</strong><div><div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6]"><div className={`h-full rounded-full ${item.coverageRate < 80 ? 'bg-[#F59E0B]' : 'bg-[#16B45B]'}`} style={{ width: `${item.coverageRate}%` }} /></div><p className="mt-1 text-[10px] text-[#94A3B8]">{item.coveredKnowledgePoints}/{item.knowledgePoints} 个知识点有题 · {item.questions} 道启用题</p></div><strong className={`text-[12px] tabular-nums ${item.coverageRate < 80 ? 'text-amber-600' : 'text-[#0E7D3E]'}`}>{item.coverageRate}%</strong></div>) : <p className="py-8 text-center text-[12px] text-[#94A3B8]">暂无已启用知识点</p>}</div>
  </section>;
  const institutionTable = <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
    <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F0] px-5 py-4"><div><h3 className="text-[15px] font-bold text-[#0F172A]">机构用户与使用汇总</h3><p className="mt-1 text-[11px] text-[#64748B]">优先展示待关注用户较多的机构。</p></div><Link to="/platform/institutions" className="text-[11px] font-bold text-[#0E7D3E]">全部机构 →</Link></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-[12px]"><thead className="bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-5 py-3">机构</th><th className="px-4 py-3 text-center">服务中用户</th><th className="px-4 py-3 text-center">已有学习记录</th><th className="px-4 py-3 text-center">累计练习</th><th className="px-4 py-3 text-center">待关注</th><th className="px-5 py-3 text-right">操作</th></tr></thead><tbody className="divide-y divide-[#EEF2F0]">{overview.institutionUsage.slice(0, 6).map((item) => <tr key={item.id} className="hover:bg-[#FAFDFB]"><td className="px-5 py-3.5 font-bold text-[#0F172A]">{item.name}</td><td className="px-4 py-3.5 text-center tabular-nums">{item.serviceStudents}</td><td className="px-4 py-3.5 text-center tabular-nums">{item.learningStudents}</td><td className="px-4 py-3.5 text-center tabular-nums">{number(item.answeredQuestions)}</td><td className="px-4 py-3.5 text-center"><span className={`rounded-md px-2 py-1 font-bold ${item.attentionStudents ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.attentionStudents}</span></td><td className="px-5 py-3.5 text-right"><Link to={`/platform/students?institution=${item.id}`} className="font-bold text-[#0E7D3E]">查看用户</Link></td></tr>)}</tbody></table></div>
  </section>;

  return <div className="mx-auto max-w-[1480px] space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-[20px] font-extrabold text-[#0F172A]">平台运营总览</h2><p className="mt-1 text-[12px] text-[#64748B]">分类查看机构运营、用户与使用、内容管理和待办情况。</p></div>
      <p className="text-[11px] text-[#94A3B8]">数据更新：{snapshot.updatedAt}</p>
    </div>
    <nav aria-label="平台运营分类" className="overflow-x-auto border-b border-[#E2E8F0]"><div role="tablist" className="flex min-w-max gap-7">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-2 text-[13.5px] font-bold ${activeTab === tab.id ? 'border-b-2 border-[#16B45B] text-[#16B45B]' : 'text-[#64748B]'}`}>{tab.label}</button>)}</div></nav>

    {activeTab === 'institutions' && <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{overview.institutionMetrics.map((metric) => <MetricLink key={metric.id} metric={metric} />)}</div><section className="rounded-2xl border border-[#E2E8F0] bg-white p-5"><h3 className="text-[15px] font-bold text-[#0F172A]">机构额度概况</h3><div className="mt-4 grid gap-4 sm:grid-cols-3"><div><span className="text-[11px] text-[#64748B]">累计分配额度</span><strong className="mt-1 block text-[20px]">{number(overview.quota.total)} 点</strong></div><div><span className="text-[11px] text-[#64748B]">当前剩余额度</span><strong className="mt-1 block text-[20px] text-[#0E7D3E]">{number(overview.quota.remaining)} 点</strong></div><div><span className="text-[11px] text-[#64748B]">服务办理消耗</span><strong className="mt-1 block text-[20px]">{number(overview.quota.consumed)} 点</strong></div></div></section></>}

    {activeTab === 'users' && institutionTable}

    {activeTab === 'content' && <>{contentSection && <DashboardSection section={contentSection} />}<div className="grid gap-3 sm:grid-cols-3">{overview.contentHealth.map((item) => <Link key={item.label} to={item.targetPath} className={`rounded-xl border bg-white p-4 ${item.tone === 'warning' ? 'border-amber-200' : 'border-[#E2E8F0]'}`}><div className="flex justify-between"><span className="text-[12px] font-semibold text-[#64748B]">{item.label}</span><strong className={item.tone === 'warning' ? 'text-amber-600' : ''}>{item.value}</strong></div><p className="mt-2 text-[10px] text-[#94A3B8]">{item.description}</p></Link>)}</div>{coveragePanel}</>}

    {activeTab === 'work' && <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"><div className="border-b border-[#EEF2F0] px-5 py-4"><h3 className="text-[15px] font-bold">待办与异常</h3><p className="mt-1 text-[11px] text-[#64748B]">待激活、即将到期、内容配置等问题统一处理。</p></div><div className="divide-y divide-[#EEF2F0]">{snapshot.workItems.length ? snapshot.workItems.map((item) => <Link key={item.id} to={item.targetPath} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFDFB]"><span className={`h-2.5 w-2.5 rounded-full ${item.tone === 'danger' ? 'bg-red-600' : 'bg-amber-500'}`} /><span className="flex-1"><strong className="block text-[13px]">{item.title}</strong><span className="mt-1 block text-[11px] text-[#64748B]">{item.description}</span></span><strong>{item.count} 项</strong><span className="text-[#0E7D3E]">→</span></Link>) : <p className="px-5 py-10 text-center text-[12px] text-[#94A3B8]">当前暂无待办与异常</p>}</div></section>}

    {activeTab === 'usage' && <DiagnosticsView students={students} onGenerateReport={onGenerateReport} scopeLabel="全平台/机构" />}
  </div>;
};

const ScopedDashboard: React.FC<{ snapshot: PlatformDashboardSnapshot; students: StudentItem[] }> = ({ snapshot, students }) => {
  const allMetrics = snapshot.sections.flatMap((section) => section.metrics);
  const isTeacher = snapshot.sections[0]?.title.startsWith('我的') ?? false;
  const coreMetricIds = isTeacher
    ? ['students', 'activeStudents', 'pendingStudents', 'attentionStudents']
    : ['teachers', 'students', 'activeStudents', 'pendingStudents'];
  const coreMetrics = coreMetricIds.map((id) => allMetrics.find((metric) => metric.id === id)).filter((metric): metric is NonNullable<typeof metric> => Boolean(metric));
  const learningStudents = students.filter((student) => student.totalQuestions > 0 || student.totalStudyHours > 0);
  const totalQuestions = students.reduce((sum, student) => sum + student.totalQuestions, 0);
  const totalErrors = students.reduce((sum, student) => sum + student.errorCount, 0);
  const unreviewedErrors = students.reduce((sum, student) => sum + student.unreviewedErrorCount, 0);
  const averageAccuracy = students.length ? Math.round(students.reduce((sum, student) => sum + student.accuracyRate, 0) / students.length * 10) / 10 : 0;
  const reviewRate = totalErrors ? Math.round((totalErrors - unreviewedErrors) / totalErrors * 100) : 0;
  const subjectCounts = [...new Set(students.flatMap((student) => student.subjects))].map((subject) => ({ subject, count: students.filter((student) => student.subjects.includes(subject)).length })).sort((a, b) => b.count - a.count);

  return <div className="mx-auto max-w-[1480px] space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-[20px] font-extrabold text-[#0F172A]">{isTeacher ? '我的教学工作台' : '本机构运营工作台'}</h2><p className="mt-1 text-[12px] text-[#64748B]">{snapshot.sections[0]?.description}</p></div><p className="text-[11px] text-[#94A3B8]">数据更新：{snapshot.updatedAt}</p></div>

    <section className={`overflow-hidden rounded-2xl border bg-white ${snapshot.workItems.length ? 'border-amber-200' : 'border-[#CDE8D8]'}`}>
      <div className="flex items-center justify-between border-b border-[#EEF2F0] px-5 py-4"><div><h3 className="text-[15px] font-bold text-[#0F172A]">现在需要处理</h3><p className="mt-1 text-[12px] text-[#64748B]">优先处理会影响学生使用和学习闭环的事项。</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${snapshot.workItems.length ? 'bg-amber-50 text-amber-700' : 'bg-[#E8F7EE] text-[#0E7D3E]'}`}>{snapshot.workItems.length ? `${snapshot.workItems.length} 类待办` : '暂无待办'}</span></div>
      <div className="divide-y divide-[#EEF2F0]">{snapshot.workItems.length ? snapshot.workItems.map((item) => <Link key={item.id} to={item.targetPath} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFDFB] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#16B45B]"><span className={`h-2.5 w-2.5 rounded-full ${item.tone === 'danger' ? 'bg-red-600' : 'bg-amber-500'}`} /><span className="min-w-0 flex-1"><strong className="block text-[13px]">{item.title}</strong><span className="mt-1 block text-[12px] text-[#64748B]">{item.description}</span></span><strong>{item.count} 项</strong><span aria-hidden="true" className="text-[#0E7D3E]">→</span></Link>) : <p className="px-5 py-6 text-[13px] text-[#0E7D3E]">当前没有需要立即处理的事项，可以继续关注学生学习情况。</p>}</div>
    </section>

    <section><div className="mb-3"><h3 className="text-[15px] font-bold text-[#0F172A]">核心情况</h3><p className="mt-1 text-[12px] text-[#64748B]">只保留日常管理最常用的 4 项数据。</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{coreMetrics.map((metric) => <MetricLink key={metric.id} metric={metric} />)}</div></section>

    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5"><div><h3 className="text-[15px] font-bold text-[#0F172A]">小程序学习摘要</h3><p className="mt-1 text-[12px] text-[#64748B]">数据仅统计当前管理范围内的学生。</p></div>{students.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#F8FAFC] p-4"><span className="text-[12px] text-[#64748B]">已有学习记录</span><strong className="mt-1 block text-[24px] tabular-nums">{learningStudents.length} 人</strong></div><div className="rounded-xl bg-[#F8FAFC] p-4"><span className="text-[12px] text-[#64748B]">累计完成练习</span><strong className="mt-1 block text-[24px] tabular-nums">{number(totalQuestions)} 题</strong></div><div className="rounded-xl bg-[#F0FBF4] p-4"><span className="text-[12px] text-[#4B8060]">平均正确率</span><strong className="mt-1 block text-[24px] text-[#0E7D3E] tabular-nums">{averageAccuracy}%</strong></div><div className="rounded-xl bg-[#FFF8E8] p-4"><span className="text-[12px] text-amber-700">错题复习完成率</span><strong className="mt-1 block text-[24px] text-amber-700 tabular-nums">{reviewRate}%</strong></div></div> : <div className="mt-5 rounded-xl bg-[#F8FAFC] px-5 py-10 text-center"><strong className="text-[14px] text-[#334155]">暂无学生学习数据</strong><p className="mt-2 text-[12px] text-[#64748B]">学生首次进入小程序并完成练习后，这里会显示真实学习情况。</p></div>}</section>
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5"><div><h3 className="text-[15px] font-bold text-[#0F172A]">学科与知识点情况</h3><p className="mt-1 text-[12px] text-[#64748B]">先展示学生涉及学科，知识点结论只在产生诊断后展示。</p></div>{subjectCounts.length ? <div className="mt-5 space-y-3">{subjectCounts.map((item) => <div key={item.subject} className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-4 py-3"><strong className="text-[13px]">{item.subject}</strong><span className="text-[12px] text-[#64748B]">{item.count} 名学生</span></div>)}<div className="rounded-xl border border-dashed border-[#CBD5E1] px-4 py-4"><strong className="text-[12px] text-[#475569]">暂无可用的知识点诊断结果</strong><p className="mt-1 text-[11px] leading-5 text-[#64748B]">不会用学科正确率代替知识点掌握度；学生完成知识点诊断后再显示薄弱知识点。</p></div></div> : <div className="mt-5 rounded-xl bg-[#F8FAFC] px-5 py-10 text-center text-[12px] text-[#64748B]">暂无学科与知识点数据</div>}</section>
    </div>
  </div>;
};

export const DashboardView: React.FC<{ snapshot: PlatformDashboardSnapshot; students?: StudentItem[]; onGenerateReport?: (studentId: string, subject: string, startDate: string, endDate: string) => void }> = ({ snapshot, students = [], onGenerateReport = () => undefined }) =>
  snapshot.platformOverview
    ? <PlatformOverview snapshot={snapshot} students={students} onGenerateReport={onGenerateReport} />
    : <ScopedDashboard snapshot={snapshot} students={students} />;
