import React, { useMemo, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { canAccessRoute, getDefaultRouteForRole, type NavTab } from './navigation';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getPlatformRoute, getPlatformRouteId } from './router/platformRoutes';
import { Header } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';
import { InstitutionView } from './components/views/InstitutionView';
import { GoodsView } from './components/views/GoodsView';
import { QuestionBankView } from './components/views/QuestionBankView';
import { DashboardView } from './components/views/DashboardView';
import { SystemView } from './components/views/SystemView';
import { TeacherClassView } from './components/views/TeacherClassView';
import { StudentView } from './components/views/StudentView';
import { DiagnosticsView } from './components/views/DiagnosticsView';
import { HelpModal } from './components/modals/HelpModal';
import { Toast } from './components/ui/Toast';

import {
  initialPlatformStats,
  initialInstitutions,
  initialServicePackages,
  initialAuthCodes,
  initialKnowledgePoints,
  initialQuestions,
  initialStudents,
  initialAuditLogs,
  initialOrderLedger,
  initialParentGuardianships,
  initialContentPackages,
  initialCooperationPlans,
  initialTeachers,
} from './mockData';
import { buildGlobalSearchResults, deriveFulfillmentSnapshot } from './fulfillment';
import { deriveInstitutionDashboardSnapshot, derivePlatformDashboardSnapshot, deriveTeacherDashboardSnapshot } from './dashboardSnapshot';

