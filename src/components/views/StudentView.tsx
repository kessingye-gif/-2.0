import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  StudentItem,
  ParentGuardianship,
  WeChatRebindRequest,
  GuardianshipStatus,
  AuthCode,
  GuardianBindingCode,
  StudentServiceRight,
  ServicePackage,
  ServiceFulfillmentResult,
  TeacherItem,
  Institution,
  ContentPackageItem,
  BulkServiceFulfillmentOutcome,
  StudentTeacherAssignment,
} from '../../types';
import { deriveStudentRights } from '../../utils/studentCodeManagement';
import { filterStudents, getStudentFilterOptions } from '../../utils/studentFilters';
import { useMasterData } from '../../masterData/MasterDataContext';
import { DialogShell } from '../ui/FormPrimitives';
import { ServiceFulfillmentPanel } from '../fulfillment/ServiceFulfillmentPanel';
import { mergeStudentServiceRights } from '../../domain/studentRights';
import { deriveStudentServiceReminders, type StudentServiceReminder } from '../../domain/serviceReminders';
import type { Role } from '../../permissions/accessControl';
import { getTeacherStudentSubjectScope } from '../../permissions/dataScope';
import { createBulkServiceFulfillments } from '../../domain/serviceFulfillment';
import { downloadImportTemplate } from '../../utils/downloadImportTemplate';
import { buildImportedStudents, type StudentImportRow } from '../../domain/studentImport';

interface StudentViewProps {
  students: StudentItem[];
  guardianships: ParentGuardianship[];
  authCodes: AuthCode[];
  guardianBindingCodes: GuardianBindingCode[];
  serviceRights: StudentServiceRight[];
  packages: ServicePackage[];
  teachers: TeacherItem[];
  institutions?: Institution[];
  contentPackages?: ContentPackageItem[];
  onFulfillService: (result: ServiceFulfillmentResult) => void;
  onFulfillServices?: (results: ServiceFulfillmentResult[]) => BulkServiceFulfillmentOutcome;
  onAddStudents?: (students: StudentItem[]) => void;
  onAssignTeacher?: (studentId: string, teacherId: string) => void;
  onUpdateTeacherAssignments?: (studentId: string, assignments: StudentTeacherAssignment[]) => void;
  initialTeacherFilter?: string;
  isLoading?: boolean;
  onRevokeAuthCode: (codeId: string) => void;
  onUpdateGuardianshipStatus: (id: string, status: GuardianshipStatus) => void;
  viewerRole?: Role;
  viewerTeacherId?: string;
}

const hiddenRebindRequests: WeChatRebindRequest[] = [];

export const getDailyAiUsage = (right?: Pick<StudentServiceRight, 'includedAiUsage' | 'todayAiUsage'>) => {
  if (!right || right.includedAiUsage <= 0) return null;
  const limit = right.includedAiUsage;
  const used = Math.max(0, Math.min(limit, right.todayAiUsage ?? 0));
  const usedPercentage = Math.round((used / limit) * 100);
  return { limit, used, usedPercentage, isWarning: usedPercentage >= 85 };
};

export const formatRecentMiniProgramUse = (value?: string, now = new Date()) => {
  if (!value) return { label: '从未使用', className: 'text-[#94A3B8]' };
  const usedAt = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(usedAt.getTime())) return { label: '从未使用', className: 'text-[#94A3B8]' };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const usedDay = new Date(usedAt.getFullYear(), usedAt.getMonth(), usedAt.getDate()).getTime();
  const days = Math.max(0, Math.floor((today - usedDay) / 86_400_000));
  if (days === 0) return { label: '今日使用', className: 'text-[#0E7D3E]' };
  if (days < 7) return { label: `${days} 天前`, className: days >= 3 ? 'text-[#B45309]' : 'text-[#475569]' };
  return { label: '7 天以上未使用', className: 'text-[#DC2626]' };
};

