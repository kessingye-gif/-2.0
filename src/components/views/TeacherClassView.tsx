import React, { useState, useMemo } from 'react';
import { TeacherItem, TeacherClassItem, Institution, TeacherPermission } from '../../types';

interface TeacherClassViewProps {
  institutions: Institution[];
}

const defaultPermissions: TeacherPermission = {
  canEditContent: true,
  canImportStudents: true,
  canManageClass: true,
  canRedeemPackage: true,
  canViewReport: true,
};

const initialTeachers: TeacherItem[] = [
  { id: 'TCH-001', name: '李明', account: 'liming_tch', phone: '13811112222', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', studentCount: 45, allocatedQuota: 5000, remainingQuota: 3200, permissions: { ...defaultPermissions }, status: 'active', createdAt: '2025-09-01' },
  { id: 'TCH-002', name: '张华', account: 'zhanghua_tch', phone: '13922223333', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', studentCount: 38, allocatedQuota: 4000, remainingQuota: 1500, permissions: { ...defaultPermissions, canEditContent: false }, status: 'active', createdAt: '2025-09-10' },
  { id: 'TCH-003', name: '陈红', account: 'chenhong_tch', phone: '13733334444', institutionId: 'INS-2023045', institutionName: '上海青葱教育培训中心', studentCount: 22, allocatedQuota: 3000, remainingQuota: 800, permissions: { ...defaultPermissions }, status: 'active', createdAt: '2026-02-15' },
];

const initialClasses: TeacherClassItem[] = [
  { id: 'CLS-01', name: '初三 (1) 班重点冲刺班', code: 'CLS-CS-101', grade: '初三', subject: '数学', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', headTeacherId: 'TCH-001', headTeacherName: '李明', studentCount: 42, createdAt: '2025-09-01' },
  { id: 'CLS-02', name: '高一 (3) 班物理竞赛班', code: 'CLS-GY-303', grade: '高一', subject: '物理', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', headTeacherId: 'TCH-002', headTeacherName: '张华', studentCount: 35, createdAt: '2025-09-05' },
  { id: 'CLS-03', name: '中考化学培优 A 班', code: 'CLS-HX-A01', grade: '初三', subject: '化学', institutionId: 'INS-2023045', institutionName: '上海青葱教育培训中心', headTeacherId: 'TCH-003', headTeacherName: '陈红', studentCount: 28, createdAt: '2026-02-20' },
];

export const TeacherClassView: React.FC<TeacherClassViewProps> = ({ institutions }) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'classes'>('teachers');

  // Teachers State
  const [teachers, setTeachers] = useState<TeacherItem[]>(initialTeachers);
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

  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    grade: '初三',
    subject: '数学',
    institutionId: institutions[0]?.id || '',
    headTeacherId: teachers[0]?.id || '',
  });

  // Filtered Lists
  const filteredTeachers = useMemo(() => {
    return teachers.filter(
      (t) =>
        t.name.includes(teacherSearch) ||
        t.account.includes(teacherSearch) ||
        t.phone.includes(teacherSearch) ||
        t.institutionName.includes(teacherSearch)
    );
  }, [teachers, teacherSearch]);

  const filteredClasses = useMemo(() => {
    return classes.filter(
      (c) =>
        c.name.includes(classSearch) ||
        c.code.includes(classSearch) ||
        c.headTeacherName.includes(classSearch) ||
        c.institutionName.includes(classSearch)
    );
  }, [classes, classSearch]);

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
      allocatedQuota: Number(teacherForm.initialQuota),
      remainingQuota: Number(teacherForm.initialQuota),
      permissions: { ...defaultPermissions },
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTeachers((prev) => [newT, ...prev]);
    setIsTeacherModalOpen(false);
  };

  const handleOpenPermissions = (tch: TeacherItem) => {
    setSelectedTeacher(tch);
    setPermForm({ ...tch.permissions });
    setIsPermissionModalOpen(true);
  };

  const handleSavePermissions = () => {
    if (!selectedTeacher) return;
    setTeachers((prev) =>
      prev.map((t) => (t.id === selectedTeacher.id ? { ...t, permissions: { ...permForm } } : t))
    );
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
    const change = quotaType === 'allocate' ? quotaAdjustAmount : -quotaAdjustAmount;
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === selectedTeacher.id) {
          const newAllocated = Math.max(0, t.allocatedQuota + change);
          const newRemaining = Math.max(0, t.remainingQuota + change);
          return { ...t, allocatedQuota: newAllocated, remainingQuota: newRemaining };
        }
        return t;
      })
    );
    setIsQuotaModalOpen(false);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const inst = institutions.find((i) => i.id === classForm.institutionId);
    const tch = teachers.find((t) => t.id === classForm.headTeacherId);

    const newC: TeacherClassItem = {
      id: `CLS-${Date.now().toString().slice(-4)}`,
      name: classForm.name,
      code: classForm.code || `CLS-${Date.now().toString().slice(-4)}`,
      grade: classForm.grade,
      subject: classForm.subject,
      institutionId: classForm.institutionId,
      institutionName: inst?.name || '关联机构',
      headTeacherId: classForm.headTeacherId,
      headTeacherName: tch?.name || '班主任',
      studentCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setClasses((prev) => [newC, ...prev]);
    setIsClassModalOpen(false);
  };

  const handleSimulateImportStudents = () => {
    if (!selectedClass) return;
    setClasses((prev) =>
      prev.map((c) => (c.id === selectedClass.id ? { ...c, studentCount: c.studentCount + 15 } : c))
    );
    alert(`成功向班级【${selectedClass.name}】批量导入 15 名学生！状态设置为“待配包”，已自动挂载至班主任负责关系下。`);
    setIsImportStudentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
        <div>
          <h2 className="text-[20px] font-extrabold text-[#0F172A] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#16B45B] text-[26px]">groups</span>
            教师与班级管理
          </h2>
          <p className="text-[13px] text-[#64748B] mt-1">
            统一维护教师账号、固定 RBAC 权限配置、点数分配划拨与班级学员负责关系
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-6 text-[13.5px] font-bold">
        <button
          onClick={() => setActiveTab('teachers')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'teachers' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
          教师账号与权限 ({teachers.length})
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'classes' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">class</span>
          班级管理与花名册 ({classes.length})
        </button>
      </div>

      {/* Tab 1: Teachers Management */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-4">
            <input
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="搜索教师姓名、账号、手机号或机构..."
              className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none w-72 focus:border-[#16B45B]"
            />
            <button
              onClick={() => {
                setTeacherForm({
                  name: '',
                  account: '',
                  phone: '',
                  institutionId: institutions[0]?.id || '',
                  initialQuota: 1000,
                });
                setIsTeacherModalOpen(true);
              }}
              className="bg-[#16B45B] text-white px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold flex items-center gap-1 shadow-xs hover:bg-[#139B4E] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              新增教师账号
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <tr>
                  <th className="py-3 px-4">教师姓名</th>
                  <th className="py-3 px-4">登录账号/手机</th>
                  <th className="py-3 px-4">所属机构</th>
                  <th className="py-3 px-4 text-center">负责学生数</th>
                  <th className="py-3 px-4 text-right">分配/可用点数</th>
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
                      <span className="font-mono font-bold text-[#16B45B] block">{tch.remainingQuota.toLocaleString()} 点</span>
                      <span className="text-[11px] text-[#94A3B8] font-mono">/ {tch.allocatedQuota.toLocaleString()} 总分配</span>
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
                        RBAC 权限
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
              <div key={cls.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E8F7EE] text-[#16B45B]">
                    {cls.grade} · {cls.subject}
                  </span>
                  <span className="font-mono text-[11px] text-[#94A3B8]">{cls.code}</span>
                </div>

                <h3 className="text-[16px] font-bold text-[#0F172A]">{cls.name}</h3>
                <p className="text-[12px] text-[#64748B]">所属机构：{cls.institutionName}</p>

                <div className="bg-[#F8FAFC] p-3 rounded-xl flex justify-between items-center text-[12px]">
                  <div>
                    <span className="text-[#64748B] block">班主任</span>
                    <strong className="text-[#0F172A]">{cls.headTeacherName}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[#64748B] block">班级学员</span>
                    <strong className="text-[#16B45B] font-mono text-[15px]">{cls.studentCount} 人</strong>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedClass(cls);
                      setIsImportStudentModalOpen(true);
                    }}
                    className="w-full bg-slate-100 text-slate-700 py-1.5 rounded-xl font-bold text-[12px] hover:bg-slate-200 cursor-pointer"
                  >
                    + 批量导入待配包学员
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Permission Modal */}
      {isPermissionModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3 mb-4">
              配置教师 RBAC 权限 - {selectedTeacher.name}
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-[#E2E8F0]">
                <span className="text-[13px] font-bold text-[#0F172A]">编辑题库与知识点</span>
                <input
                  type="checkbox"
                  checked={permForm.canEditContent}
                  onChange={(e) => setPermForm({ ...permForm, canEditContent: e.target.checked })}
                  className="w-4 h-4 accent-[#16B45B]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-[#E2E8F0]">
                <span className="text-[13px] font-bold text-[#0F172A]">批量导入学生花名册</span>
                <input
                  type="checkbox"
                  checked={permForm.canImportStudents}
                  onChange={(e) => setPermForm({ ...permForm, canImportStudents: e.target.checked })}
                  className="w-4 h-4 accent-[#16B45B]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-[#E2E8F0]">
                <span className="text-[13px] font-bold text-[#0F172A]">班级管理与学员调配</span>
                <input
                  type="checkbox"
                  checked={permForm.canManageClass}
                  onChange={(e) => setPermForm({ ...permForm, canManageClass: e.target.checked })}
                  className="w-4 h-4 accent-[#16B45B]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-[#E2E8F0]">
                <span className="text-[13px] font-bold text-[#0F172A]">消耗点数兑换授权码</span>
                <input
                  type="checkbox"
                  checked={permForm.canRedeemPackage}
                  onChange={(e) => setPermForm({ ...permForm, canRedeemPackage: e.target.checked })}
                  className="w-4 h-4 accent-[#16B45B]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-[#E2E8F0]">
                <span className="text-[13px] font-bold text-[#0F172A]">调阅班级学情诊断报告</span>
                <input
                  type="checkbox"
                  checked={permForm.canViewReport}
                  onChange={(e) => setPermForm({ ...permForm, canViewReport: e.target.checked })}
                  className="w-4 h-4 accent-[#16B45B]"
                />
              </label>
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
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Quota Allocation Modal */}
      {isQuotaModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl space-y-4">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3">
              划拨教师采购点数 - {selectedTeacher.name}
            </h3>

            <div className="bg-[#F8FAFC] p-3 rounded-xl text-[12px] space-y-1">
              <div>所属机构：<strong>{selectedTeacher.institutionName}</strong></div>
              <div>当前剩余点数：<strong className="text-[#16B45B] font-mono">{selectedTeacher.remainingQuota} 点</strong></div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#475569] mb-1">划拨类型</label>
              <select
                value={quotaType}
                onChange={(e) => setQuotaType(e.target.value as 'allocate' | 'reclaim')}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-bold cursor-pointer"
              >
                <option value="allocate">分配新额度 (机构池 -&gt; 教师)</option>
                <option value="reclaim">收回未消耗额度 (教师 -&gt; 机构池)</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#475569] mb-1">点数数量</label>
              <input
                type="number"
                value={quotaAdjustAmount}
                onChange={(e) => setQuotaAdjustAmount(Number(e.target.value))}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono font-bold"
              />
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
                确认划拨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3 mb-4">新增教师账号</h3>
            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">所属机构</label>
                <select
                  value={teacherForm.institutionId}
                  onChange={(e) => setTeacherForm({ ...teacherForm, institutionId: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-bold"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">教师姓名</label>
                <input
                  type="text"
                  required
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  placeholder="如：李明"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">登录账号</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.account}
                    onChange={(e) => setTeacherForm({ ...teacherForm, account: e.target.value })}
                    placeholder="liming_tch"
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">手机号码</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="13800000000"
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">初始划拨点数</label>
                <input
                  type="number"
                  value={teacherForm.initialQuota}
                  onChange={(e) => setTeacherForm({ ...teacherForm, initialQuota: Number(e.target.value) })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                />
              </div>

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
                  className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E]"
                >
                  确认创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3 mb-4">新建班级</h3>
            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">所属机构</label>
                <select
                  value={classForm.institutionId}
                  onChange={(e) => setClassForm({ ...classForm, institutionId: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-bold"
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">班级名称</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="如：初三 (2) 班提优班"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">适用年级</label>
                  <select
                    value={classForm.grade}
                    onChange={(e) => setClassForm({ ...classForm, grade: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                  >
                    <option value="初一">初一</option>
                    <option value="初二">初二</option>
                    <option value="初三">初三</option>
                    <option value="高一">高一</option>
                    <option value="高二">高二</option>
                    <option value="高三">高三</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">主导学科</label>
                  <input
                    type="text"
                    value={classForm.subject}
                    onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                    placeholder="数学"
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">责任班主任</label>
                <select
                  value={classForm.headTeacherId}
                  onChange={(e) => setClassForm({ ...classForm, headTeacherId: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-bold"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.institutionName})</option>
                  ))}
                </select>
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

      {/* Import Students Modal */}
      {isImportStudentModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl space-y-4">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3">
              导入待配包学员 - {selectedClass.name}
            </h3>

            <div className="p-4 border-2 border-dashed border-[#E2E8F0] rounded-2xl text-center space-y-2 bg-[#F8FAFC]">
              <span className="material-symbols-outlined text-[36px] text-[#16B45B]">upload_file</span>
              <p className="text-[12.5px] font-bold text-[#0F172A]">选择或拖拽学员 Excel 表格文件</p>
              <p className="text-[11px] text-[#64748B]">包含列：学生姓名、手机号/微信标识、初始入学年级</p>
            </div>

            <p className="text-[12px] text-[#64748B]">
              * 批量导入学员后，学员状态将标记为“待配包”。班主任教师随后可用采购点数为其兑换激活服务包。
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setIsImportStudentModalOpen(false)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold"
              >
                取消
              </button>
              <button
                onClick={handleSimulateImportStudents}
                className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E]"
              >
                模拟上传并导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
