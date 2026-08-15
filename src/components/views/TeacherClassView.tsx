import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { TeacherItem, TeacherClassItem, Institution, TeacherPermission, StudentItem, ServicePackage, ServiceFulfillmentResult, TeacherCreditLedgerEntry } from '../../types';
import { useMasterData } from '../../masterData/MasterDataContext';
import { GradeSelect } from '../masterData/MasterDataSelects';
import { createBulkServiceFulfillments } from '../../domain/serviceFulfillment';
import { downloadImportTemplate } from '../../utils/downloadImportTemplate';
import type { Role } from '../../permissions/accessControl';

interface TeacherClassViewProps {
  institutions: Institution[];
  teachers: TeacherItem[];
  packages: ServicePackage[];
  creditLedger: TeacherCreditLedgerEntry[];
  students?: StudentItem[];
  onAddStudents?: (newStudents: StudentItem[]) => void;
  onAddTeacher: (teacher: TeacherItem, initialQuota: number) => void;
  onAddTeachers: (teachers: TeacherItem[]) => void;
  onUpdateTeacher: (teacherId: string, updates: Partial<TeacherItem>) => void;
  onTransferTeacherCredits: (teacherId: string, amount: number, type: 'allocate' | 'reclaim', reason: string) => void;
  onFulfillServices: (results: ServiceFulfillmentResult[]) => void;
  initialTab?: 'teachers' | 'classes';
  viewerRole?: Role;
  viewerInstitutionId?: string;
  viewerTeacherId?: string;
}

export const filterClassesForViewer = <T extends { institutionId: string; headTeacherId: string }>(classes: T[], role: Role, institutionId?: string, teacherId?: string): T[] => {
  if (role === 'super_admin') return classes;
  if (!institutionId) return [];
  if (role === 'institution_admin') return classes.filter((item) => item.institutionId === institutionId);
  if (!teacherId) return [];
  return classes.filter((item) => item.institutionId === institutionId && item.headTeacherId === teacherId);
};

export const filterServicePackagesForInstitution = (
  packages: ServicePackage[],
  institutions: Institution[],
  institutionId: string,
): ServicePackage[] => {
  const institution = institutions.find((item) => item.id === institutionId);
  const authorizedPackageIds = new Set(institution?.availableServicePackageIds ?? []);
  return packages.filter((item) => item.status === 'active' && authorizedPackageIds.has(item.id));
};

export interface ClassRosterStudent {
  id: string;
  name: string;
  account: string;
  phone: string;
  classId: string;
  className: string;
  grade: string;
  subject: string;
  institutionId: string;
  institutionName: string;
  teacherId: string;
  teacherName: string;
  serviceStatus: 'active' | 'pending' | 'none'; // 服务中 / 待激活 / 待配包
  servicePackageName?: string;
  createdAt: string;
}

const defaultPermissions: TeacherPermission = {
  canEditContent: true,
  canImportStudents: true,
  canManageClass: true,
  canRedeemPackage: true,
  canViewReport: true,
};