export const StudentServiceReminderCards: React.FC<{ reminders: StudentServiceReminder[]; onDismiss: (id: string) => void }> = ({ reminders, onDismiss }) => {
  if (reminders.length === 0) return null;
  return <section className="rounded-2xl border border-amber-200 bg-white p-4">
    <div><h4 className="text-[14px] font-bold text-[#0F172A]">待跟进提醒</h4><p className="mt-1 text-[11px] text-[#64748B]">系统根据服务状态自动生成，不影响学生权益。</p></div>
    <div className="mt-3 space-y-2">{reminders.map((reminder) => <div key={reminder.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2.5">
      <div className="min-w-0"><p className="text-[12px] font-bold text-amber-800">{reminder.title} · {reminder.packageName}</p><p className="mt-1 text-[11px] text-amber-700">{reminder.description}</p></div>
      <button type="button" onClick={() => onDismiss(reminder.id)} className="shrink-0 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100">标记已处理</button>
    </div>)}</div>
  </section>;
};

export const StudentView: React.FC<StudentViewProps> = ({
  students,
  guardianships,
  authCodes,
  guardianBindingCodes,
  serviceRights,
  packages,
  teachers,
  institutions = [],
  contentPackages = [],
  onFulfillService,
  onFulfillServices,
  onAddStudents,
  onAssignTeacher,
  onUpdateTeacherAssignments,
  initialTeacherFilter = '',
  isLoading = false,
  onRevokeAuthCode,
  onUpdateGuardianshipStatus,
  viewerRole = 'super_admin',
  viewerTeacherId,
}) => {
  const { getActiveGrades, getActiveSubjects } = useMasterData();
  const [bulkMode, setBulkMode] = useState(false);

  // Roster Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState(initialTeacherFilter);
  const [gradeFilter, setGradeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [serviceStudent, setServiceStudent] = useState<StudentItem | null>(null);
  const [detailStudent, setDetailStudent] = useState<StudentItem | null>(null);
  const [dismissedReminderIds, setDismissedReminderIds] = useState<Set<string>>(() => new Set());
  const [rebindRequests, setRebindRequests] = useState<WeChatRebindRequest[]>(hiddenRebindRequests);
  const [selectedBulkStudentIds, setSelectedBulkStudentIds] = useState<Set<string>>(() => new Set());
  const activePackages = useMemo(() => packages.filter((item) => item.status === 'active'), [packages]);
  const [bulkPackageId, setBulkPackageId] = useState('');
  const [bulkContentPackageIds, setBulkContentPackageIds] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importInstitutionId, setImportInstitutionId] = useState(institutions[0]?.id ?? '');
  const [assignTeacherStudent, setAssignTeacherStudent] = useState<StudentItem | null>(null);
  const [assignmentTeacherId, setAssignmentTeacherId] = useState('');
  const [teachingAssignmentsDraft, setTeachingAssignmentsDraft] = useState<StudentTeacherAssignment[]>([]);
  const subjectOptions = useMemo(() => getActiveSubjects().map((item) => item.name), [getActiveSubjects]);
  const [importStudents, setImportStudents] = useState<StudentItem[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSkipped, setImportSkipped] = useState<string[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const studentRights = useMemo(() => deriveStudentRights(authCodes), [authCodes]);
  const mergedServiceRights = useMemo(() => mergeStudentServiceRights(serviceRights, authCodes, packages), [serviceRights, authCodes, packages]);
  const serviceReminders = useMemo(() => deriveStudentServiceReminders(mergedServiceRights, new Date()), [mergedServiceRights]);
  const canManageServices = viewerRole !== 'teacher';
  const studentStats = useMemo(() => {
    const latestRightByStudent = new Map<string, StudentServiceRight>();
    mergedServiceRights.forEach((right) => {
      if (!latestRightByStudent.has(right.studentId)) latestRightByStudent.set(right.studentId, right);
    });
    const serviceActive = students.filter((student) => latestRightByStudent.get(student.id)?.status === 'active' || (!latestRightByStudent.has(student.id) && student.serviceStatus === 'active')).length;
    const pendingActivation = students.filter((student) => latestRightByStudent.get(student.id)?.status === 'pending').length;
    const needsService = students.filter((student) => {
      const right = latestRightByStudent.get(student.id);
      return right?.status === 'pending' || (!right && student.serviceStatus === 'none');
    }).length;
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    const expiringSoon = students.filter((student) => {
      const right = latestRightByStudent.get(student.id);
      const expireAt = right?.serviceExpireAt || student.serviceExpireAt;
      if (!expireAt || (right?.status ?? student.serviceStatus) !== 'active') return false;
      const expireDate = new Date(`${expireAt}T23:59:59`);
      return expireDate >= today && expireDate <= thirtyDaysLater;
    }).length;
    return { total: students.length, serviceActive, pendingActivation, needsService, expiringSoon };
  }, [students, mergedServiceRights]);

  const handleReviewRebind = (id: string, isApproved: boolean) => {
    setRebindRequests((current) => current.map((item) => item.id === id ? { ...item, status: isApproved ? 'approved' : 'rejected' } : item));
  };

  // Filtered Roster
  const scopedStudents = useMemo(() => students.flatMap((student) => {
    if (viewerRole !== 'teacher') return [student];
    const scope = getTeacherStudentSubjectScope(student, viewerTeacherId);
    if (!scope) return [];
    return [{ ...student, subjects: scope === 'all' ? student.subjects : scope }];
  }), [students, viewerRole, viewerTeacherId]);
  const organizationFilters = { institution: institutionFilter, teacher: teacherFilter, className: classFilter, grade: gradeFilter };
  const filterOptions = useMemo(() => getStudentFilterOptions(scopedStudents, organizationFilters), [scopedStudents, institutionFilter, teacherFilter, classFilter, gradeFilter]);
  const gradeOptions = useMemo(() => {
    const available = new Set(filterOptions.grades);
    const configured = getActiveGrades().map((item) => item.name).filter((name) => available.has(name));
    const unconfigured = filterOptions.grades.filter((name) => !configured.includes(name));
    return [...configured, ...unconfigured];
  }, [filterOptions.grades, getActiveGrades]);
  const filteredStudents = useMemo(() => {
    const base = filterStudents(scopedStudents, { ...organizationFilters, searchTerm, serviceStatus: serviceStatusFilter === 'expiring' ? '' : serviceStatusFilter });
    if (serviceStatusFilter !== 'expiring') return base;
    const today = new Date();
    const deadline = new Date(today);
    deadline.setDate(today.getDate() + 30);
    return base.filter((student) => {
      const right = mergedServiceRights.find((item) => item.studentId === student.id);
      const expireAt = right?.serviceExpireAt || student.serviceExpireAt;
      if (!expireAt || (right?.status ?? student.serviceStatus) !== 'active') return false;
      const date = new Date(`${expireAt}T23:59:59`);
      return date >= today && date <= deadline;
    });
  }, [scopedStudents, mergedServiceRights, searchTerm, serviceStatusFilter, institutionFilter, teacherFilter, classFilter, gradeFilter]);
  const hasRosterFilters = Boolean(searchTerm || serviceStatusFilter || institutionFilter || teacherFilter || classFilter || gradeFilter);
  const openImportDialog = () => {
    setImportInstitutionId(institutions[0]?.id ?? '');
    setImportStudents([]);
    setImportErrors([]);
    setImportSkipped([]);
    setImportFileName('');
    setIsImportOpen(true);
  };

  const handleStudentImportFile = async (file: File) => {
    setImportFileName(file.name);
    setImportStudents([]);
    setImportErrors([]);
    setImportSkipped([]);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<StudentImportRow>(sheet, { defval: '' });
      const institution = institutions.find((item) => item.id === importInstitutionId);
      if (!institution) throw new Error('请选择学生所属机构');
      const result = buildImportedStudents(rows, institution, teachers, students);
      setImportStudents(result.students);
      setImportErrors(result.errors);
      setImportSkipped(result.skipped);
    } catch (caught) {
      setImportErrors([caught instanceof Error ? caught.message : 'Excel 读取失败']);
    }
  };

  const handleConfirmStudentImport = () => {
    if (!importStudents.length || !onAddStudents) return;
    onAddStudents(importStudents);
    setIsImportOpen(false);
    setImportStudents([]);
    setImportErrors([]);
    setImportSkipped([]);
    setImportFileName('');
  };

  if (isLoading) return <div className="space-y-4" aria-label="学生数据加载中">
    <div className="h-10 w-56 animate-pulse rounded-xl bg-slate-200" />
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5"><div className="flex gap-3">{[1, 2, 3, 4].map((item) => <div key={item} className="h-9 w-32 animate-pulse rounded-xl bg-slate-100" />)}</div></div>
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">{[1, 2, 3, 4].map((item) => <div key={item} className="flex gap-6 border-b border-[#EEF2F6] p-5"><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /><div className="h-4 w-40 animate-pulse rounded bg-slate-100" /><div className="h-4 w-32 animate-pulse rounded bg-slate-100" /></div>)}</div>
  </div>;
  const selectedBulkStudents = students.filter((item) => selectedBulkStudentIds.has(item.id));
  const selectedBulkPackage = activePackages.find((item) => item.id === bulkPackageId);
  const bulkContentOptions = selectedBulkPackage ? contentPackages.filter((item) => item.status === 'active' && (!selectedBulkPackage.selectableContentPackageIds?.length || selectedBulkPackage.selectableContentPackageIds.includes(item.id))) : [];
  const selectedBulkContentPackages = bulkContentOptions.filter((item) => bulkContentPackageIds.includes(item.id));
  const bulkContentSelectionLimit = Math.max(1, selectedBulkPackage?.selectableContentPackageCount ?? 1);
  const bulkInstitutionGroups = [...new Set(selectedBulkStudents.map((item) => item.institutionId))].map((institutionId) => {
    const institution = institutions.find((item) => item.id === institutionId);
    const users = selectedBulkStudents.filter((item) => item.institutionId === institutionId);
    const requiredQuota = (selectedBulkPackage?.quotaCost ?? 0) * users.length;
    const authorized = Boolean(selectedBulkPackage && institution?.availableServicePackageIds?.includes(selectedBulkPackage.id));
    const contentAuthorized = selectedBulkContentPackages.every((content) => (institution?.availableContentPackages ?? []).some((value) => value === content.id || value === content.name));
    return { institutionId, institution, users, requiredQuota, authorized, contentAuthorized, canSettle: Boolean(institution && authorized && contentAuthorized && institution.status === 'active' && institution.remainingQuota >= requiredQuota) };
  });

  const handleBulkFulfill = () => {
    if (!selectedBulkPackage || selectedBulkStudents.length === 0 || !onFulfillServices) return;
    try {
      const duplicateStudents = selectedBulkStudents.filter((student) => mergedServiceRights.some((right) => right.studentId === student.id && right.packageId === selectedBulkPackage.id && right.status === 'pending'));
      const eligibleStudents = selectedBulkStudents.filter((student) => !duplicateStudents.some((duplicate) => duplicate.id === student.id));
      if (eligibleStudents.length === 0) {
        setBulkMessage(`未执行：${duplicateStudents.map((item) => item.name).join('、')}已有待激活的同款服务。`);
        return;
      }
      const batch = createBulkServiceFulfillments({
        students: eligibleStudents,
        servicePackage: selectedBulkPackage,
        now: new Date(),
        nonce: Math.random().toString().slice(2, 6).padEnd(4, '0'),
        contentPackages: selectedBulkContentPackages,
        existingRights: mergedServiceRights,
      });
      const outcome = onFulfillServices(batch.results);
      const failedStudentIds = [...outcome.failed.flatMap((item) => item.studentIds), ...duplicateStudents.map((item) => item.id)];
      const failureDescriptions = [
        ...outcome.failed.map((item) => `${item.institutionName}：${item.reason}`),
        ...(duplicateStudents.length ? [`${duplicateStudents.map((item) => item.name).join('、')}：已有待激活的同款服务`] : []),
      ];
      setBulkMessage(`成功 ${outcome.succeededStudentIds.length} 人，失败 ${failedStudentIds.length} 人，实际扣除 ${outcome.totalQuotaConsumed.toLocaleString()} 点。${failureDescriptions.length ? ` ${failureDescriptions.join('；')}` : ''}`);
      setSelectedBulkStudentIds(new Set(failedStudentIds));
    } catch (caught) {
      setBulkMessage(caught instanceof Error ? caught.message : '批量开通失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div><h1 className="text-[20px] font-extrabold text-[#0F172A]">学生管理</h1><p className="mt-1 text-[12px] text-[#64748B]">{viewerRole === 'teacher' ? '查看你负责学生的服务状态和学习情况。' : '导入学生，或勾选多名学生后批量办理服务。'}</p></div>
        {canManageServices && <div className="flex items-center gap-2">
          {onAddStudents && <button type="button" onClick={() => openImportDialog()} className="rounded-xl border border-[#86D6A5] bg-white px-4 py-2.5 text-[13px] font-bold text-[#0E7D3E] hover:bg-[#F0FBF4]">导入学生</button>}
          <button type="button" disabled={selectedBulkStudentIds.size === 0} onClick={() => setBulkMode(true)} title={selectedBulkStudentIds.size === 0 ? '请先在下方勾选学生' : `为已选 ${selectedBulkStudentIds.size} 名学生办理服务`} className="rounded-xl bg-[#16B45B] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-[#109E4E] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:shadow-none">办理服务{selectedBulkStudentIds.size > 0 ? `（${selectedBulkStudentIds.size}）` : ''}</button>
        </div>}
      </div>

      {/* Tab 1: Student Roster */}
      {(
        <div className="space-y-4">
          {students.length === 0 ? <div className="rounded-2xl border border-[#CDE8D8] bg-white px-6 py-12 text-center shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F7EE] text-[#0E7D3E]"><span className="material-symbols-outlined text-[30px]">group_add</span></div>
            <h2 className="mt-4 text-[18px] font-bold text-[#0F172A]">{viewerRole === 'teacher' ? '暂时还没有分配给你的学生' : '还没有学生，先完成首次导入'}</h2>
            <p className="mx-auto mt-2 max-w-xl text-[12px] leading-6 text-[#64748B]">{viewerRole === 'teacher' ? '学生由机构管理员导入并按负责教师分配。分配完成后，你会在这里看到自己的学生名单、整体学习情况和个人详情。' : '直接上传学生名单；负责教师可以不选，未分配的学生先由机构管理员统一管理，后续再转让。'}</p>
            {canManageServices && onAddStudents && <div className="mt-6 flex justify-center"><button type="button" onClick={() => openImportDialog()} className="rounded-xl bg-[#16B45B] px-4 py-2.5 text-[13px] font-bold text-white">导入学生</button></div>}
          </div> : <>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索学生姓名、账号、手机号、负责教师或机构…"
                aria-label="搜索学生"
                className="w-72 rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16B45B]"
              />
              {viewerRole === 'super_admin' && <select aria-label="按机构筛选" value={institutionFilter} onChange={(e) => { setInstitutionFilter(e.target.value); setTeacherFilter(''); setGradeFilter(''); }} className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16B45B]"><option value="">全部机构</option>{filterOptions.institutions.map((value) => <option key={value} value={value}>{value}</option>)}</select>}
              {viewerRole !== 'teacher' && <select aria-label="按教师筛选" value={teacherFilter} onChange={(e) => { setTeacherFilter(e.target.value); setClassFilter(''); setGradeFilter(''); }} className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16B45B]"><option value="">全部老师</option>{filterOptions.teachers.map((value) => <option key={value} value={value}>{value}</option>)}</select>}
              <select aria-label="按服务状态筛选" value={serviceStatusFilter} onChange={(e) => setServiceStatusFilter(e.target.value)} className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16B45B]"><option value="">全部状态 · {studentStats.total}</option><option value="active">服务中 · {studentStats.serviceActive}</option><option value="none">待办理 · {studentStats.needsService}</option><option value="expiring">即将到期 · {studentStats.expiringSoon}</option></select>
              <select aria-label="按班级筛选" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setGradeFilter(''); }} className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16B45B]"><option value="">全部班级</option>{filterOptions.classes.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <select aria-label="按年级筛选" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16B45B]"><option value="">全部年级</option>{gradeOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              {hasRosterFilters && <button onClick={() => { setSearchTerm(''); setServiceStatusFilter(''); setInstitutionFilter(''); setTeacherFilter(''); setClassFilter(''); setGradeFilter(''); }} className="text-[12px] font-bold text-[#16B45B]">清除</button>}
              </div>
            </div>
          </div>

          {canManageServices && selectedBulkStudentIds.size > 0 && <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#A7E4BE] bg-[#F0FBF4] px-4 py-3 shadow-sm"><p className="text-[12px] font-bold text-[#0E7D3E]">已选择 {selectedBulkStudentIds.size} 名学生</p><div className="flex items-center gap-2"><button type="button" onClick={() => { setSelectedBulkStudentIds(new Set()); setBulkMode(false); }} className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-[#64748B] hover:bg-white/70">取消选择</button><button type="button" onClick={() => setBulkMode(true)} className="rounded-lg bg-[#16B45B] px-3 py-1.5 text-[12px] font-bold text-white shadow-sm hover:bg-[#109E4E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16B45B]">办理服务</button></div></div>}

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <tr>
                  {canManageServices && <th className="py-3 px-4"><input type="checkbox" aria-label="全选当前筛选结果用于批量办理" checked={filteredStudents.length > 0 && filteredStudents.every((item) => selectedBulkStudentIds.has(item.id))} onChange={(event) => setSelectedBulkStudentIds(event.target.checked ? new Set(filteredStudents.map((item) => item.id)) : new Set())} /></th>}
                  <th className="py-3 px-4">学生 / 登录账号</th>
                  <th className="py-3 px-4">归属</th>
                  <th className="py-3 px-4 text-center">服务状态</th>
                  <th className="py-3 px-4 text-center">有效期至</th>
                  <th className="py-3 px-4">服务包 / 内容包</th>
                  <th className="py-3 px-4 text-center">最近使用</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredStudents.length === 0 ? <tr><td colSpan={canManageServices ? 8 : 7} className="px-6 py-12 text-center text-[#64748B]">没有符合当前筛选条件的学生</td></tr> : filteredStudents.map((stu) => {
                  const latestRight = mergedServiceRights.find((item) => item.studentId === stu.id);
                  const serviceStatus = latestRight?.status ?? (stu.serviceStatus === 'none' ? 'pending' : stu.serviceStatus);
                  const serviceStatusLabel = { pending: latestRight ? '待激活' : '待办理', active: '服务中', expired: '已到期', revoked: '已撤销' }[serviceStatus];
                  const recentUse = formatRecentMiniProgramUse(stu.lastMiniProgramActiveAt);
                  return (
                  <tr key={stu.id} className="hover:bg-[#F8FAFC]">
                    {canManageServices && <td className="py-3 px-4"><input type="checkbox" aria-label={`选择${stu.name}用于批量办理`} checked={selectedBulkStudentIds.has(stu.id)} onChange={(event) => setSelectedBulkStudentIds((current) => { const next = new Set(current); event.target.checked ? next.add(stu.id) : next.delete(stu.id); return next; })} /></td>}
                    <td className="py-3 px-4"><button onClick={() => setDetailStudent(stu)} className="font-bold text-[#0F172A] hover:text-[#16B45B]">{stu.name}</button><div className="mt-0.5 font-mono text-[11px] text-[#64748B]">{stu.account}{stu.phone ? ` · ${stu.phone}` : ''}</div>
                      <span className={`px-1.5 py-0.5 text-[10px] rounded ${guardianships.some((item) => item.studentId === stu.id && item.status === 'active') ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}>{guardianships.some((item) => item.studentId === stu.id && item.status === 'active') ? '家长已绑' : '家长待绑'}</span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#64748B]"><div className="font-bold text-[#475569]">主负责：{stu.teacherName || '机构管理员'} · {stu.grade}</div>{stu.teacherAssignments?.length ? <div className="mt-0.5 text-[#0E7D3E]">任课：{stu.teacherAssignments.map((item) => `${item.teacherName}（${item.subject}）`).join('、')}</div> : null}<div className="mt-0.5">{stu.className || '未设置班级'} · {stu.institutionName}</div></td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        serviceStatus === 'active' ? 'bg-green-100 text-green-700' : serviceStatus === 'expired' || serviceStatus === 'revoked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {serviceStatusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-[#64748B] font-mono text-[12px]">
                      {latestRight?.serviceExpireAt || stu.serviceExpireAt || (serviceStatus === 'pending' ? '激活后计算' : '待定')}
                    </td>
                    <td className="py-3 px-4"><div className="font-bold text-[#0E7D3E]">{latestRight?.packageName || '未开通'}</div><div className="mt-1 text-[11px] text-[#64748B]">{latestRight?.contentPackageNames?.length ? latestRight.contentPackageNames.join(' / ') : '未选择内容包'}</div></td>
                    <td className="py-3 px-4 text-center">
                      <span title={stu.lastMiniProgramActiveAt || '尚未进入小程序'} className={`text-[12px] font-bold ${recentUse.className}`}>{recentUse.label}</span>
                    </td>
                    <td className="py-3 px-4 text-right"><div className="flex justify-end gap-3"><button onClick={() => setDetailStudent(stu)} className="text-[12px] font-bold text-[#64748B] hover:text-[#0F172A]">详情</button>{canManageServices && onAssignTeacher && <button onClick={() => { setAssignTeacherStudent(stu); setAssignmentTeacherId(stu.teacherId || ''); setTeachingAssignmentsDraft(stu.teacherAssignments ?? []); }} className="text-[12px] font-bold text-[#0E7D3E] hover:underline">管理教师</button>}{canManageServices && <button onClick={() => setServiceStudent(stu)} className="rounded-lg border border-[#86D6A5] bg-[#F0FBF4] px-3 py-1.5 text-[12px] font-bold text-[#0E7D3E] hover:bg-[#E3F7EA]">{serviceStatus === 'active' ? '续费' : '办理服务'}</button>}</div></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
          </>}
        </div>
      )}

      {bulkMode && selectedBulkStudentIds.size > 0 && canManageServices && (
        <DialogShell
          title={`批量办理服务 · 已选 ${selectedBulkStudentIds.size} 名学生`}
          description="选择服务包和内容包，系统将按所属机构校验授权和余额。"
          icon="inventory_2"
          maxWidthClass="max-w-5xl"
          onClose={() => setBulkMode(false)}
          footer={<div className="flex w-full flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-[#64748B]">关闭弹窗不会取消已勾选的学生。</p><div className="flex gap-2"><button type="button" onClick={() => setBulkMode(false)} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-[13px] font-bold text-[#64748B] hover:bg-[#F8FAFC]">取消</button><button type="button" disabled={!onFulfillServices || (bulkContentOptions.length > 0 && bulkContentPackageIds.length === 0) || bulkInstitutionGroups.every((group) => !group.canSettle)} onClick={handleBulkFulfill} className="rounded-xl bg-[#16B45B] px-5 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-[#109E4E] disabled:bg-[#94A3B8] disabled:shadow-none">确认开通并按机构扣点</button></div></div>}
        >
        <div className="space-y-4">
          <details open={selectedBulkStudents.length <= 6} className="group rounded-2xl border border-[#CDE8D8] bg-[#F3FBF6] p-4">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16B45B]">
              <div className="flex items-center gap-2"><span aria-hidden="true" className="material-symbols-outlined text-[19px] text-[#0E7D3E]">group</span><h3 className="text-[13px] font-bold text-[#0F172A]">本次办理学生（{selectedBulkStudents.length} 人）</h3></div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B]"><span>{selectedBulkStudents.slice(0, 3).map((student) => student.name).join('、')}{selectedBulkStudents.length > 3 ? ` 等 ${selectedBulkStudents.length} 人` : ''}</span><span aria-hidden="true" className="material-symbols-outlined text-[18px] transition-transform group-open:rotate-180">expand_more</span></div>
            </summary>
            <div className="mt-3 grid gap-2 border-t border-[#DCEFE3] pt-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedBulkStudents.map((student) => <div key={student.id} className="rounded-xl border border-[#DCEFE3] bg-white px-3 py-2.5"><div className="flex items-center justify-between gap-2"><strong className="text-[12.5px] text-[#0F172A]">{student.name}</strong><span className="shrink-0 text-[10.5px] text-[#64748B]">{student.grade}</span></div><p className="mt-1 truncate text-[11px] text-[#64748B]">{student.teacherName || '机构管理员暂管'} · {student.className || '未设置班级'}</p></div>)}
            </div>
          </details>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><h3 className="text-[16px] font-bold text-[#0F172A]">请选择服务包</h3><p className="mt-1 text-[12px] text-[#64748B]">为当前勾选的 {selectedBulkStudentIds.size} 名学生统一配置。</p></div>
              <label className="text-[12px] font-bold text-[#475569]">服务包
                <select value={selectedBulkPackage?.id ?? ''} onChange={(event) => { setBulkPackageId(event.target.value); setBulkContentPackageIds([]); }} className="ml-2 rounded-xl border border-[#E2E8F0] px-3 py-2 text-[13px] outline-none focus:border-[#16B45B]">
                  <option value="">请选择服务包</option>
                  {activePackages.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quotaCost} 点/人</option>)}
                </select>
              </label>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5"><div className="flex items-center justify-between"><h4 className="text-[14px] font-bold">选择内容包</h4><span className="text-[11px] text-[#64748B]">已选 {bulkContentPackageIds.length} / 最多 {bulkContentSelectionLimit} 个</span></div><div className="mt-3 grid gap-2 md:grid-cols-2">{bulkContentOptions.map((item) => { const checked = bulkContentPackageIds.includes(item.id); const disabled = !checked && bulkContentPackageIds.length >= bulkContentSelectionLimit; return <label key={item.id} className={`rounded-xl border p-3 text-[12px] ${checked ? 'border-[#16B45B] bg-[#F0FBF4]' : disabled ? 'cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] opacity-50' : 'cursor-pointer border-[#E2E8F0]'}`}><input className="mr-2" type="checkbox" checked={checked} disabled={disabled} onChange={(event) => setBulkContentPackageIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />{item.name}</label>; })}</div></div>
          {selectedBulkStudents.length > 0 && <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <h4 className="text-[14px] font-bold text-[#0F172A]">机构结算预览</h4>
            <div className="mt-3 space-y-2">{bulkInstitutionGroups.map((group) => <div key={group.institutionId} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-[12px] ${group.canSettle ? 'bg-[#F0FBF4]' : 'bg-red-50'}`}><div><strong>{group.institution?.name ?? group.users[0]?.institutionName}</strong><span className="ml-2 text-[#64748B]">{group.users.length} 人 × {selectedBulkPackage?.quotaCost ?? 0} 点</span></div><div className={group.canSettle ? 'text-[#0E7D3E]' : 'text-red-700'}>{!group.institution ? '未找到机构账户' : !group.authorized ? '该机构未授权此服务包' : !group.contentAuthorized ? '该机构未授权所选内容包' : group.institution.remainingQuota < group.requiredQuota ? `余额不足，还差 ${(group.requiredQuota - group.institution.remainingQuota).toLocaleString()} 点` : `扣除 ${group.requiredQuota.toLocaleString()} 点，剩余 ${(group.institution.remainingQuota - group.requiredQuota).toLocaleString()} 点`}</div></div>)}</div>
            {bulkMessage && <div className="mt-3 rounded-xl bg-[#F8FAFC] px-3 py-2 text-[12px] text-[#475569]">{bulkMessage}</div>}
          </div>}
        </div>
        </DialogShell>
      )}

      {false && (
        <div className="space-y-4">
          {mergedServiceRights.map((right) => {
            const authCode = authCodes.find((item) => item.id === right.authCodeId);
            const guardianCode = guardianBindingCodes.find((item) => item.studentId === right.studentId);
            return <div key={right.id} className="rounded-2xl border border-[#A7E4BE] bg-white p-5 shadow-2xs">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-[16px] font-bold text-[#0F172A]">{right.studentName} · {right.packageName}</h3><p className="mt-1 text-[12px] text-[#64748B]">{right.institutionName} · {right.teacherName}</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">待激活</span></div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-[#F8FAFC] p-3"><div className="text-[11px] text-[#64748B]">今日 AI 用量</div><div className="mt-1 font-bold">{(right.todayAiUsage ?? 0).toLocaleString()} / {right.includedAiUsage.toLocaleString()}</div></div>
                <div className="rounded-xl bg-[#F8FAFC] p-3"><div className="text-[11px] text-[#64748B]">学生授权码</div><div className="mt-1 font-mono font-bold text-[#16B45B]">{authCode?.code || '待生成'}</div></div>
                <div className="rounded-xl bg-[#F8FAFC] p-3"><div className="text-[11px] text-[#64748B]">家长绑定码</div><div className="mt-1 font-mono font-bold text-[#16B45B]">{guardianCode?.code || '待生成'}</div></div>
                <div className="rounded-xl bg-[#F8FAFC] p-3"><div className="text-[11px] text-[#64748B]">服务到期时间</div><div className="mt-1 font-bold">{right.serviceExpireAt || '长期有效'}</div></div>
              </div>
            </div>;
          })}
          <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs">
          <div className="border-b border-[#E2E8F0] px-5 py-4"><h3 className="text-[15px] font-bold">服务权益记录</h3><p className="mt-1 text-[12px] text-[#64748B]">办理结果统一回写到这里；需要新办服务时，请从学生花名册选择学生。</p></div>
          <div className="overflow-x-auto custom-scrollbar"><table className="w-full min-w-[900px] text-left text-[13px]">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-4 py-3">授权码</th><th className="px-4 py-3">学生</th><th className="px-4 py-3">所属机构</th><th className="px-4 py-3">责任教师</th><th className="px-4 py-3">服务包权益</th><th className="px-4 py-3">到期时间</th><th className="px-4 py-3 text-center">状态</th><th className="px-4 py-3 text-right">操作</th></tr></thead>
            <tbody className="divide-y divide-[#E2E8F0]">{studentRights.length === 0 ? <tr><td colSpan={8} className="px-6 py-12 text-center text-[#64748B]">暂无服务权益记录</td></tr> : studentRights.map((right) => <tr key={right.id}><td className="px-4 py-3.5 font-mono font-bold text-[#16B45B]">{right.code}</td><td className="px-4 py-3.5 font-bold">{right.studentName}</td><td className="px-4 py-3.5">{right.institutionName}</td><td className="px-4 py-3.5">{right.teacherName}</td><td className="px-4 py-3.5 font-bold text-[#0E7D3E]">{right.packageName}</td><td className="px-4 py-3.5 text-[12px] text-[#64748B]">{right.expireAt}</td><td className="px-4 py-3.5 text-center"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${right.status === 'used' ? 'bg-green-100 text-green-700' : right.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{right.statusLabel}</span></td><td className="px-4 py-3.5 text-right">{right.status === 'pending' && <button onClick={() => onRevokeAuthCode(right.id)} className="text-[12px] font-bold text-red-500">作废</button>}</td></tr>)}</tbody>
          </table></div>
          </div>
        </div>
      )}

      {/* Tab 2: WeChat Rebind Requests */}
      {false && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 text-[13px] text-[#64748B]">
            机构提交线下学生身份核验凭证后，平台管理员在此进行终审并重置学生微信绑定关系
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <tr>
                  <th className="py-3 px-4">申请单号</th>
                  <th className="py-3 px-4">学生姓名</th>
                  <th className="py-3 px-4">所属机构</th>
                  <th className="py-3 px-4">换绑事由</th>
                  <th className="py-3 px-4">身份证明文件</th>
                  <th className="py-3 px-4">提交教师/时间</th>
                  <th className="py-3 px-4 text-center">审核状态</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {rebindRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{req.id}</td>
                    <td className="py-3 px-4 font-bold">{req.studentName}</td>
                    <td className="py-3 px-4 font-bold">{req.institutionName}</td>
                    <td className="py-3 px-4 text-[12px] text-[#64748B] max-w-xs">{req.applyReason}</td>
                    <td className="py-3 px-4 text-[12px] text-blue-600 font-bold underline cursor-pointer">
                      {req.proofDocument}
                    </td>
                    <td className="py-3 px-4 text-[12px]">
                      <div>{req.applicant}</div>
                      <div className="text-[#94A3B8]">{req.applyTime}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {req.status === 'approved' ? '已同意解绑' : req.status === 'rejected' ? '已拒绝' : '待人工审核'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReviewRebind(req.id, true)}
                            className="bg-[#16B45B] text-white px-2.5 py-1 rounded text-[11px] font-bold hover:bg-[#139B4E] cursor-pointer"
                          >
                            通过解绑
                          </button>
                          <button
                            onClick={() => handleReviewRebind(req.id, false)}
                            className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded text-[11px] font-bold hover:bg-red-100 cursor-pointer"
                          >
                            拒绝
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Guardianship */}
      {false && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs custom-scrollbar">
          <table className="w-full min-w-[800px] text-left text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
              <tr>
                <th className="py-3 px-4">家长姓名/手机</th>
                <th className="py-3 px-4">绑定学生</th>
                <th className="py-3 px-4">所属机构</th>
                <th className="py-3 px-4">监护关系</th>
                <th className="py-3 px-4 text-center">关系状态</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {guardianships.map((g) => (
                <tr key={g.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4 font-bold">
                    {g.parentName}
                    <div className="text-[11px] font-mono text-[#64748B]">{g.parentPhone}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#0F172A]">{g.studentName}</td>
                  <td className="py-3 px-4">{g.institutionName}</td>
                  <td className="py-3 px-4 font-bold">{g.relationType}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      g.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {g.status === 'active' ? '有效绑定' : '解绑/失效'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {g.status === 'active' && (
                      <button
                        onClick={() => onUpdateGuardianshipStatus(g.id, 'released')}
                        className="text-red-500 hover:underline font-bold text-[12px] cursor-pointer"
                      >
                        强制解绑
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
              <div><h3 className="text-[15px] font-bold">家长绑定码</h3><p className="mt-1 text-[12px] text-[#64748B]">用于建立家长与学生的监护关系，不开通学生服务。</p></div>
              <span className="text-[12px] text-[#64748B]">家长绑定码在办理学生服务时自动生成</span>
            </div>
            <div className="overflow-x-auto custom-scrollbar"><table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-4 py-3">家长绑定码</th><th className="px-4 py-3">目标学生</th><th className="px-4 py-3">所属机构</th><th className="px-4 py-3">生成时间</th><th className="px-4 py-3">到期时间</th><th className="px-4 py-3 text-center">状态</th></tr></thead>
              <tbody className="divide-y divide-[#E2E8F0]">{guardianBindingCodes.length === 0 ? <tr><td colSpan={6} className="px-6 py-10 text-center text-[#64748B]">暂无家长绑定码</td></tr> : guardianBindingCodes.map((item) => <tr key={item.id}><td className="px-4 py-3.5 font-mono font-bold text-[#16B45B]">{item.code}</td><td className="px-4 py-3.5 font-bold">{item.studentName}</td><td className="px-4 py-3.5">{item.institutionName}</td><td className="px-4 py-3.5 text-[12px] text-[#64748B]">{item.createdAt}</td><td className="px-4 py-3.5 text-[12px] text-[#64748B]">{item.expireAt}</td><td className="px-4 py-3.5 text-center"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.status === 'bound' ? 'bg-green-100 text-green-700' : item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{item.status === 'bound' ? '已绑定' : item.status === 'pending' ? '待绑定' : '已失效'}</span></td></tr>)}</tbody>
            </table></div>
          </div>
        </div>
      )}

      {assignTeacherStudent && canManageServices && onAssignTeacher && (
        <DialogShell
          title="管理学生教师"
          description={`${assignTeacherStudent.name} · 设置一名主负责教师，并可增加多名学科任课教师。`}
          onClose={() => setAssignTeacherStudent(null)}
          maxWidthClass="max-w-2xl"
          footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setAssignTeacherStudent(null)} className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-[13px] font-bold text-[#64748B]">取消</button><button type="button" disabled={!assignmentTeacherId} onClick={() => { onAssignTeacher(assignTeacherStudent.id, assignmentTeacherId); onUpdateTeacherAssignments?.(assignTeacherStudent.id, teachingAssignmentsDraft.filter((item) => item.teacherId !== assignmentTeacherId)); setAssignTeacherStudent(null); }} className="rounded-xl bg-[#16B45B] px-4 py-2 text-[13px] font-bold text-white disabled:bg-[#94A3B8]">保存教师配置</button></div>}
        >
          <div className="space-y-4">
            <label className="block text-[12px] font-bold text-[#475569]">主负责教师<select autoFocus value={assignmentTeacherId} onChange={(event) => setAssignmentTeacherId(event.target.value)} className="mt-2 w-full rounded-xl border border-[#CDE8D8] bg-white px-3 py-2.5 text-[13px] text-[#0F172A]"><option value="">请选择主负责教师</option>{teachers.filter((teacher) => teacher.status === 'active' && teacher.institutionId === assignTeacherStudent.institutionId).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}{teacher.subject ? ` · ${teacher.subject}` : ''}</option>)}</select></label>
            <section className="rounded-xl border border-[#E2E8F0] bg-white p-4"><div><h4 className="text-[13px] font-bold">学科任课教师</h4><p className="mt-1 text-[11px] text-[#64748B]">可多选。勾选后自动使用教师账号中的任教学科，仍可按实际情况调整。</p></div><div className="mt-3 space-y-2">{teachers.filter((teacher) => teacher.status === 'active' && teacher.institutionId === assignTeacherStudent.institutionId && teacher.id !== assignmentTeacherId).map((teacher) => { const assignment = teachingAssignmentsDraft.find((item) => item.teacherId === teacher.id); return <div key={teacher.id} className={`grid items-center gap-3 rounded-xl border px-3 py-2.5 sm:grid-cols-[1fr_180px] ${assignment ? 'border-[#86D6A5] bg-[#F0FBF4]' : 'border-[#E2E8F0]'}`}><label className="flex cursor-pointer items-center gap-2 text-[12px] font-bold"><input type="checkbox" checked={Boolean(assignment)} onChange={(event) => setTeachingAssignmentsDraft((current) => event.target.checked ? [...current, { teacherId: teacher.id, teacherName: teacher.name, subject: teacher.subject || subjectOptions[0] || '未设置学科' }] : current.filter((item) => item.teacherId !== teacher.id))} />{teacher.name}<span className="text-[11px] font-normal text-[#0E7D3E]">{teacher.subject || '待补充学科'}</span></label>{assignment && <select aria-label={`${teacher.name}任教学科`} value={assignment.subject} onChange={(event) => setTeachingAssignmentsDraft((current) => current.map((item) => item.teacherId === teacher.id ? { ...item, subject: event.target.value } : item))} className="rounded-lg border border-[#CDE8D8] bg-white px-2.5 py-2 text-[12px]"><option value="">请选择任教学科</option>{subjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select>}</div>; })}</div></section>
            <p className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-[11px] leading-5 text-[#64748B]">主负责教师用于学生归属和服务办理；任课教师只获得该学生的查看与学情权限。</p>
          </div>
        </DialogShell>
      )}

      {isImportOpen && canManageServices && (
        <DialogShell title="导入学生" description="系统按 Excel 中的负责教师姓名自动归属；留空时由机构管理员暂管。" onClose={() => setIsImportOpen(false)} maxWidthClass="max-w-2xl">
          <div className="space-y-4">
            <div className="rounded-xl bg-[#F0FBF4] p-4 text-[12px]">
              <label className="block max-w-md font-bold text-[#475569]">所属机构<select value={importInstitutionId} onChange={(event) => { setImportInstitutionId(event.target.value); setImportStudents([]); setImportErrors([]); }} className="mt-1.5 block w-full rounded-xl border border-[#CDE8D8] bg-white px-3 py-2 text-[13px] text-[#0F172A]">{institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}</select></label>
              <p className="mt-3 text-[11px] leading-5 text-[#4B8060]">归属以 Excel 的“负责教师姓名（选填）”为准；教师姓名必须与本机构教师一致，留空则由机构管理员暂管。</p>
            </div>
            <div className="rounded-xl border border-dashed border-[#A7E4BE] bg-[#F8FFFA] p-5 text-center">
              <p className="text-[13px] font-bold text-[#0F172A]">上传学生 Excel</p>
              <p className="mt-1 text-[11px] text-[#64748B]">必填：学生姓名、登录账号、登录密码、手机号和年级；负责教师、班级可选。</p>
              <div className="mt-3 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => downloadImportTemplate('classStudents')} className="rounded-lg border border-[#86D6A5] bg-white px-3 py-2 text-[12px] font-bold text-[#0E7D3E]">下载学生模板</button><label className="cursor-pointer rounded-lg bg-[#16B45B] px-3 py-2 text-[12px] font-bold text-white">选择 Excel<input type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleStudentImportFile(file); event.target.value = ''; }} /></label></div>
              {importFileName && <p className="mt-3 text-[11px] text-[#64748B]">已读取：{importFileName}</p>}
            </div>
            {(importStudents.length > 0 || importErrors.length > 0 || importSkipped.length > 0) && <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#F0FBF4] p-3"><span className="text-[11px] text-[#4B8060]">新增学生</span><strong className="mt-1 block text-[20px] text-[#0E7D3E]">{importStudents.length} 人</strong></div><div className="rounded-xl bg-amber-50 p-3"><span className="text-[11px] text-amber-700">已有学生跳过</span><strong className="mt-1 block text-[20px] text-amber-700">{importSkipped.length} 人</strong></div><div className={`rounded-xl p-3 ${importErrors.length ? 'bg-red-50' : 'bg-[#F8FAFC]'}`}><span className="text-[11px] text-[#64748B]">校验问题</span><strong className={`mt-1 block text-[20px] ${importErrors.length ? 'text-red-600' : 'text-[#0F172A]'}`}>{importErrors.length} 条</strong></div></div>}
            {importSkipped.length > 0 && <div className="max-h-24 overflow-y-auto rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-700">{importSkipped.map((item) => <p key={item}>{item}</p>)}</div>}
            {importErrors.length > 0 && <div className="max-h-32 overflow-y-auto rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">{importErrors.map((item) => <p key={item}>{item}</p>)}</div>}
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsImportOpen(false)} className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-[13px] font-bold text-[#64748B]">取消</button><button type="button" disabled={!importStudents.length || !onAddStudents} onClick={handleConfirmStudentImport} className="rounded-xl bg-[#16B45B] px-4 py-2 text-[13px] font-bold text-white disabled:bg-[#94A3B8]">确认导入 {importStudents.length || ''} 名学生</button></div>
          </div>
        </DialogShell>
      )}

      {detailStudent && (() => {
        const rights = mergedServiceRights.filter((item) => item.studentId === detailStudent.id);
        const guardian = guardianships.find((item) => item.studentId === detailStudent.id);
        const bindingCode = guardianBindingCodes.find((item) => item.studentId === detailStudent.id);
        const institution = institutions.find((item) => item.id === detailStudent.institutionId);
        const reminders = serviceReminders.filter((item) => item.studentId === detailStudent.id && !dismissedReminderIds.has(item.id));
        return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={`学生详情 · ${detailStudent.name}`}>
          <section className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between border-b border-[#E2E8F0] bg-white px-6 py-5">
              <div><h3 className="text-[18px] font-bold text-[#0F172A]">{detailStudent.name}</h3><p className="mt-1 text-[12px] text-[#64748B]">{detailStudent.institutionName} · {detailStudent.grade} · 负责教师 {detailStudent.teacherName}</p></div>
              <button onClick={() => setDetailStudent(null)} className="rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9]" aria-label="关闭"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4 overflow-y-auto bg-[#F8FAFC]/70 p-5 custom-scrollbar">
              <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                <h4 className="text-[14px] font-bold text-[#0F172A]">基本资料</h4>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]"><div><span className="text-[#94A3B8]">登录账号</span><p className="mt-1 font-mono font-bold">{detailStudent.account}</p></div><div><span className="text-[#94A3B8]">手机号</span><p className="mt-1 font-mono font-bold">{detailStudent.phone || '未填写'}</p></div><div><span className="text-[#94A3B8]">登录密码</span><p className="mt-1 font-bold">{detailStudent.loginPassword ? '已设置（不明文展示）' : '未设置'}</p></div><div><span className="text-[#94A3B8]">服务状态</span><p className="mt-1 font-bold">{rights.some((item) => item.status === 'active') ? '服务中' : rights.some((item) => item.status === 'pending') ? '待激活' : detailStudent.serviceStatus === 'expired' ? '已到期' : '待办理'}</p></div><div><span className="text-[#94A3B8]">所属机构统一账户</span><p className="mt-1 font-mono font-bold text-[#0E7D3E]">{institution ? `${institution.remainingQuota.toLocaleString()} 点` : '未找到机构账户'}</p></div></div>
              </section>
              <StudentServiceReminderCards reminders={reminders} onDismiss={(id) => setDismissedReminderIds((current) => new Set([...current, id]))} />
              <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                <div><h4 className="text-[14px] font-bold text-[#0F172A]">服务权益</h4><p className="mt-1 text-[11px] text-[#64748B]">每笔服务包、每日 AI 用量上限、双码和有效期分别保留；开通服务直接从所属机构统一账户扣点。</p></div>
                <div className="mt-3 space-y-2">{rights.length === 0 ? <div className="rounded-xl bg-[#F8FAFC] p-4 text-[12px] text-[#94A3B8]">暂无服务权益</div> : rights.map((right) => {
                  const authCode = authCodes.find((item) => item.id === right.authCodeId);
                  const rightStatus = { pending: '待激活', active: '服务中', expired: '已到期', revoked: '已撤销' }[right.status];
                  const authStatus = authCode ? { pending: '待激活', used: '已激活', expired: '已过期', revoked: '已作废' }[authCode.status] : '待生成';
                  const guardianStatus = bindingCode ? { pending: '待绑定', bound: '已绑定', expired: '已失效' }[bindingCode.status] : '待生成';
                  return <div key={right.id} className="rounded-xl border border-[#E2E8F0] p-3">
                    <div className="flex justify-between gap-3"><strong className="text-[13px]">{right.packageName}</strong><span className={`text-[11px] font-bold ${right.status === 'active' ? 'text-[#0E7D3E]' : right.status === 'pending' ? 'text-amber-700' : 'text-[#64748B]'}`}>{rightStatus}</span></div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[#64748B]"><span>今日 AI 用量 {(right.todayAiUsage ?? 0).toLocaleString()} / 每日上限 {right.includedAiUsage.toLocaleString()}</span><span>到期 {right.serviceExpireAt || '长期有效'}</span><span>内容包 {(right.contentPackageNames ?? []).join(' / ') || '历史权益未记录'}</span><span>{right.fulfillmentKind === 'renewal' ? '续费' : '开通'}</span><span className="font-mono text-[#0E7D3E]">学生授权码 {authCode?.code || '待生成'} · {authStatus}</span><span className="font-mono text-[#0E7D3E]">家长绑定码 {bindingCode?.code || '待生成'} · {guardianStatus}</span></div>
                  </div>;
                })}</div>
              </section>
              <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                <h4 className="text-[14px] font-bold text-[#0F172A]">家长关系</h4>
                {guardian ? <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F8FAFC] p-3"><div><div className="text-[13px] font-bold">{guardian.parentName}</div><div className="mt-1 text-[11px] text-[#64748B]">{guardian.relationType} · {guardian.parentPhone}</div></div><div className="flex items-center gap-3"><span className={`text-[11px] font-bold ${guardian.status === 'active' ? 'text-[#0E7D3E]' : 'text-amber-700'}`}>{guardian.status === 'active' ? '已绑定' : '待绑定'}</span>{guardian.status === 'active' && <button onClick={() => onUpdateGuardianshipStatus(guardian.id, 'released')} className="text-[11px] font-bold text-red-500">解除关系</button>}</div></div> : <div className="mt-3 rounded-xl bg-[#F8FAFC] p-3 text-[12px] text-[#64748B]">{bindingCode ? `家长绑定码 ${bindingCode.code} · 待绑定` : '暂无家长关系'}</div>}
              </section>
            </div>
            <div className="flex justify-end border-t border-[#E2E8F0] bg-white px-6 py-4"><button type="button" onClick={() => setDetailStudent(null)} className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2 text-[13px] font-bold text-[#475569] hover:bg-[#F8FAFC]">关闭</button></div>
          </section>
        </div>;
      })()}

      {serviceStudent && (
        <DialogShell
          title={`办理学生服务 · ${serviceStudent.name}`}
          description={`${serviceStudent.institutionName} · 负责教师 ${serviceStudent.teacherName}`}
          onClose={() => setServiceStudent(null)}
        >
          <ServiceFulfillmentPanel student={serviceStudent} packages={packages} institution={institutions.find((item) => item.id === serviceStudent.institutionId)} institutionRemainingQuota={institutions.find((item) => item.id === serviceStudent.institutionId)?.remainingQuota} contentPackages={contentPackages} existingRights={mergedServiceRights} onFulfill={onFulfillService} compact />
        </DialogShell>
      )}
    </div>
  );
};
