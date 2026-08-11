import React, { useMemo, useState } from 'react';
import { NavTab, Sidebar } from './components/layout/Sidebar';
import { resolveLegacyView } from './navigation';
import { Header } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';
import { InstitutionView } from './components/views/InstitutionView';
import { GoodsView } from './components/views/GoodsView';
import { QuestionBankView } from './components/views/QuestionBankView';
import { DashboardView } from './components/views/DashboardView';
import { SystemView } from './components/views/SystemView';
import { AuditLogView } from './components/views/AuditLogView';
import { HelpModal } from './components/modals/HelpModal';

import {
  initialPlatformStats,
  initialInstitutions,
  initialServicePackages,
  initialAuthCodes,
  initialKnowledgePoints,
  initialQuestions,
  initialTeachers,
  initialStudents,
  initialAuditLogs,
  initialOrderLedger,
} from './mockData';
import { buildGlobalSearchResults, deriveFulfillmentSnapshot } from './fulfillment';

import {
  Institution,
  ServicePackage,
  AuthCode,
  KnowledgePointNode,
  QuestionItem,
  AuditLogItem,
  CurrentUser,
  OrderLedgerRecord,
} from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
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
  const [authCodes, setAuthCodes] = useState<AuthCode[]>(initialAuthCodes);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePointNode[]>(initialKnowledgePoints);
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialAuditLogs);
  const [students, setStudents] = useState(initialStudents);
  const [orders] = useState<OrderLedgerRecord[]>(initialOrderLedger);

  const searchResults = useMemo(
    () => buildGlobalSearchResults(searchQuery, { institutions, authCodes, students, orders }),
    [searchQuery, institutions, authCodes, students, orders],
  );
  const fulfillmentSnapshot = useMemo(
    () => deriveFulfillmentSnapshot({ institutions, authCodes, students, orders, auditLogs }),
    [institutions, authCodes, students, orders, auditLogs],
  );

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
    addAuditLog('新建服务包', `${newPkg.name} (${newPkg.code})`, `配置每日 AI 限制 ${newPkg.dailyAiLimit}次/天，采购消耗 ${newPkg.quotaCost}点。`, '服务包管理');
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

  const handleGenerateCodeForTest = (
    institutionName: string,
    teacherName: string,
    studentName: string,
    packageName: string
  ) => {
    const randomCode = `KQ-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCode: AuthCode = {
      id: `AC-${Date.now().toString().slice(-4)}`,
      code: randomCode,
      institutionId: 'INS-2023001',
      institutionName,
      teacherId: 'TCH-001',
      teacherName,
      studentId: `STU-${Date.now().toString().slice(-3)}`,
      studentName,
      packageId: 'PKG-004',
      packageName,
      packageType: 'all_high',
      quotaConsumed: 350,
      createdAt: new Date().toLocaleString().slice(0, 16),
      expireAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: 'pending',
    };

    setAuthCodes((prev) => [newCode, ...prev]);
    addAuditLog('测试生成 12 位学生授权码', randomCode, `为学生【${studentName}】生成服务授权码，对应服务包【${packageName}】。`, '额度授权码');
  };

  // Question Bank Operations
  const handleAddQuestion = (qData: Omit<QuestionItem, 'id' | 'createdAt'>) => {
    const newQ: QuestionItem = {
      ...qData,
      id: `Q-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toLocaleString().slice(0, 16),
    };
    setQuestions((prev) => [newQ, ...prev]);
    addAuditLog('录入新精选题', `${newQ.title} (${newQ.id})`, `学科：${newQ.subject}，难度：${newQ.difficulty}题，关联三级考点：${newQ.knowledgePointPathName}`, '题库管理');
  };

  const handleUpdateQuestion = (id: string, updates: Partial<QuestionItem>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
    const targetQ = questions.find((q) => q.id === id);
    addAuditLog('修改/停用精选题', `${targetQ?.title || id}`, `更新题目属性或运行状态：${JSON.stringify(updates)}`, '题库管理');
  };

  const handleBatchImportQuestions = (file: File) => {
    alert(`成功导入 Excel 题库表格【${file.name}】！成功新增 24 道精选题，更新 2 道题目，自动进行难度标准映射 (基础/提升/压轴) 及三级考点路径校验！`);
    addAuditLog('批量导入精选题库表格', file.name, `通过 Excel 解析新增 24 道精选题，三级考点绑定匹配成功率 100%。`, '题库管理');
  };

  const handleAddKnowledgePoint = (kpData: Omit<KnowledgePointNode, 'id' | 'questionCount'>) => {
    const newKp: KnowledgePointNode = {
      ...kpData,
      id: `KP-NODE-${Date.now().toString().slice(-5)}`,
      questionCount: 0,
    };
    setKnowledgePoints((prev) => [...prev, newKp]);
    addAuditLog('新增知识考点节点', `${newKp.name} (${newKp.code})`, `新增第 ${newKp.level} 级节点，学科：${newKp.subject}`, '题库管理');
  };

  if (!isAuthenticated) {
    return <LoginView institutions={institutions} onLogin={handleLogin} />;
  }

  const currentView = resolveLegacyView(currentTab);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F6F5] text-[#0F172A] font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

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
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7 custom-scrollbar">
          {currentView === 'dashboard' && (
            <DashboardView
              snapshot={fulfillmentSnapshot}
              onNavigateToTab={setCurrentTab}
            />
          )}

          {currentView === 'goods' && (
            <GoodsView
              packages={packages}
              authCodes={authCodes}
              institutions={institutions}
              onAddPackage={handleAddPackage}
              onUpdatePackage={handleUpdatePackage}
              onRevokeAuthCode={handleRevokeAuthCode}
              onGenerateCodeForTest={handleGenerateCodeForTest}
              onAdjustQuota={handleAdjustQuota}
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
            />
          )}

          {currentView === 'institutions' && (
            <InstitutionView
              institutions={institutions}
              servicePackages={packages}
              onAddInstitution={handleAddInstitution}
              onUpdateInstitution={handleUpdateInstitution}
              onAdjustQuota={handleAdjustQuota}
              onBatchImport={handleBatchImportInstitutions}
            />
          )}

          {(currentView === 'exceptions' || currentView === 'settings') && (
            <SystemView key={currentView} auditLogs={auditLogs} mode={currentView} />
          )}

          {currentView === 'auditLogs' && (
            <AuditLogView logs={auditLogs} />
          )}
        </main>
      </div>

      {/* System Help Floating Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}