const initialClasses: TeacherClassItem[] = [
  { id: 'CLS-01', name: '初三 (1) 班全科重点冲刺班', code: 'CLS-CS-101', grade: '初三', subject: '全科', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', headTeacherId: 'TCH-001', headTeacherName: '张敏老师', studentCount: 42, createdAt: '2025-09-01' },
  { id: 'CLS-02', name: '高一 (3) 班理化竞赛班', code: 'CLS-GY-303', grade: '高一', subject: '数学, 物理, 化学', institutionId: 'INS-2023045', institutionName: '上海青葱教育培训中心', headTeacherId: 'TCH-002', headTeacherName: '周强老师', studentCount: 35, createdAt: '2025-09-05' },
  { id: 'CLS-03', name: '中考化学培优 A 班', code: 'CLS-HX-A01', grade: '初三', subject: '化学', institutionId: 'INS-3007001', institutionName: '博雅语言学院', headTeacherId: 'TCH-003', headTeacherName: '高林老师', studentCount: 28, createdAt: '2026-02-20' },
];

const initialClassRoster: ClassRosterStudent[] = [
  { id: 'STU-001', name: '王小明', account: 'wangxm2026', phone: '13812345678', classId: 'CLS-01', className: '初三 (1) 班重点冲刺班', grade: '初三', subject: '数学', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', teacherId: 'TCH-001', teacherName: '李明', serviceStatus: 'active', servicePackageName: '单科高量包', createdAt: '2025-09-02' },
  { id: 'STU-002', name: '李思思', account: 'lisisi2026', phone: '13987654321', classId: 'CLS-01', className: '初三 (1) 班重点冲刺班', grade: '初三', subject: '数学', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', teacherId: 'TCH-001', teacherName: '李明', serviceStatus: 'none', createdAt: '2025-09-02' },
  { id: 'STU-101', name: '张伟', account: 'zhangwei2026', phone: '13700001111', classId: 'CLS-01', className: '初三 (1) 班重点冲刺班', grade: '初三', subject: '数学', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', teacherId: 'TCH-001', teacherName: '李明', serviceStatus: 'none', createdAt: '2025-09-05' },
  { id: 'STU-102', name: '赵丽', account: 'zhaoli2026', phone: '13622223333', classId: 'CLS-02', className: '高一 (3) 班物理竞赛班', grade: '高一', subject: '物理', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', teacherId: 'TCH-002', teacherName: '张华', serviceStatus: 'active', servicePackageName: '单科高量包', createdAt: '2025-09-06' },
  { id: 'STU-103', name: '陈杰', account: 'chenjie2026', phone: '13544445555', classId: 'CLS-03', className: '中考化学培优 A 班', grade: '初三', subject: '化学', institutionId: 'INS-2023045', institutionName: '上海青葱教育培训中心', teacherId: 'TCH-003', teacherName: '陈红', serviceStatus: 'none', createdAt: '2026-02-21' },
];

const mockNames = ['张超越', '李娜', '王强', '刘洋', '陈小羽', '郭嘉', '周杰', '徐婷', '朱亮', '孙萌', '高飞', '胡晓', '林博', '郑静', '马超'];

export const TeacherClassView: React.FC<TeacherClassViewProps> = ({ institutions, teachers, packages, creditLedger, students = [], onAddStudents, onAddTeacher, onAddTeachers, onUpdateTeacher, onTransferTeacherCredits, onFulfillServices, initialTab = 'teachers', viewerRole = 'super_admin', viewerInstitutionId, viewerTeacherId }) => {
  const location = useLocation();
  const institutionId = (location.state as { institutionId?: string } | null)?.institutionId;
  const { getActiveSubjects } = useMasterData();
  const allSubjects = getActiveSubjects().map((item) => item.name);
  const [activeTab, setActiveTab] = useState<'teachers' | 'classes'>(initialTab);

  // Teachers State
  const [teacherSearch, setTeacherSearch] = useState('');
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null);

  const [teacherForm, setTeacherForm] = useState({
    name: '',
    account: '',
    phone: '',
    institutionId: institutions[0]?.id || '',
    initialQuota: 1000,
  });

  const [permForm, setPermForm] = useState<TeacherPermission>({ ...defaultPermissions });
  const [quotaAdjustAmount, setQuotaAdjustAmount] = useState<number>(1000);
  const [quotaType, setQuotaType] = useState<'allocate' | 'reclaim'>('allocate');

  // Classes State
  const [classes, setClasses] = useState<TeacherClassItem[]>(initialClasses);
  const [classSearch, setClassSearch] = useState('');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isImportStudentModalOpen, setIsImportStudentModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TeacherClassItem | null>(null);

  // Import State
  const [importCount, setImportCount] = useState<number>(15);

  const handleBatchImportTeachers = (file: File) => {
    const institution = institutions[0];
    if (!institution) return;
    const stamp = Date.now().toString().slice(-5);
    onAddTeachers([
      {
        id: `TCH-B-${stamp}-1`, name: '批量教师一', account: `teacher_${stamp}_1`, phone: '13800001001',
        institutionId: institution.id, institutionName: institution.name, studentCount: 0,
        allocatedQuota: 0, remainingQuota: 0, permissions: { ...defaultPermissions }, status: 'active', createdAt: new Date().toISOString().slice(0, 10),
      },
      {
        id: `TCH-B-${stamp}-2`, name: '批量教师二', account: `teacher_${stamp}_2`, phone: '13800001002',
        institutionId: institution.id, institutionName: institution.name, studentCount: 0,
        allocatedQuota: 0, remainingQuota: 0, permissions: { ...defaultPermissions }, status: 'active', createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    alert(`已读取【${file.name}】，成功导入 2 位教师；初始额度为 0，可在教师列表单独划拨。`);
  };

  // Class Roster Modal State
  const [classRoster, setClassRoster] = useState<ClassRosterStudent[]>(initialClassRoster);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterClass, setRosterClass] = useState<TeacherClassItem | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const [isBulkServiceOpen, setIsBulkServiceOpen] = useState(false);
  const [bulkPackageId, setBulkPackageId] = useState(packages.find((item) => item.status === 'active')?.id ?? '');


  const [selectedClassSubjects, setSelectedClassSubjects] = useState<string[]>(['数学']);

  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    grade: '初三',
    subject: '数学',
    institutionId: institutions[0]?.id || '',
    headTeacherId: teachers[0]?.id || '',
    initialTeacherQuota: 0,
  });

  // Filtered Lists
  const filteredTeachers = useMemo(() => {
    return teachers.filter(
      (t) =>
        (!institutionId || t.institutionId === institutionId) && (
          t.name.includes(teacherSearch) ||
          t.account.includes(teacherSearch) ||
          t.phone.includes(teacherSearch) ||
          t.institutionName.includes(teacherSearch)
        )
    );
  }, [teachers, teacherSearch, institutionId]);

  const filteredClasses = useMemo(() => {
    return filterClassesForViewer<TeacherClassItem>(classes, viewerRole as Role, viewerInstitutionId, viewerTeacherId).filter(
      (c) =>
        c.name.includes(classSearch) ||
        c.code.includes(classSearch) ||
        c.headTeacherName.includes(classSearch) ||
        c.institutionName.includes(classSearch)
    );
  }, [classes, classSearch, viewerRole, viewerInstitutionId, viewerTeacherId]);

  // Handlers
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const inst = institutions.find((i) => i.id === teacherForm.institutionId);
    const newT: TeacherItem = {
      id: `TCH-${Date.now().toString().slice(-4)}`,
      name: teacherForm.name,
      account: teacherForm.account,
      phone: teacherForm.phone,
      institutionId: teacherForm.institutionId,
      institutionName: inst?.name || '指定机构',
      studentCount: 0,
      allocatedQuota: 0,
      remainingQuota: 0,
      permissions: { ...defaultPermissions },
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    try {
      onAddTeacher(newT, Number(teacherForm.initialQuota));
      setIsTeacherModalOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '教师创建失败');
    }
  };

  const handleOpenPermissions = (tch: TeacherItem) => {
    setSelectedTeacher(tch);
    setPermForm({ ...tch.permissions });
    setIsPermissionModalOpen(true);
  };

  const handleSavePermissions = () => {
    if (!selectedTeacher) return;
    onUpdateTeacher(selectedTeacher.id, { permissions: { ...permForm } });
    setIsPermissionModalOpen(false);
  };

  const handleOpenQuota = (tch: TeacherItem) => {
    setSelectedTeacher(tch);
    setQuotaAdjustAmount(1000);
    setQuotaType('allocate');
    setIsQuotaModalOpen(true);
  };

  const handleSaveQuota = () => {
    if (!selectedTeacher) return;
    try {
      onTransferTeacherCredits(selectedTeacher.id, quotaAdjustAmount, quotaType, quotaType === 'allocate' ? '教师点数补充' : '收回教师未使用点数');
      setIsQuotaModalOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '点数调整失败');
    }
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const inst = institutions.find((i) => i.id === classForm.institutionId);
    const tch = teachers.find((t) => t.id === classForm.headTeacherId);
    if (!inst || !tch) {
      alert('请先为该机构创建并启用班主任账号');
      return;
    }

    const subjectDisplay = selectedClassSubjects.length === allSubjects.length || selectedClassSubjects.includes('全科')
      ? '全科'
      : selectedClassSubjects.join(', ') || '数学';

    const newC: TeacherClassItem = {
      id: `CLS-${Date.now().toString().slice(-4)}`,
      name: classForm.name,
      code: classForm.code || `CLS-${Date.now().toString().slice(-4)}`,
      grade: classForm.grade,
      subject: subjectDisplay,
      institutionId: classForm.institutionId,
      institutionName: inst.name,
      headTeacherId: classForm.headTeacherId,
      headTeacherName: tch.name,
      studentCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    try {
      if (classForm.initialTeacherQuota > 0) {
        onTransferTeacherCredits(classForm.headTeacherId, classForm.initialTeacherQuota, 'allocate', `新建班级【${classForm.name}】时给班主任分配点数`);
      }
      setClasses((prev) => [newC, ...prev]);
      setIsClassModalOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '班级创建失败');
    }
  };

  const handleSimulateImportStudents = () => {
    if (!selectedClass) return;

    const count = Math.max(1, importCount);

    const classSubjectsList = selectedClass.subject.includes('全科')
      ? ['语文', '数学', '英语', '物理', '化学', '生物']
      : selectedClass.subject.split(/[,，\s]+/).filter(Boolean);

    const newRosterItems: ClassRosterStudent[] = [];
    const newStudentItems: StudentItem[] = [];

    for (let i = 0; i < count; i++) {
      const name = mockNames[i % mockNames.length] + (i >= mockNames.length ? (i + 1) : '');
      const studentId = `STU-${Date.now().toString().slice(-5)}-${i + 1}`;
      const account = `stu${Date.now().toString().slice(-4)}${i + 1}`;
      const phone = `13${Math.floor(100000000 + Math.random() * 900000000)}`;

      const newRoster: ClassRosterStudent = {
        id: studentId,
        name,
        account,
        phone,
        classId: selectedClass.id,
        className: selectedClass.name,
        grade: selectedClass.grade,
        subject: selectedClass.subject,
        institutionId: selectedClass.institutionId,
        institutionName: selectedClass.institutionName,
        teacherId: selectedClass.headTeacherId,
        teacherName: selectedClass.headTeacherName,
        serviceStatus: 'none',
        createdAt: new Date().toISOString().slice(0, 10),
      };

      const newStudentItem: StudentItem = {
        id: studentId,
        name,
        nickname: `${name}同学`,
        account,
        grade: selectedClass.grade,
        school: selectedClass.institutionName,
        textbook: '人教版',
        institutionId: selectedClass.institutionId,
        institutionName: selectedClass.institutionName,
        teacherId: selectedClass.headTeacherId,
        teacherName: selectedClass.headTeacherName,
        subjects: classSubjectsList.length > 0 ? classSubjectsList : [selectedClass.subject],
        serviceStatus: 'none',
        totalStudyHours: 0,
        totalQuestions: 0,
        accuracyRate: 0,
        errorCount: 0,
        unreviewedErrorCount: 0,
      };

      newRosterItems.push(newRoster);
      newStudentItems.push(newStudentItem);
    }

    // 1. Update Roster
    setClassRoster((prev) => [...newRosterItems, ...prev]);

    // 2. Update Class Student Count
    setClasses((prev) =>
      prev.map((c) => (c.id === selectedClass.id ? { ...c, studentCount: c.studentCount + count } : c))
    );

    // 3. Notify Parent App (Global Students List)
    if (onAddStudents) {
      onAddStudents(newStudentItems);
    }

    setIsImportStudentModalOpen(false);

    // 4. Open Roster Modal directly so user sees the newly imported roster!
    setRosterClass(selectedClass);
    setIsRosterModalOpen(true);
  };

  const handleOpenClassRosterModal = (cls: TeacherClassItem) => {
    setRosterClass(cls);
    setIsRosterModalOpen(true);
  };


  const handleRemoveStudentFromClass = (studentId: string) => {
    if (!rosterClass) return;
    if (confirm('确认将该学员从本班级花名册中移除？')) {
      setClassRoster((prev) => prev.filter((s) => s.id !== studentId));
      setClasses((prev) =>
        prev.map((c) => (c.id === rosterClass.id ? { ...c, studentCount: Math.max(0, c.studentCount - 1) } : c))
      );
    }
  };

  // Current Active Class Roster
  const currentClassRoster = useMemo(() => {
    if (!rosterClass) return [];
    return classRoster.filter(
      (s) =>
        s.classId === rosterClass.id &&
        (s.name.includes(rosterSearch) || s.account.includes(rosterSearch) || s.phone.includes(rosterSearch))
    );
  }, [classRoster, rosterClass, rosterSearch]);

  return (
    <div className="space-y-6">

      {/* Tab 1: Teachers Management */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          {institutionId && <div className="rounded-xl border border-[#CDE7DA] bg-[#F1FBF6] px-4 py-3 text-[13px] text-[#0E7D3E]">当前正在管理：<strong>{institutions.find((item) => item.id === institutionId)?.name ?? '所选机构'}</strong> 的已开通老师与老师额度。</div>}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-4">
            <input
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="搜索教师姓名、账号、手机号或机构..."
              className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none w-72 focus:border-[#16B45B]"
            />
            <div className="flex items-center gap-2"><p className="text-[12px] text-[#64748B]">新增老师后，额度须由机构管理员单独分配。</p><button type="button" onClick={() => { setTeacherForm({ name: '', account: '', phone: '', institutionId: institutionId ?? institutions[0]?.id ?? '', initialQuota: 0 }); setIsTeacherModalOpen(true); }} className="rounded-xl bg-[#16B45B] px-3.5 py-1.5 text-[12.5px] font-bold text-white hover:bg-[#139B4E]"><span className="material-symbols-outlined mr-1 align-[-3px] text-[16px]">add</span>新增老师</button></div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <tr>
                  <th className="py-3 px-4">教师姓名</th>
                  <th className="py-3 px-4">登录账号/手机</th>
                  <th className="py-3 px-4">所属机构</th>
                  <th className="py-3 px-4 text-center">负责学生数</th>
                  <th className="py-3 px-4 text-right">点数账户</th>
                  <th className="py-3 px-4 text-center">状态</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredTeachers.map((tch) => (
                  <tr key={tch.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-bold text-[#0F172A]">{tch.name}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-[12px]">{tch.account}</div>
                      <div className="text-[11px] text-[#64748B]">{tch.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-bold">{tch.institutionName}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#0F172A]">{tch.studentCount} 人</td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-[#16B45B] block">剩余 {tch.remainingQuota.toLocaleString()} 点</span>
                      <span className="mt-0.5 block text-[10.5px] text-[#94A3B8]">累计分配 {tch.allocatedQuota.toLocaleString()} · 已使用 {(tch.allocatedQuota - tch.remainingQuota).toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E8F7EE] text-[#16B45B]">
                        {tch.status === 'active' ? '正常' : '停用'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenPermissions(tch)}
                        className="text-[#16B45B] hover:underline font-bold text-[12px] cursor-pointer"
                      >
                        权限
                      </button>
                      <button
                        onClick={() => handleOpenQuota(tch)}
                        className="text-amber-600 hover:underline font-bold text-[12px] cursor-pointer"
                      >
                        划拨点数
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Classes Management */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-4">
            <input
              type="text"
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              placeholder="搜索班级名称、代码、班主任..."
              className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none w-72 focus:border-[#16B45B]"
            />
            <button
              onClick={() => {
                setClassForm({
                  name: '',
                  code: `CLS-${Date.now().toString().slice(-4)}`,
                  grade: '初三',
                  subject: '数学',
                  institutionId: institutions[0]?.id || '',
                  headTeacherId: teachers[0]?.id || '',
                  initialTeacherQuota: 0,
                });
                setIsClassModalOpen(true);
              }}
              className="bg-[#16B45B] text-white px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold flex items-center gap-1 shadow-xs hover:bg-[#139B4E] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              新建班级
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredClasses.map((cls) => (
              <div key={cls.id} role="button" tabIndex={0} onClick={() => handleOpenClassRosterModal(cls)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') handleOpenClassRosterModal(cls); }} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-3 flex flex-col justify-between cursor-pointer transition-colors hover:border-[#A7E4BE] hover:bg-[#FCFFFD]">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E8F7EE] text-[#16B45B]">
                      {cls.grade} · {cls.subject}
                    </span>
                    <span className="font-mono text-[11px] text-[#94A3B8]">{cls.code}</span>
                  </div>

                  <h3 className="text-[16px] font-bold text-[#0F172A]">{cls.name}</h3>
                  <p className="text-[12px] text-[#64748B]">所属机构：{cls.institutionName}</p>
                  {(() => {
                    const availablePackages = filterServicePackagesForInstitution(packages, institutions, cls.institutionId);
                    return (
                      <div className={`rounded-xl px-3 py-2 text-[12px] ${availablePackages.length > 0 ? 'bg-[#F0FBF4] text-[#0E7D3E]' : 'bg-amber-50 text-amber-700'}`}>
                        <div className="flex items-center justify-between gap-2 font-bold">
                          <span>本机构可办服务</span>
                          <span>{availablePackages.length} 个</span>
                        </div>
                        <p className="mt-1 truncate text-[11px] font-medium opacity-80" title={availablePackages.map((item) => item.name).join('、')}>
                          {availablePackages.length > 0 ? availablePackages.map((item) => item.name).join('、') : '请先在机构详情配置服务包'}
                        </p>
                      </div>
                    );
                  })()}

                  <div className="bg-[#F8FAFC] p-3 rounded-xl grid grid-cols-3 gap-3 items-center text-[12px]">
                    <div>
                      <span className="text-[#64748B] block">班主任</span>
                      <strong className="text-[#0F172A]">{cls.headTeacherName}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B] block">班主任可用点数</span>
                      <strong className="text-[#0E7D3E] font-mono">{(teachers.find((item) => item.id === cls.headTeacherId)?.remainingQuota ?? 0).toLocaleString()} 点</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[#64748B] block">班级学员</span>
                      <strong className="text-[#16B45B] font-mono text-[15px]">{cls.studentCount} 人</strong>
                      <button onClick={(event) => { event.stopPropagation(); setSelectedClass(cls); setIsImportStudentModalOpen(true); }} className="mt-1 block w-full text-[11px] font-bold text-[#16B45B] hover:underline">关联已开通学生</button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setRosterClass(cls);
                      setBulkPackageId(filterServicePackagesForInstitution(packages, institutions, cls.institutionId)[0]?.id ?? '');
                      setIsBulkServiceOpen(true);
                    }}
                    className="w-full border border-[#A7E4BE] text-[#0E7D3E] py-1.5 rounded-xl font-bold text-[12px] hover:bg-[#F0FBF4] cursor-pointer transition-colors"
                  >
                    批量办理服务
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl space-y-4">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3">新增教师账号</h3>
            <form onSubmit={handleSaveTeacher} className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">教师姓名</label>
                <input
                  type="text"
                  required
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  placeholder="例如：王教师"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">登录账号</label>
                <input
                  type="text"
                  required
                  value={teacherForm.account}
                  onChange={(e) => setTeacherForm({ ...teacherForm, account: e.target.value })}
                  placeholder="例如：wang_teacher"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">手机号码</label>
                <input
                  type="text"
                  required
                  value={teacherForm.phone}
                  onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                  placeholder="例如：13800000000"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">所属机构</label>
                {institutionId ? <div className="rounded-xl bg-[#F1FBF6] px-3 py-2 text-[13px] font-bold text-[#0E7D3E]">{institutions.find((item) => item.id === institutionId)?.name}</div> : <select value={teacherForm.institutionId} onChange={(e) => setTeacherForm({ ...teacherForm, institutionId: e.target.value })} className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-bold">{institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>}
              </div>

              <p className="rounded-xl bg-[#F8FAFC] p-3 text-[12px] text-[#64748B]">老师创建后初始额度为 0；请在老师列表中由机构管理员分配额度。</p>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!teacherForm.name || !teacherForm.account || !teacherForm.phone || !teacherForm.institutionId}
                  className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
                >
                  确认保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {isPermissionModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3 mb-4">
              配置教师权限 - {selectedTeacher.name}
            </h3>

            <div className="space-y-3">
              {[
                { key: 'canEditContent', label: '知识点与精选题库管理', desc: '允许新增、编辑与修改考点题目' },
                { key: 'canImportStudents', label: '维护班级花名册', desc: '允许关联已开通学生并维护班级归属' },
                { key: 'canManageClass', label: '建立与维系班级信息', desc: '允许新建与更变负责班级' },
                { key: 'canRedeemPackage', label: '使用点数兑换激活码', desc: '允许扣减可用点数生成学生配包码' },
                { key: 'canViewReport', label: '查看学生学情诊断报告', desc: '允许生成并导出 AI 学情报告' },
              ].map((perm) => (
                <label key={perm.key} className="flex items-start gap-3 p-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(permForm as any)[perm.key]}
                    onChange={(e) => setPermForm({ ...permForm, [perm.key]: e.target.checked })}
                    className="mt-1 accent-[#16B45B]"
                  />
                  <div>
                    <span className="text-[13px] font-bold text-[#0F172A] block">{perm.label}</span>
                    <span className="text-[11px] text-[#64748B]">{perm.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#E2E8F0] mt-4">
              <button
                onClick={() => setIsPermissionModalOpen(false)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold"
              >
                取消
              </button>
              <button
                onClick={handleSavePermissions}
                className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E]"
              >
                更新权限
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Teacher Quota Modal */}
      {isQuotaModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl space-y-4">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3">
              机构管理员 · 分配老师额度 - {selectedTeacher.name}
            </h3>

            <div className="text-[12.5px] bg-[#F8FAFC] p-3 rounded-xl space-y-1">
              <div>所属机构：<strong>{selectedTeacher.institutionName}</strong></div>
              <div>机构当前可分配：<strong className="font-mono">{(institutions.find((item) => item.id === selectedTeacher.institutionId)?.remainingQuota ?? 0).toLocaleString()} 点</strong></div>
              <div>当前可用点数：<strong className="text-[#16B45B] font-mono">{selectedTeacher.remainingQuota.toLocaleString()} 点</strong></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">机构管理员操作</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-[13px] cursor-pointer font-bold text-[#0F172A]">
                    <input
                      type="radio"
                      name="qt"
                      checked={quotaType === 'allocate'}
                      onChange={() => setQuotaType('allocate')}
                      className="accent-[#16B45B]"
                    />
                    补充划拨 (+ 点数)
                  </label>
                  <label className="flex items-center gap-1.5 text-[13px] cursor-pointer font-bold text-[#0F172A]">
                    <input
                      type="radio"
                      name="qt"
                      checked={quotaType === 'reclaim'}
                      onChange={() => setQuotaType('reclaim')}
                      className="accent-rose-500"
                    />
                    收回点数 (- 点数)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">调整点数数量</label>
                <input
                  type="number"
                  value={quotaAdjustAmount}
                  onChange={(e) => setQuotaAdjustAmount(Number(e.target.value))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono font-bold"
                />
                <p className="mt-1.5 text-[11px] text-[#64748B]">调整后：机构 {(quotaType === 'allocate' ? (institutions.find((item) => item.id === selectedTeacher.institutionId)?.remainingQuota ?? 0) - quotaAdjustAmount : (institutions.find((item) => item.id === selectedTeacher.institutionId)?.remainingQuota ?? 0) + quotaAdjustAmount).toLocaleString()} 点；教师 {(quotaType === 'allocate' ? selectedTeacher.remainingQuota + quotaAdjustAmount : selectedTeacher.remainingQuota - quotaAdjustAmount).toLocaleString()} 点</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] p-3">
              <div className="text-[11px] font-bold text-[#64748B]">最近点数流水</div>
              <div className="mt-2 space-y-2">{creditLedger.filter((item) => item.teacherId === selectedTeacher.id).slice(0, 3).map((item) => <div key={item.id} className="flex justify-between gap-3 text-[11px]"><span className="truncate text-[#475569]">{item.reason}</span><strong className={item.type === 'teacher_service_debit' || item.type === 'teacher_reclaim' ? 'text-red-600' : 'text-[#0E7D3E]'}>{item.type === 'institution_to_teacher' ? '+' : '-'}{item.amount.toLocaleString()} 点</strong></div>)}{creditLedger.every((item) => item.teacherId !== selectedTeacher.id) && <div className="text-[11px] text-[#94A3B8]">暂无调整流水</div>}</div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setIsQuotaModalOpen(false)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold"
              >
                取消
              </button>
              <button
                onClick={handleSaveQuota}
                className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E]"
              >
                确认变更
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl space-y-4">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3">新建教学班级</h3>
            <form onSubmit={handleSaveClass} className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">班级名称</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="例如：初三 (1) 班重点冲刺班"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">年级</label>
                <GradeSelect
                  value={classForm.grade}
                  onChange={(grade) => setClassForm({ ...classForm, grade })}
                  valueMode="name"
                  emptyLabel="请选择年级"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-bold"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[12px] font-bold text-[#475569]">
                    班级挂载内容包 (支持单选/多选/全包)
                  </label>
                  <span className="text-[11px] font-bold text-[#16B45B]">
                    {selectedClassSubjects.length === allSubjects.length || selectedClassSubjects.includes('全科')
                      ? '已选：全科内容包'
                      : `已选 ${selectedClassSubjects.length} 个学科内容包 (${selectedClassSubjects.join(', ')})`}
                  </span>
                </div>

                {/* Preset Shortcuts */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedClassSubjects([...allSubjects])}
                    className={`px-2 py-1 rounded-lg text-[11.5px] font-bold cursor-pointer transition-colors ${
                      selectedClassSubjects.length === allSubjects.length
                        ? 'bg-[#16B45B] text-white shadow-2xs'
                        : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    ✨ 全科内容包 (全选)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClassSubjects(allSubjects.filter((item) => ['数学', '物理', '化学', '生物'].includes(item)))}
                    className="px-2 py-1 rounded-lg text-[11.5px] font-bold cursor-pointer bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  >
                    理科内容包
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClassSubjects(allSubjects.filter((item) => ['语文', '英语', '历史', '地理', '政治'].includes(item)))}
                    className="px-2 py-1 rounded-lg text-[11.5px] font-bold cursor-pointer bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  >
                    文科内容包
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClassSubjects(allSubjects.filter((item) => ['语文', '数学', '英语'].includes(item)))}
                    className="px-2 py-1 rounded-lg text-[11.5px] font-bold cursor-pointer bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  >
                    主科内容包
                  </button>
                </div>

                {/* Individual Subject Chips */}
                <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl max-h-40 overflow-y-auto">
                  {allSubjects.map((sub) => {
                    const isSelected = selectedClassSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedClassSubjects.length > 1) {
                              setSelectedClassSubjects(selectedClassSubjects.filter((s) => s !== sub));
                            }
                          } else {
                            setSelectedClassSubjects([...selectedClassSubjects, sub]);
                          }
                        }}
                        className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11.5px] font-bold cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-[#E8F7EE] text-[#16B45B] border-[#16B45B]'
                            : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]'
                        }`}
                      >
                        {isSelected && <span className="text-[11px]">✓</span>}
                        {sub}包
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">所属机构</label>
                <select
                  value={classForm.institutionId}
                  onChange={(e) => {
                    const institutionId = e.target.value;
                    const firstTeacher = teachers.find((item) => item.institutionId === institutionId && item.status === 'active');
                    setClassForm({ ...classForm, institutionId, headTeacherId: firstTeacher?.id ?? '', initialTeacherQuota: 0 });
                  }}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-bold"
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">责任班主任</label>
                <select
                  value={classForm.headTeacherId}
                  onChange={(e) => setClassForm({ ...classForm, headTeacherId: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-bold"
                >
                  {teachers.filter((item) => item.institutionId === classForm.institutionId && item.status === 'active').map((t) => (
                    <option key={t.id} value={t.id}>{t.name} · 当前 {t.remainingQuota.toLocaleString()} 点</option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-[#DCE7E0] bg-[#F8FBF9] p-3">
                <label className="flex items-center justify-between text-[12px] font-bold text-[#0F172A]">
                  <span>同时给班主任分配点数（可选）</span>
                  <span className="text-[10.5px] font-normal text-[#64748B]">从机构账户直接扣除</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={classForm.initialTeacherQuota}
                  onChange={(e) => setClassForm({ ...classForm, initialTeacherQuota: Math.max(0, Number(e.target.value)) })}
                  className="mt-2 w-full rounded-xl border border-[#D5E2DA] bg-white px-3 py-2 text-[13px] font-mono font-bold outline-none focus:border-[#16B45B]"
                />
                {(() => {
                  const institution = institutions.find((item) => item.id === classForm.institutionId);
                  const teacher = teachers.find((item) => item.id === classForm.headTeacherId);
                  const amount = classForm.initialTeacherQuota;
                  return <div className={`mt-2 text-[11px] ${institution && amount > institution.remainingQuota ? 'text-red-600' : 'text-[#64748B]'}`}>
                    机构现有 {institution?.remainingQuota.toLocaleString() ?? 0} 点 → 分配后 {(institution ? institution.remainingQuota - amount : 0).toLocaleString()} 点；{teacher?.name || '班主任'}现有 {teacher?.remainingQuota.toLocaleString() ?? 0} 点 → 分配后 {((teacher?.remainingQuota ?? 0) + amount).toLocaleString()} 点
                  </div>;
                })()}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E]"
                >
                  建立班级
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Students Modal (With Default Quota Setting & Auto Roster View) */}
      {isImportStudentModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E2E8F0] shadow-xl space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                批量导入待配包学员 - {selectedClass.name}
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#E8F7EE] text-[#16B45B] font-bold">
                {selectedClass.grade} · {selectedClass.subject}
              </span>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#0F172A] mb-1">
                    本次模拟导入学员人数
                  </label>
                  <select
                    value={importCount}
                    onChange={(e) => setImportCount(Number(e.target.value))}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none font-bold bg-white focus:border-[#16B45B]"
                  >
                    <option value={5}>5 名学员</option>
                    <option value={10}>10 名学员</option>
                    <option value={15}>15 名学员 (推荐默认)</option>
                    <option value={20}>20 名学员</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Excel Upload Visual */}
            <div className="p-4 border-2 border-dashed border-[#E2E8F0] rounded-2xl text-center space-y-2 bg-[#F8FAFC]">
              <span className="material-symbols-outlined text-[36px] text-[#16B45B]">upload_file</span>
              <p className="text-[12.5px] font-bold text-[#0F172A]">选择或拖拽学员 Excel 表格文件</p>
              <p className="text-[11px] text-[#64748B]">包含列：学生姓名、手机号/微信标识、初始入学年级</p>
              <button type="button" onClick={() => downloadImportTemplate('classStudents')} className="text-[12px] font-bold text-[#16B45B] hover:underline">下载 Excel 模板</button>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setIsImportStudentModalOpen(false)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSimulateImportStudents}
                className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E] cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                确认导入并查看班级花名册
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Roster Modal (查看/管理班级学员花名册) */}
      {isRosterModalOpen && rosterClass && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 border border-[#E2E8F0] shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-[17px] font-bold text-[#0F172A]">
                  班级学员花名册 - 【{rosterClass.name}】
                </h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  所属机构：{rosterClass.institutionName} | 责任班主任：{rosterClass.headTeacherName}
                </p>
              </div>
              <button
                onClick={() => setIsRosterModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] text-[20px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-3 gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              <div>
                <span className="text-[11px] text-[#64748B] block">班级总人数</span>
                <strong className="text-[15px] font-mono text-[#0F172A]">{currentClassRoster.length} 人</strong>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B] block">待配包学员</span>
                <strong className="text-[15px] font-mono text-amber-600">
                  {currentClassRoster.filter((s) => s.serviceStatus === 'none').length} 人
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B] block">已激活服务</span>
                <strong className="text-[15px] font-mono text-[#16B45B]">
                  {currentClassRoster.filter((s) => s.serviceStatus === 'active').length} 人
                </strong>
              </div>
            </div>

            {/* Filter & Action Bar */}
            <div className="flex justify-between items-center gap-3">
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="搜索学生姓名、账号或手机号..."
                className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[12.5px] outline-none w-64 focus:border-[#16B45B]"
              />
              <div className="flex items-center gap-2">
                <button onClick={() => { setIsRosterModalOpen(false); setBulkPackageId(filterServicePackagesForInstitution(packages, institutions, rosterClass.institutionId)[0]?.id ?? ''); setIsBulkServiceOpen(true); }} className="border border-[#86D6A5] bg-[#F0FBF4] text-[#0E7D3E] px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">redeem</span>
                  批量办理待配包学生
                </button>
                <button
                  onClick={() => {
                    setIsRosterModalOpen(false);
                    setSelectedClass(rosterClass);
                    setIsImportStudentModalOpen(true);
                  }}
                  className="bg-[#16B45B] text-white px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 hover:bg-[#139B4E] cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">group_add</span>
                  批量导入更多学员
                </button>
              </div>
            </div>

            {/* Roster Table */}
            <div className="flex-1 overflow-y-auto border border-[#E2E8F0] rounded-xl custom-scrollbar">
              <table className="w-full text-left text-[12.5px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold sticky top-0 bg-white z-10">
                  <tr>
                    <th className="py-2.5 px-4">学生姓名</th>
                    <th className="py-2.5 px-4">登录账号/手机号</th>
                    <th className="py-2.5 px-4">年级/挂载内容包</th>
                    <th className="py-2.5 px-4 text-center">服务包状态</th>
                    <th className="py-2.5 px-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {currentClassRoster.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#94A3B8] font-bold">
                        暂无该班级学员花名册，请点击右上角“批量导入更多学员”
                      </td>
                    </tr>
                  ) : (
                    currentClassRoster.map((s) => (
                      <tr key={s.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-4 font-bold text-[#0F172A]">{s.name}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-mono text-[12px]">{s.account}</div>
                          <div className="text-[11px] text-[#64748B]">{s.phone}</div>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-[#475569]">
                          {s.grade} · {s.subject.includes('包') ? s.subject : `${s.subject}内容包`}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {s.serviceStatus === 'active' ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E8F7EE] text-[#16B45B]">
                              服务中 ({s.servicePackageName || '标准包'})
                            </span>
                          ) : s.serviceStatus === 'pending' ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              待激活 ({s.servicePackageName || '标准包'})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                              待配包
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleRemoveStudentFromClass(s.id)}
                            className="text-rose-500 hover:underline font-bold text-[12px] cursor-pointer"
                          >
                            移除
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t flex justify-between items-center text-[12px] text-[#64748B]">
              <span>共找到 <strong>{currentClassRoster.length}</strong> 名花名册学员</span>
              <button
                onClick={() => setIsRosterModalOpen(false)}
                className="px-4 py-1.5 border border-[#E2E8F0] rounded-xl text-[#0F172A] font-bold cursor-pointer hover:bg-slate-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkServiceOpen && rosterClass && (() => {
        const teacher = teachers.find((item) => item.id === rosterClass.headTeacherId);
        const availablePackages = filterServicePackagesForInstitution(packages, institutions, rosterClass.institutionId);
        const selectedPackage = availablePackages.find((item) => item.id === bulkPackageId) ?? availablePackages[0];
        const pendingRosterIds = new Set(classRoster.filter((item) => item.classId === rosterClass.id && item.serviceStatus === 'none').map((item) => item.id));
        const pendingStudents = students.filter((item) => pendingRosterIds.has(item.id) && item.teacherId === rosterClass.headTeacherId);
        const totalQuota = (selectedPackage?.quotaCost ?? 0) * pendingStudents.length;
        const insufficient = Boolean(teacher && totalQuota > teacher.remainingQuota);
        const handleBulkConfirm = () => {
          if (!teacher || !selectedPackage || pendingStudents.length === 0 || insufficient) return;
          try {
            const batch = createBulkServiceFulfillments({ students: pendingStudents, servicePackage: selectedPackage, now: new Date(), nonce: Math.random().toString().slice(2, 6).padEnd(4, '0') });
            onFulfillServices(batch.results);
            setClassRoster((current) => current.map((item) => pendingRosterIds.has(item.id) && pendingStudents.some((student) => student.id === item.id) ? { ...item, serviceStatus: 'pending', servicePackageName: selectedPackage.name } : item));
            setIsBulkServiceOpen(false);
          } catch (error) {
            alert(error instanceof Error ? error.message : '批量办理失败');
          }
        };
        return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4"><div><h3 className="text-[16px] font-bold text-[#0F172A]">批量办理学生服务</h3><p className="mt-1 text-[12px] text-[#64748B]">{rosterClass.name} · 统一从班主任 {rosterClass.headTeacherName} 账户扣点</p></div><button onClick={() => setIsBulkServiceOpen(false)} className="text-[#64748B]">✕</button></div>
            <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-[#F8FAFC] p-3 text-[12px]"><div><span className="text-[#64748B]">待配包学生</span><strong className="mt-1 block text-[16px]">{pendingStudents.length} 人</strong></div><div><span className="text-[#64748B]">教师可用点数</span><strong className="mt-1 block text-[16px] text-[#0E7D3E]">{teacher?.remainingQuota.toLocaleString() ?? 0} 点</strong></div><div><span className="text-[#64748B]">本次预计扣除</span><strong className={`mt-1 block text-[16px] ${insufficient ? 'text-red-600' : 'text-[#0F172A]'}`}>{totalQuota.toLocaleString()} 点</strong></div></div>
            <label className="mt-4 block text-[12px] font-bold text-[#475569]">选择服务包</label>
            {availablePackages.length > 0 ? (
              <select value={selectedPackage?.id ?? ''} onChange={(event) => setBulkPackageId(event.target.value)} className="mt-1 w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-[13px] font-bold outline-none">
                {availablePackages.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quotaCost} 点/人 · {item.includedAiUsage.toLocaleString()} AI 用量</option>)}
              </select>
            ) : (
              <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700">当前机构暂无已授权且启用的服务包，请先在机构详情完成服务包配置。</div>
            )}
            <div className={`mt-4 rounded-xl px-3 py-2 text-[12px] ${insufficient ? 'bg-red-50 text-red-700' : 'bg-[#F0FBF4] text-[#0E7D3E]'}`}>
              {availablePackages.length === 0 ? '当前机构尚未配置可办理的服务包。' : pendingStudents.length === 0 ? '当前班级没有可批量办理的待配包学生。' : insufficient ? `教师点数不足，还差 ${(totalQuota - (teacher?.remainingQuota ?? 0)).toLocaleString()} 点，请先给班主任追加点数。` : `确认后将扣除 ${totalQuota.toLocaleString()} 点，并为每名学生独立生成学生授权码、家长绑定码和服务权益。`}
            </div>
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setIsBulkServiceOpen(false)} className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-[13px] font-bold text-[#64748B]">取消</button><button disabled={!selectedPackage || pendingStudents.length === 0 || !teacher || insufficient} onClick={handleBulkConfirm} className="rounded-xl bg-[#16B45B] px-4 py-2 text-[13px] font-bold text-white disabled:bg-[#94A3B8]">确认批量办理</button></div>
          </div>
        </div>;
      })()}

    </div>
  );
};