import {
  Institution,
  ServicePackage,
  AuthCode,
  KnowledgePointNode,
  QuestionItem,
  AuditLogItem,
  CurrentUser,
  OrderLedgerRecord,
  GuardianBindingCode,
  StudentServiceRight,
  ServiceFulfillmentResult,
  CooperationPlan,
  TeacherItem,
  TeacherCreditLedgerEntry,
  InstitutionCreditEntry,
} from './types';
import { deriveLegacyServiceRights } from './domain/studentRights';
import { allocateTeacherCredits, debitTeacherForService, reclaimTeacherCredits } from './domain/teacherCredits';
import type { Role } from './permissions/accessControl';
import { scopeInstitutions, scopeStudents, scopeTeachers } from './permissions/dataScope';
import { createInstitutionCreditEntry } from './domain/institutionResources';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = getPlatformRouteId(location.pathname);
  const setCurrentTab = (tab: NavTab) => navigate(getPlatformRoute(tab).path);
  const [searchQuery, setSearchQuery] = useState('');

  // Authentication & Current User State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    id: 'SUPER-ADMIN-01',
    name: '超级管理员',
    username: 'admin@kaiqiao.com',
    role: 'super_admin',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwlJFf3rqYCHQdGUbnzIm6htn5M-2U5UiKb459aOQBJZvMuZadgZxKxWGD5YbBBg6370sr5V74N-b2qzfAeSrnCP22zzyr2NEz3RrTPirjEeoWwklqs6s4SkmZPOvC-cY_mtwVSC5EEC7qACcVVDAKRIBJDJIgARRv_ri26MDjLr-j3vbdqOd3kx0JaWD-qvv-sec8CoFp4G4E--g3DlodqLGt-PcEwzv9dbFgGrFVC-mMipoUSUs17A',
  });

  // State Stores
  const [stats, setStats] = useState(initialPlatformStats);
  const [institutions, setInstitutions] = useState<Institution[]>(initialInstitutions);
  const [packages, setPackages] = useState<ServicePackage[]>(initialServicePackages);
  const [cooperationPlans, setCooperationPlans] = useState<CooperationPlan[]>(initialCooperationPlans);
  const [authCodes, setAuthCodes] = useState<AuthCode[]>(initialAuthCodes);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePointNode[]>(initialKnowledgePoints);
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialAuditLogs);
  const [students, setStudents] = useState(initialStudents);
  const [teachers, setTeachers] = useState<TeacherItem[]>(initialTeachers);
  const [teacherCreditLedger, setTeacherCreditLedger] = useState<TeacherCreditLedgerEntry[]>([]);
  const [institutionCreditEntries, setInstitutionCreditEntries] = useState<InstitutionCreditEntry[]>([]);
  const [guardianships, setGuardianships] = useState(initialParentGuardianships);
  const [guardianBindingCodes, setGuardianBindingCodes] = useState<GuardianBindingCode[]>(() =>
    initialParentGuardianships.map((item, index) => ({
      id: `GBC-SEED-${index + 1}`,
      code: `JB-2026-${String(8101 + index).padStart(4, '0')}`,
      studentId: item.studentId,
      studentName: item.studentName,
      institutionName: item.institutionName,
      createdAt: item.createdAt,
      expireAt: item.expireAt || '长期有效',
      status: item.status === 'active' ? 'bound' : 'pending',
    })),
  );
  const [serviceRights, setServiceRights] = useState<StudentServiceRight[]>(() => deriveLegacyServiceRights(initialAuthCodes, initialServicePackages));
  const [orders] = useState<OrderLedgerRecord[]>(initialOrderLedger);
  const [resolvedWorkItemIds, setResolvedWorkItemIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'warning' | 'error' } | null>(null);

  const searchResults = useMemo(
    () => buildGlobalSearchResults(searchQuery, { institutions, authCodes, students, orders }),
    [searchQuery, institutions, authCodes, students, orders],
  );
  const fulfillmentSnapshot = useMemo(() => {
    const snapshot = deriveFulfillmentSnapshot({ institutions, authCodes, students, orders, auditLogs });
    return { ...snapshot, workItems: snapshot.workItems.filter((item) => !resolvedWorkItemIds.includes(item.id)) };
  },
    [institutions, authCodes, students, orders, auditLogs, resolvedWorkItemIds],
  );
  const dashboardSnapshot = useMemo(() => derivePlatformDashboardSnapshot({ institutions, authCodes, students, orders, auditLogs }), [institutions, authCodes, students, orders, auditLogs]);
  const visibleDashboardSnapshot = useMemo(() => {
    if (currentUser.role === 'institution_admin' && currentUser.institutionId) return deriveInstitutionDashboardSnapshot({ institutionId: currentUser.institutionId, institutions, teachers, students, auditLogs });
    if (currentUser.role === 'teacher' && currentUser.teacherId) return deriveTeacherDashboardSnapshot({ teacherId: currentUser.teacherId, teachers, students, auditLogs });
    return dashboardSnapshot;
  }, [auditLogs, currentUser.institutionId, currentUser.role, currentUser.teacherId, dashboardSnapshot, institutions, students, teachers]);
  const visibleInstitutions = useMemo(() => scopeInstitutions(institutions, currentUser), [institutions, currentUser]);
  const visibleTeachers = useMemo(() => scopeTeachers(teachers, currentUser), [teachers, currentUser]);
  const visibleStudents = useMemo(() => scopeStudents(students, currentUser), [students, currentUser]);

  const handleSelectSearchResult = (tab: NavTab) => {
    setCurrentTab(tab);
    setSearchQuery('');
  };

  // Floating Help Modal State
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Login & Logout Handlers
  const handleLogin = (user: CurrentUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    const logRole = user.role === 'super_admin' ? '超级管理员' : `机构管理员 (${user.institutionName})`;
    addAuditLog('管理员安全登录', `${user.name} (@${user.username})`, `身份校验通过，成功进入${logRole}控制台。`, '系统设置');
  };

  const handleLogout = () => {
    addAuditLog('管理员安全退出', `${currentUser.name}`, '用户主动点击退出登录，会话已被清空并返回安全登录门户。', '系统设置');
    setIsAuthenticated(false);
  };

  const handleRoleChange = (role: Role) => {
    setCurrentUser((user) => ({
      ...user,
      role,
      name: role === 'super_admin' ? '超级管理员' : role === 'institution_admin' ? '机构管理员' : '李老师',
      institutionId: role === 'super_admin' ? undefined : institutions[0]?.id,
      institutionName: role === 'super_admin' ? undefined : institutions[0]?.name,
      teacherId: role === 'teacher' ? teachers[0]?.id : undefined,
    }));
    navigate(getDefaultRouteForRole(role));
  };

  // Add Log Helper
  const addAuditLog = (action: string, target: string, details: string, moduleName: any = '机构管理') => {
    const newLog: AuditLogItem = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      operatorName: currentUser.name,
      operatorRole: currentUser.role === 'super_admin' ? 'Super Admin' : 'Institution Admin',
      module: moduleName,
      action,
      target,
      details,
      ipAddress: '10.240.0.12',
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleResolveWorkItem = (id: string, resolution: string) => {
    const item = fulfillmentSnapshot.workItems.find((workItem) => workItem.id === id);
    if (!item) return;
    setResolvedWorkItemIds((current) => [...current, id]);
    addAuditLog('关闭履约异常', item.institutionName, resolution, '系统设置');
    setToast({ message: `已处理：${item.title}`, tone: 'success' });
  };

  const handleNotify = (message: string, tone: 'success' | 'warning' | 'error' = 'success') => setToast({ message, tone });

  const handleUpdateGuardianshipStatus = (id: string, status: (typeof guardianships)[number]['status']) => {
    setGuardianships((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    addAuditLog('更新监护关系', id, `监护关系状态更新为：${status}`, '系统设置');
  };

  const handleGenerateReport = (studentId: string, subject: string, startDate: string, endDate: string) => {
    const student = students.find((item) => item.id === studentId);
    addAuditLog('生成学生学习报告', student?.name ?? studentId, `${subject} · ${startDate} 至 ${endDate}`, '诊断管理');
    handleNotify(`已生成${student?.name ?? '学生'}的${subject}学习报告`);
  };

  const handleFulfillService = (result: ServiceFulfillmentResult) => {
    const teacher = teachers.find((item) => item.id === result.right.teacherId);
    if (!teacher) throw new Error('未找到负责教师的点数账户');
    const institution = institutions.find((item) => item.id === result.right.institutionId);
    if (!institution?.availableServicePackageIds?.includes(result.right.packageId)) throw new Error('该机构未获授权使用此服务包');
    const debit = debitTeacherForService({
      teacher,
      amount: result.right.quotaConsumed,
      studentId: result.right.studentId,
      studentName: result.right.studentName,
      packageId: result.right.packageId,
      packageName: result.right.packageName,
      now: new Date(),
      nonce: Math.random().toString().slice(2, 6).padEnd(4, '0'),
    });
    setTeachers((current) => current.map((item) => (item.id === teacher.id ? debit.teacher : item)));
    setTeacherCreditLedger((current) => [debit.entry, ...current]);
    setAuthCodes((current) => [result.authCode, ...current]);
    setGuardianBindingCodes((current) => [result.guardianBindingCode, ...current]);
    setServiceRights((current) => [result.right, ...current]);
    addAuditLog('办理学生服务', result.right.studentName, `开通服务包【${result.right.packageName}】，已同步生成授权码与家长绑定码。`, '额度授权码');
    handleNotify(`已完成${result.right.studentName}的服务办理`);
  };

  const handleFulfillServices = (results: ServiceFulfillmentResult[]) => {
    if (results.length === 0) return;
    const first = results[0];
    if (results.some((item) => item.right.teacherId !== first.right.teacherId)) throw new Error('批量办理必须属于同一负责教师');
    const teacher = teachers.find((item) => item.id === first.right.teacherId);
    if (!teacher) throw new Error('未找到负责教师的点数账户');
    const institution = institutions.find((item) => item.id === first.right.institutionId);
    if (!institution?.availableServicePackageIds?.includes(first.right.packageId)) throw new Error('该机构未获授权使用此服务包');
    const totalQuota = results.reduce((sum, item) => sum + item.right.quotaConsumed, 0);
    const debit = debitTeacherForService({
      teacher,
      amount: totalQuota,
      studentId: `BULK-${Date.now()}`,
      studentName: `${results.length} 名班级学生`,
      packageId: first.right.packageId,
      packageName: `${first.right.packageName} × ${results.length}`,
      now: new Date(),
      nonce: Math.random().toString().slice(2, 6).padEnd(4, '0'),
    });
    setTeachers((current) => current.map((item) => (item.id === teacher.id ? debit.teacher : item)));
    setTeacherCreditLedger((current) => [debit.entry, ...current]);
    setAuthCodes((current) => [...results.map((item) => item.authCode), ...current]);
    setGuardianBindingCodes((current) => [...results.map((item) => item.guardianBindingCode), ...current]);
    setServiceRights((current) => [...results.map((item) => item.right), ...current]);
    addAuditLog('班级批量办理学生服务', teacher.name, `为 ${results.length} 名学生办理【${first.right.packageName}】，教师账户扣除 ${totalQuota.toLocaleString()} 点并生成全部双码。`, '额度授权码');
    handleNotify(`已为 ${results.length} 名学生批量办理服务，${teacher.name}剩余 ${debit.teacher.remainingQuota.toLocaleString()} 点`);
  };

  const handleAddTeachers = (newTeachers: TeacherItem[]) => {
    setTeachers((current) => [...newTeachers, ...current]);
  };

  const handleAddTeacher = (teacher: TeacherItem, initialQuota: number) => {
    if (initialQuota <= 0) {
      setTeachers((current) => [teacher, ...current]);
      return;
    }
    const institution = institutions.find((item) => item.id === teacher.institutionId);
    if (!institution) throw new Error('未找到教师所属机构');
    const transfer = allocateTeacherCredits({ institution, teacher, amount: initialQuota, reason: '新增教师初始分配', now: new Date(), nonce: teacher.id });
    setInstitutions((current) => current.map((item) => (item.id === institution.id ? transfer.institution : item)));
    setTeachers((current) => [transfer.teacher, ...current]);
    setTeacherCreditLedger((current) => [transfer.entry, ...current]);
    addAuditLog('给教师分配点数', teacher.name, `机构【${institution.name}】扣除 ${initialQuota.toLocaleString()} 点，教师账户增加同等点数。`, '教师管理');
  };

  const handleUpdateTeacher = (teacherId: string, updates: Partial<TeacherItem>) => {
    setTeachers((current) => current.map((item) => (item.id === teacherId ? { ...item, ...updates } : item)));
  };

  const handleTransferTeacherCredits = (teacherId: string, amount: number, type: 'allocate' | 'reclaim', reason: string) => {
    const teacher = teachers.find((item) => item.id === teacherId);
    if (!teacher) throw new Error('未找到教师点数账户');
    const institution = institutions.find((item) => item.id === teacher.institutionId);
    if (!institution) throw new Error('未找到教师所属机构');
    const input = { institution, teacher, amount, reason, now: new Date(), nonce: Math.random().toString().slice(2, 6).padEnd(4, '0') };
    const transfer = type === 'allocate' ? allocateTeacherCredits(input) : reclaimTeacherCredits(input);
    setInstitutions((current) => current.map((item) => (item.id === institution.id ? transfer.institution : item)));
    setTeachers((current) => current.map((item) => (item.id === teacher.id ? transfer.teacher : item)));
    setTeacherCreditLedger((current) => [transfer.entry, ...current]);
    addAuditLog(type === 'allocate' ? '给教师分配点数' : '收回教师点数', teacher.name, `${reason}：${amount.toLocaleString()} 点；机构余额 ${transfer.institution.remainingQuota.toLocaleString()} 点，教师余额 ${transfer.teacher.remainingQuota.toLocaleString()} 点。`, '教师管理');
  };

  // Institution Operations
  const handleAddInstitution = (instData: Omit<Institution, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `INS-${Date.now().toString().slice(-7)}`;
    const newInst: Institution = {
      ...instData,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setInstitutions((prev) => [newInst, ...prev]);
    setStats((prev) => ({
      ...prev,
      activeInstitutions: prev.activeInstitutions + 1,
      activeInstitutionsGrowth: prev.activeInstitutionsGrowth + 1,
    }));
    addAuditLog('新增接入机构', `${newInst.name} (${newInst.id})`, `成功接入新机构，拨付初始采购额度 ${newInst.totalQuota.toLocaleString()} 点。`, '机构管理');
  };

  const handleUpdateInstitution = (id: string, updates: Partial<Institution>) => {
    setInstitutions((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, ...updates, updatedAt: new Date().toISOString().slice(0, 10) } : inst))
    );
    const targetInst = institutions.find((i) => i.id === id);
    addAuditLog('更新机构信息', `${targetInst?.name || id}`, `修改机构资料与运行状态：${JSON.stringify(updates)}`, '机构管理');
  };

  const handleAdjustQuota = (id: string, amount: number, isIncrease: boolean, reason: string) => {
    setInstitutions((prev) =>
      prev.map((inst) => {
        if (inst.id === id) {
          const change = isIncrease ? amount : -amount;
          const newTotal = inst.totalQuota + change;
          const newRemaining = inst.remainingQuota + change;
          return {
            ...inst,
            totalQuota: Math.max(0, newTotal),
            remainingQuota: Math.max(0, newRemaining),
            updatedAt: new Date().toISOString().slice(0, 10),
          };
        }
        return inst;
      })
    );
    const targetInst = institutions.find((i) => i.id === id);
    const actionText = isIncrease ? `调增额度 +${amount.toLocaleString()}点` : `调减额度 -${amount.toLocaleString()}点`;
    addAuditLog('调整机构额度', `${targetInst?.name || id}`, `${actionText}。事由：${reason}`, '机构管理');
  };

  const handleCreateInstitutionCreditEntry = ({ institutionId, paymentAmount, creditAmount, voucherNo, notes }: { institutionId: string; paymentAmount: number; creditAmount: number; voucherNo: string; notes: string }) => {
    const institution = institutions.find((item) => item.id === institutionId);
    if (!institution) throw new Error('未找到入账机构');
    const result = createInstitutionCreditEntry({ institution, paymentAmount, creditAmount, voucherNo, notes, operatorName: currentUser.name, now: new Date() });
    setInstitutions((current) => current.map((item) => item.id === institutionId ? result.institution : item));
    setInstitutionCreditEntries((current) => [result.entry, ...current]);
    addAuditLog('录入机构线下入账', institution.name, `实收 ¥${paymentAmount.toLocaleString()}，入账 ${creditAmount.toLocaleString()} 点；凭证：${voucherNo}。`, '交易流水');
    return result.ledger;
  };

  const handleBatchImportInstitutions = (file: File) => {
    alert(`成功解析并导入文件【${file.name}】！成功导入 5 家新机构，全补齐采购额度与管理员账号。`);
    addAuditLog('批量导入机构表格', file.name, `通过 Excel 解析新增 5 家机构，三级路径关联率 100%。`, '机构管理');
  };

  // Service Package Operations
  const handleAddPackage = (pkgData: Omit<ServicePackage, 'id'>) => {
    const newPkg: ServicePackage = {
      ...pkgData,
      id: `PKG-${Date.now().toString().slice(-3)}`,
    };
    setPackages((prev) => [...prev, newPkg]);
    addAuditLog('新建服务包', `${newPkg.name} (${newPkg.code})`, `包含 AI 用量 ${newPkg.includedAiUsage.toLocaleString()}，采购消耗 ${newPkg.quotaCost}点。`, '服务包管理');
  };

  const handleUpdatePackage = (id: string, updates: Partial<ServicePackage>) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    const targetPkg = packages.find((p) => p.id === id);
    addAuditLog('修改服务包配置', `${targetPkg?.name || id}`, `更新服务包配置：${JSON.stringify(updates)}`, '服务包管理');
  };

  // Auth Code Operations
  const handleRevokeAuthCode = (codeId: string) => {
    setAuthCodes((prev) =>
      prev.map((c) => (c.id === codeId ? { ...c, status: 'revoked' } : c))
    );
    const targetCode = authCodes.find((c) => c.id === codeId);
    addAuditLog('作废未激活授权码', `${targetCode?.code || codeId}`, `作废机构【${targetCode?.institutionName}】的授权码，阻止后续激活。`, '额度授权码');
  };


  // Question Bank Operations
  const handleAddQuestion = (qData: Omit<QuestionItem, 'id' | 'createdAt'>) => {
    const newQ: QuestionItem = {
      ...qData,
      id: `Q-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toLocaleString().slice(0, 16),
    };
    setQuestions((prev) => [newQ, ...prev]);
    addAuditLog('录入新精选题', `${newQ.title} (${newQ.id})`, `学科：${newQ.subject}，难度：${newQ.difficulty}题，关联知识点：${newQ.knowledgePointPathName}`, '题库管理');
  };

  const handleUpdateQuestion = (id: string, updates: Partial<QuestionItem>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
    const targetQ = questions.find((q) => q.id === id);
    addAuditLog('修改/停用精选题', `${targetQ?.title || id}`, `更新题目属性或运行状态：${JSON.stringify(updates)}`, '题库管理');
  };

  const handleBatchImportQuestions = (file: File) => {
    alert(`成功导入 Excel 题库表格【${file.name}】！成功新增 24 道精选题，更新 2 道题目，自动进行难度标准映射 (基础/提升/压轴) 及知识点路径校验！`);
    addAuditLog('批量导入精选题库表格', file.name, `通过 Excel 解析新增 24 道精选题，知识点绑定匹配成功率 100%。`, '题库管理');
  };

  const handleAddKnowledgePoint = (kpData: Omit<KnowledgePointNode, 'id' | 'questionCount'>) => {
    const newKp: KnowledgePointNode = {
      ...kpData,
      id: `KP-NODE-${Date.now().toString().slice(-5)}`,
      questionCount: 0,
    };
    setKnowledgePoints((prev) => [...prev, newKp]);
    addAuditLog(`新增${newKp.level === 1 ? '章' : newKp.level === 2 ? '节' : '知识点'}`, `${newKp.name} (${newKp.code})`, `新增第 ${newKp.level} 级节点，学科：${newKp.subject}`, '题库管理');
  };

  if (!isAuthenticated) {
    return <LoginView institutions={institutions} onLogin={handleLogin} />;
  }

  if (location.pathname === '/') return <Navigate to="/platform/dashboard" replace />;

  if (!canAccessRoute(currentUser.role, currentTab)) {
    return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
  }

  const currentView = currentTab === 'content' ? 'questionBank' : currentTab;
  const routeState = location.state as { intent?: string; institutionId?: string } | null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F6F5] text-[#0F172A] font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar role={currentUser.role} />

      {/* Main Container Column */}
      <div className="flex-1 flex flex-col h-screen min-w-0 pl-[220px]">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenNotifications={() => alert('通知面板：全平台无待处理崩溃报错，目前 5 家机构额度告急已预警。')}
          onOpenSettings={() => setIsHelpModalOpen(true)}
          searchResults={searchResults}
          onSelectSearchResult={handleSelectSearchResult}
          activeRole={currentUser.role}
          onRoleChange={handleRoleChange}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7 custom-scrollbar">
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <DashboardView snapshot={visibleDashboardSnapshot} title={currentUser.role === 'institution_admin' ? `${currentUser.institutionName ?? '当前机构'}运营大屏` : currentUser.role === 'teacher' ? `${currentUser.name}经营驾驶舱` : '平台经营驾驶舱'} />
              {currentUser.role === 'institution_admin' && currentUser.institutionId && <DiagnosticsView students={students.filter((item) => item.institutionId === currentUser.institutionId)} onGenerateReport={handleGenerateReport} scopeLabel="本机构" />}
              {currentUser.role === 'teacher' && currentUser.teacherId && <DiagnosticsView students={students.filter((item) => item.teacherId === currentUser.teacherId)} onGenerateReport={handleGenerateReport} scopeLabel="我的班级" />}
            </div>
          )}

          {currentView === 'goods' && (
            <GoodsView
              key={currentTab}
              mode="catalog"
              packages={packages}
              authCodes={authCodes}
              institutions={institutions}
              onAddPackage={handleAddPackage}
              onUpdatePackage={handleUpdatePackage}
              onRevokeAuthCode={handleRevokeAuthCode}
              onCreateCreditEntry={handleCreateInstitutionCreditEntry}
              onAudit={(event) => addAuditLog(event.action, event.target, event.details, '系统设置')}
              onNotify={handleNotify}
            />
          )}

          {currentView === 'questionBank' && (
            <QuestionBankView
              knowledgePoints={knowledgePoints}
              questions={questions}
              onAddQuestion={handleAddQuestion}
              onUpdateQuestion={handleUpdateQuestion}
              onBatchImportQuestions={handleBatchImportQuestions}
              onAddKnowledgePoint={handleAddKnowledgePoint}
              authorizedContentPackageNames={
                currentUser.role === 'institution_admin' || currentUser.role === 'teacher'
                  ? institutions.find((institution) => institution.id === currentUser.institutionId)?.availableContentPackages ?? []
                  : undefined
              }
              canCreateContentPackage={currentUser.role === 'super_admin'}
            />
          )}

          {currentView === 'institutions' && (
            <InstitutionView
              institutions={institutions}
              servicePackages={packages}
              authCodes={authCodes}
              orders={orders}
              onAddInstitution={handleAddInstitution}
              onUpdateInstitution={handleUpdateInstitution}
              onAdjustQuota={handleAdjustQuota}
              onBatchImport={handleBatchImportInstitutions}
              onCreateCreditEntry={handleCreateInstitutionCreditEntry}
              contentPackages={initialContentPackages}
              cooperationPlans={cooperationPlans}
            />
          )}

          {currentView === 'teachers' && (
            <TeacherClassView
              key="teachers"
              institutions={visibleInstitutions}
              teachers={visibleTeachers}
              creditLedger={teacherCreditLedger}
              packages={packages}
              students={visibleStudents}
              onAddStudents={(newStudents) => setStudents((current) => [...newStudents, ...current])}
              onAddTeacher={handleAddTeacher}
              onAddTeachers={handleAddTeachers}
              onUpdateTeacher={handleUpdateTeacher}
              onTransferTeacherCredits={handleTransferTeacherCredits}
              onFulfillServices={handleFulfillServices}
              initialTab="teachers"
              viewerRole={currentUser.role}
              viewerInstitutionId={currentUser.institutionId}
              viewerTeacherId={currentUser.teacherId}
            />
          )}

          {currentView === 'classes' && (
            <TeacherClassView
              key="classes"
              institutions={visibleInstitutions}
              teachers={visibleTeachers}
              creditLedger={teacherCreditLedger}
              packages={packages}
              students={visibleStudents}
              onAddStudents={(newStudents) => setStudents((current) => [...newStudents, ...current])}
              onAddTeacher={handleAddTeacher}
              onAddTeachers={handleAddTeachers}
              onUpdateTeacher={handleUpdateTeacher}
              onTransferTeacherCredits={handleTransferTeacherCredits}
              onFulfillServices={handleFulfillServices}
              initialTab="classes"
              viewerRole={currentUser.role}
              viewerInstitutionId={currentUser.institutionId}
              viewerTeacherId={currentUser.teacherId}
            />
          )}

          {currentView === 'students' && (
            <StudentView
              students={visibleStudents}
              guardianships={guardianships}
              authCodes={authCodes}
              guardianBindingCodes={guardianBindingCodes}
              serviceRights={serviceRights}
              packages={packages}
              teachers={visibleTeachers}
              onFulfillService={handleFulfillService}
              onRevokeAuthCode={handleRevokeAuthCode}
              onUpdateGuardianshipStatus={handleUpdateGuardianshipStatus}
              onGenerateReport={handleGenerateReport}
              viewerRole={currentUser.role}
            />
          )}

          {currentView === 'system' && (
            <SystemView
              key={currentView}
              auditLogs={auditLogs}
              mode="settings"
              workItems={fulfillmentSnapshot.workItems}
              onResolveWorkItem={handleResolveWorkItem}
              onNotify={handleNotify}
            />
          )}
        </main>
      </div>

      {/* System Help Floating Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
}
