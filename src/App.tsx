import React, { useMemo, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { canAccessRoute, getDefaultRouteForRole, type NavTab } from './navigation';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getPlatformRoute, getPlatformRouteId } from './router/platformRoutes';
import { Header, type HeaderNotificationAlert } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';
import { InstitutionView } from './components/views/InstitutionView';
import { GoodsView } from './components/views/GoodsView';
import { QuestionBankView } from './components/views/QuestionBankView';
import { DashboardView, StudentLearningView } from './components/views/DashboardView';
import { SystemView } from './components/views/SystemView';
import { TeacherClassView } from './components/views/TeacherClassView';
import { StudentView } from './components/views/StudentView';
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
  TeacherItem,
  StudentItem,
  TeacherCreditLedgerEntry,
  InstitutionCreditEntry,
} from './types';
import { deriveLegacyServiceRights } from './domain/studentRights';
import { allocateTeacherCredits, reclaimTeacherCredits } from './domain/teacherCredits';
import { settleInstitutionServiceFulfillments } from './domain/serviceFulfillment';
import type { Role } from './permissions/accessControl';
import { scopeInstitutions, scopeStudents, scopeTeachers } from './permissions/dataScope';
import { createInstitutionCreditEntry } from './domain/institutionResources';
import type { AccountCredential } from './domain/accountCredentials';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = getPlatformRouteId(location.pathname);
  const setCurrentTab = (tab: NavTab) => navigate(getPlatformRoute(tab).path);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentTeacherFilter, setStudentTeacherFilter] = useState('');

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
  const [adminAccounts] = useState<AccountCredential[]>([
    { id: 'SUPER-ADMIN-01', username: 'admin@kaiqiao.com', password: 'Admin@2026!x', phone: '', status: 'active' },
  ]);
  const [packages, setPackages] = useState<ServicePackage[]>(initialServicePackages);
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
  const [orders, setOrders] = useState<OrderLedgerRecord[]>(initialOrderLedger);
  const [resolvedWorkItemIds, setResolvedWorkItemIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'warning' | 'error' } | null>(null);
  const [teacherTransferNotifications, setTeacherTransferNotifications] = useState<Array<HeaderNotificationAlert & { recipientTeacherId: string }>>([]);

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
  const dashboardSnapshot = useMemo(() => derivePlatformDashboardSnapshot({
    institutions,
    authCodes,
    students,
    orders,
    auditLogs,
    servicePackages: packages,
    contentPackages: initialContentPackages,
    knowledgePoints,
    questions,
    serviceRights,
  }), [institutions, authCodes, students, orders, auditLogs, packages, knowledgePoints, questions, serviceRights]);
  const visibleDashboardSnapshot = useMemo(() => {
    if (currentUser.role === 'institution_admin' && currentUser.institutionId) return deriveInstitutionDashboardSnapshot({ institutionId: currentUser.institutionId, institutions, teachers, students, auditLogs });
    if (currentUser.role === 'teacher' && currentUser.teacherId) return deriveTeacherDashboardSnapshot({ teacherId: currentUser.teacherId, teachers, students, auditLogs });
    return dashboardSnapshot;
  }, [auditLogs, currentUser.institutionId, currentUser.role, currentUser.teacherId, dashboardSnapshot, institutions, students, teachers]);
  const visibleInstitutions = useMemo(() => scopeInstitutions(institutions, currentUser), [institutions, currentUser]);
  const visibleTeachers = useMemo(() => scopeTeachers(teachers, currentUser), [teachers, currentUser]);
  const visibleStudents = useMemo(() => scopeStudents(students, currentUser), [students, currentUser]);
  const notificationAlerts = useMemo<HeaderNotificationAlert[]>(() => {
    if (currentUser.role === 'teacher') return teacherTransferNotifications.filter((item) => item.recipientTeacherId === currentUser.teacherId);
    if (currentUser.role !== 'super_admin') return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const daysUntil = (date?: string | null) => {
      if (!date) return null;
      const target = new Date(`${date.slice(0, 10)}T00:00:00`);
      return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
    };
    const lowQuotaAlerts: HeaderNotificationAlert[] = institutions
      .filter((institution) => institution.status === 'active' && institution.totalQuota > 0 && institution.remainingQuota / institution.totalQuota < 0.15)
      .map((institution) => ({ id: `quota-${institution.id}`, type: 'low_quota', title: institution.name, detail: `机构额度仅剩 ${institution.remainingQuota.toLocaleString('zh-CN')} 点（${Math.round(institution.remainingQuota / institution.totalQuota * 100)}%），请及时补充。`, targetTab: 'institutions' }));
    const contractAlerts: HeaderNotificationAlert[] = institutions.flatMap((institution) => {
      const days = daysUntil(institution.contractExpireAt);
      return institution.status === 'active' && days !== null && days >= 0 && days <= 30
        ? [{ id: `contract-${institution.id}`, type: 'expiring' as const, title: `${institution.name}合同即将到期`, detail: `${institution.contractExpireAt} 到期，剩余 ${days} 天。`, targetTab: 'institutions' as const }]
        : [];
    });
    const serviceAlerts: HeaderNotificationAlert[] = students.flatMap((student) => {
      const days = daysUntil(student.serviceExpireAt);
      return student.serviceStatus === 'active' && days !== null && days >= 0 && days <= 30
        ? [{ id: `service-${student.id}`, type: 'expiring' as const, title: `${student.name}服务即将到期`, detail: `${student.institutionName} · ${student.serviceExpireAt} 到期，剩余 ${days} 天。`, targetTab: 'students' as const }]
        : [];
    });
    return [...lowQuotaAlerts, ...contractAlerts, ...serviceAlerts];
  }, [currentUser.role, currentUser.teacherId, institutions, students, teacherTransferNotifications]);

  const handleSelectSearchResult = (tab: NavTab) => {
    setCurrentTab(tab);
    setSearchQuery('');
  };

  const handleSelectNotification = (tab: NavTab, alertId: string) => {
    setCurrentTab(tab);
    if (alertId.startsWith('transfer-')) {
      setTeacherTransferNotifications((current) => current.filter((item) => item.id !== alertId));
    }
  };

  // Floating Help Modal State
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Login & Logout Handlers
  const handleLogin = (user: CurrentUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    const logRole = user.role === 'super_admin' ? '超级管理员' : user.role === 'teacher' ? `教师 (${user.institutionName})` : `机构管理员 (${user.institutionName})`;
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
      name: role === 'super_admin' ? '超级管理员' : role === 'institution_admin' ? '机构管理员' : (teachers[0]?.name ?? '教师'),
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
    const institution = institutions.find((item) => item.id === result.right.institutionId);
    if (!institution) throw new Error('未找到用户所属机构账户');
    const settlement = settleInstitutionServiceFulfillments({
      institution,
      results: [result],
      existingRightIds: serviceRights.map((item) => item.id),
      existingRights: serviceRights,
      operatorName: currentUser.name,
      now: new Date(),
      nonce: Math.random().toString().slice(2, 6).padEnd(4, '0'),
    });
    setInstitutions((current) => current.map((item) => (item.id === institution.id ? settlement.institution : item)));
    setOrders((current) => [settlement.order, ...current]);
    if (result.authCode) setAuthCodes((current) => [result.authCode!, ...current]);
    if (result.guardianBindingCode) setGuardianBindingCodes((current) => [result.guardianBindingCode!, ...current]);
    setServiceRights((current) => result.right.fulfillmentKind === 'renewal'
      ? current.map((item) => item.id === result.right.id ? result.right : item)
      : [result.right, ...current]);
    const isRenewal = result.right.fulfillmentKind === 'renewal';
    addAuditLog(isRenewal ? '续费学生服务' : '办理学生服务', result.right.studentName, `${isRenewal ? '续费' : '开通'}服务包【${result.right.packageName}】，所属机构账户扣除 ${settlement.totalQuotaConsumed.toLocaleString()} 点${isRenewal ? `，有效期顺延至 ${result.right.serviceExpireAt ?? '长期有效'}。` : '，已生成授权码与家长绑定码。'}`, '额度授权码');
    handleNotify(`${result.right.studentName}${isRenewal ? '续费成功，有效期已直接顺延' : '服务办理成功，等待学生首次激活'}；${institution.name}账户剩余 ${settlement.institution.remainingQuota.toLocaleString()} 点`);
  };

  const handleFulfillServices = (results: ServiceFulfillmentResult[]) => {
    if (results.length === 0) return;
    const grouped = new Map<string, ServiceFulfillmentResult[]>();
    results.forEach((result) => grouped.set(result.right.institutionId, [...(grouped.get(result.right.institutionId) ?? []), result]));
    const settlements: ReturnType<typeof settleInstitutionServiceFulfillments>[] = [];
    const failures: string[] = [];
    grouped.forEach((institutionResults, institutionId) => {
      const institution = institutions.find((item) => item.id === institutionId);
      if (!institution) {
        failures.push(`${institutionResults[0]?.right.institutionName ?? institutionId}：未找到机构账户`);
        return;
      }
      try {
        settlements.push(settleInstitutionServiceFulfillments({
          institution,
          results: institutionResults,
          existingRightIds: serviceRights.map((item) => item.id),
          existingRights: serviceRights,
          operatorName: currentUser.name,
          now: new Date(),
          nonce: `${Math.random().toString().slice(2, 6).padEnd(4, '0')}-${institutionId}`,
        }));
      } catch (caught) {
        failures.push(`${institution.name}：${caught instanceof Error ? caught.message : '结算失败'}`);
      }
    });
    if (settlements.length === 0) return {
      succeededStudentIds: [],
      failed: [...grouped.entries()].map(([institutionId, institutionResults], index) => ({ institutionId, institutionName: institutionResults[0]?.right.institutionName ?? institutionId, studentIds: institutionResults.map((item) => item.right.studentId), reason: failures[index]?.split('：').slice(1).join('：') || '结算失败' })),
      totalQuotaConsumed: 0,
    };

    const updatedInstitutions = new Map(settlements.map((item) => [item.institution.id, item.institution]));
    const successfulResults = settlements.flatMap((item) => item.results);
    setInstitutions((current) => current.map((item) => updatedInstitutions.get(item.id) ?? item));
    setOrders((current) => [...settlements.map((item) => item.order), ...current]);
    const newAuthCodes = successfulResults.flatMap((item) => item.authCode ? [item.authCode] : []);
    const newGuardianCodes = successfulResults.flatMap((item) => item.guardianBindingCode ? [item.guardianBindingCode] : []);
    const renewedRights = new Map(successfulResults.filter((item) => item.right.fulfillmentKind === 'renewal').map((item) => [item.right.id, item.right]));
    const activatedRights = successfulResults.filter((item) => item.right.fulfillmentKind !== 'renewal').map((item) => item.right);
    setAuthCodes((current) => [...newAuthCodes, ...current]);
    setGuardianBindingCodes((current) => [...newGuardianCodes, ...current]);
    setServiceRights((current) => [...activatedRights, ...current.map((item) => renewedRights.get(item.id) ?? item)]);
    const totalQuota = settlements.reduce((sum, item) => sum + item.totalQuotaConsumed, 0);
    const renewalCount = successfulResults.filter((item) => item.right.fulfillmentKind === 'renewal').length;
    const activationCount = successfulResults.length - renewalCount;
    addAuditLog('批量办理用户服务', `${successfulResults.length} 名用户`, `按 ${settlements.length} 个所属机构账户共扣除 ${totalQuota.toLocaleString()} 点；新开通 ${activationCount} 人，续费顺延 ${renewalCount} 人。${failures.length > 0 ? `未处理：${failures.join('；')}` : ''}`, '额度授权码');
    handleNotify(`已处理 ${successfulResults.length} 名用户：新开通 ${activationCount} 人、续费 ${renewalCount} 人${failures.length > 0 ? `；${failures.length} 个机构未处理` : ''}`, failures.length > 0 ? 'warning' : 'success');
    const successfulInstitutionIds = new Set(settlements.map((item) => item.institution.id));
    return {
      succeededStudentIds: successfulResults.map((item) => item.right.studentId),
      failed: [...grouped.entries()].filter(([institutionId]) => !successfulInstitutionIds.has(institutionId)).map(([institutionId, institutionResults]) => ({ institutionId, institutionName: institutionResults[0]?.right.institutionName ?? institutionId, studentIds: institutionResults.map((item) => item.right.studentId), reason: failures.find((item) => item.startsWith(`${institutionResults[0]?.right.institutionName ?? institutionId}：`))?.split('：').slice(1).join('：') || '结算失败' })),
      totalQuotaConsumed: totalQuota,
    };
  };

  const handleAddTeachers = (newTeachers: TeacherItem[]) => {
    setTeachers((current) => [...newTeachers, ...current]);
  };

  const handleAddStudents = (newStudents: StudentItem[]) => {
    if (newStudents.length === 0) return;
    setStudents((current) => [...newStudents, ...current]);
    const addedByTeacher = newStudents.reduce((counts, student) => {
      counts.set(student.teacherId, (counts.get(student.teacherId) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());
    setTeachers((current) => current.map((teacher) => {
      const addedCount = addedByTeacher.get(teacher.id) ?? 0;
      return addedCount > 0 ? { ...teacher, studentCount: teacher.studentCount + addedCount } : teacher;
    }));
    const teacherNames = [...new Set(newStudents.map((item) => item.teacherName))].join('、');
    addAuditLog('导入学生', `${newStudents.length} 名学生`, `学生归属：${teacherNames}；未选教师的学生由机构管理员暂管，班级仅作选填筛选信息。`, '教师管理');
    handleNotify(`成功导入 ${newStudents.length} 名学生；归属：${teacherNames}`);
  };

  const handleAssignStudentTeacher = (studentId: string, teacherId: string) => {
    const teacher = teachers.find((item) => item.id === teacherId);
    const student = students.find((item) => item.id === studentId);
    if (!teacher || !student || teacher.institutionId !== student.institutionId) return;
    if (student.teacherId === teacher.id) return;
    const previousTeacher = teachers.find((item) => item.id === student.teacherId);
    const previousOwnerName = previousTeacher?.name ?? '机构管理员';
    const operatedAt = new Date().toLocaleString('zh-CN', { hour12: false });
    setStudents((current) => current.map((item) => item.id === studentId ? { ...item, teacherId: teacher.id, teacherName: teacher.name } : item));
    setTeacherTransferNotifications((current) => [
      {
        id: `transfer-in-${student.id}-${Date.now()}`,
        type: 'student_transfer',
        title: `${student.name}已转入你的学生名单`,
        detail: `由${previousOwnerName}转入；操作人：${currentUser.name}；${operatedAt}`,
        targetTab: 'students',
        recipientTeacherId: teacher.id,
      },
      ...(previousTeacher ? [{
        id: `transfer-out-${student.id}-${Date.now()}`,
        type: 'student_transfer_out' as const,
        title: `${student.name}已转出`,
        detail: `已转让给${teacher.name}；操作人：${currentUser.name}；${operatedAt}`,
        targetTab: 'students' as const,
        recipientTeacherId: previousTeacher.id,
      }] : []),
      ...current,
    ]);
    addAuditLog(previousTeacher ? '转让学生' : '分配学生', student.name, `由${previousOwnerName}调整为${teacher.name}`, '机构管理');
    handleNotify(`${student.name}已从${previousOwnerName}转让给${teacher.name}`);
  };

  const handleOpenTeacherStudents = (teacherName: string) => {
    setStudentTeacherFilter(teacherName);
    setCurrentTab('students');
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
    return <LoginView institutions={institutions} teachers={teachers} adminAccounts={adminAccounts} onLogin={handleLogin} />;
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
          notificationAlerts={notificationAlerts}
          onSelectNotification={handleSelectNotification}
          onOpenSettings={() => setIsHelpModalOpen(true)}
          searchResults={searchResults}
          onSelectSearchResult={handleSelectSearchResult}
          activeRole={currentUser.role}
          onRoleChange={handleRoleChange}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7 custom-scrollbar">
          {currentView === 'dashboard' && (
            <DashboardView snapshot={visibleDashboardSnapshot} students={visibleStudents} onGenerateReport={handleGenerateReport} />
          )}

          {currentView === 'learning' && (
            <StudentLearningView
              students={visibleStudents}
              teachers={visibleTeachers}
              viewerRole={currentUser.role}
            />
          )}

          {currentView === 'goods' && (
            <GoodsView
              key={currentTab}
              mode="catalog"
              packages={packages}
              contentPackages={initialContentPackages}
              authCodes={authCodes}
              institutions={institutions}
              onAddPackage={handleAddPackage}
              onUpdatePackage={handleUpdatePackage}
              onRevokeAuthCode={handleRevokeAuthCode}
              onCreateCreditEntry={handleCreateInstitutionCreditEntry}
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
              onAddStudents={handleAddStudents}
              onAddTeacher={handleAddTeacher}
              onAddTeachers={handleAddTeachers}
              onOpenStudents={handleOpenTeacherStudents}
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
              onAddStudents={handleAddStudents}
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
              contentPackages={initialContentPackages}
              teachers={visibleTeachers}
              institutions={visibleInstitutions}
              onAddStudents={handleAddStudents}
              onAssignTeacher={handleAssignStudentTeacher}
              onFulfillService={handleFulfillService}
              onFulfillServices={handleFulfillServices}
              initialTeacherFilter={studentTeacherFilter}
              onRevokeAuthCode={handleRevokeAuthCode}
              onUpdateGuardianshipStatus={handleUpdateGuardianshipStatus}
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
