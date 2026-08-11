import React, { useState, useMemo } from 'react';
import {
  StudentItem,
  ParentGuardianship,
  WeChatRebindRequest,
  GuardianshipStatus,
  AuthCode,
  GuardianBindingCode,
} from '../../types';
import { DiagnosticsView } from './DiagnosticsView';
import { createGuardianBindingCode, deriveStudentRights } from '../../utils/studentCodeManagement';
import { filterStudents, getStudentFilterOptions } from '../../utils/studentFilters';
import { useMasterData } from '../../masterData/MasterDataContext';

interface StudentViewProps {
  students: StudentItem[];
  guardianships: ParentGuardianship[];
  authCodes: AuthCode[];
  onGenerateAuthCode: (institutionName: string, teacherName: string, studentName: string, packageName: string) => void;
  onRevokeAuthCode: (codeId: string) => void;
  onUpdateGuardianshipStatus: (id: string, status: GuardianshipStatus) => void;
  onGenerateReport: (studentId: string, subject: string, startDate: string, endDate: string) => void;
}

const initialRebindRequests: WeChatRebindRequest[] = [
  { id: 'REBIND-01', studentId: 'STU-001', studentName: '张伟强', institutionName: '浙江大学附属中学', phone: '13800112233', applyReason: '学生原微信账号丢失，更换家长手机实名新微信号', proofDocument: '学校开具的学生身份证明公章扫描件.pdf', status: 'pending', applicant: '李明 (班主任)', applyTime: '2026-08-04 15:20' },
  { id: 'REBIND-02', studentId: 'STU-004', studentName: '刘洋洋', institutionName: '上海青葱教育培训中心', phone: '13911223344', applyReason: '监护人微信号变更，请求重新解绑原微信', proofDocument: '户口本与家长身份证图片.png', status: 'pending', applicant: '陈红 (教师)', applyTime: '2026-08-05 10:10' },
];

export const StudentView: React.FC<StudentViewProps> = ({
  students,
  guardianships,
  authCodes,
  onGenerateAuthCode,
  onRevokeAuthCode,
  onUpdateGuardianshipStatus,
  onGenerateReport,
}) => {
  const { getActiveGrades } = useMasterData();
  const [activeTab, setActiveTab] = useState<'roster' | 'rights' | 'rebind' | 'guardianship' | 'diagnostics'>('roster');

  // Roster Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  // Rebind Requests
  const [rebindRequests, setRebindRequests] = useState<WeChatRebindRequest[]>(initialRebindRequests);
  const [guardianBindingCodes, setGuardianBindingCodes] = useState<GuardianBindingCode[]>(() =>
    guardianships.filter((item) => item.status === 'active').map((item, index) => ({
      id: `GBC-SEED-${index + 1}`,
      code: `JB-2026-${String(8101 + index).padStart(4, '0')}`,
      studentId: item.studentId,
      studentName: item.studentName,
      institutionName: item.institutionName,
      createdAt: item.createdAt,
      expireAt: item.expireAt || '长期有效',
      status: 'bound',
    }))
  );
  const studentRights = useMemo(() => deriveStudentRights(authCodes), [authCodes]);

  // Filtered Roster
  const organizationFilters = { institution: institutionFilter, teacher: teacherFilter, grade: gradeFilter };
  const filterOptions = useMemo(() => getStudentFilterOptions(students, organizationFilters), [students, institutionFilter, teacherFilter, gradeFilter]);
  const gradeOptions = useMemo(() => {
    const available = new Set(filterOptions.grades);
    const configured = getActiveGrades().map((item) => item.name).filter((name) => available.has(name));
    const unconfigured = filterOptions.grades.filter((name) => !configured.includes(name));
    return [...configured, ...unconfigured];
  }, [filterOptions.grades, getActiveGrades]);
  const filteredStudents = useMemo(() => filterStudents(students, { ...organizationFilters, searchTerm, serviceStatus: serviceStatusFilter }), [students, searchTerm, serviceStatusFilter, institutionFilter, teacherFilter, gradeFilter]);
  const hasRosterFilters = Boolean(searchTerm || serviceStatusFilter || institutionFilter || teacherFilter || gradeFilter);

  // Handlers for Rebind Requests
  const handleReviewRebind = (id: string, isApproved: boolean) => {
    setRebindRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: isApproved ? 'approved' : 'rejected',
              reviewTime: new Date().toLocaleString().slice(0, 16),
              reviewer: '超级管理员',
            }
          : r
      )
    );
    alert(isApproved ? '已批准微信重新绑定申请！原微信号已安全解绑，学生可凭新账号重新扫码关联。' : '已拒绝解绑申请。');
  };

  const handleGenerateGuardianBindingCode = () => {
    if (students[0]) setGuardianBindingCodes((current) => [createGuardianBindingCode(students[0]), ...current]);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap border-b border-[#E2E8F0] gap-x-6 gap-y-2 text-[13.5px] font-bold">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'roster' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          学生花名册与服务状态 ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('rights')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === 'rights' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
        >
          学生权益 ({studentRights.length})
        </button>

        <button
          onClick={() => setActiveTab('rebind')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'rebind' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          微信重新绑定审核 ({rebindRequests.filter((r) => r.status === 'pending').length})
        </button>

        <button
          onClick={() => setActiveTab('guardianship')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'guardianship' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          家长监护关系 ({guardianships.length})
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'diagnostics' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          学情概览与诊断报告
        </button>
      </div>

      {/* Tab 1: Student Roster */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索学生姓名、账号、负责教师或机构..."
                className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none w-72 focus:border-[#16B45B]"
              />
              <select value={institutionFilter} onChange={(e) => { setInstitutionFilter(e.target.value); setTeacherFilter(''); setGradeFilter(''); }} className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none"><option value="">全部机构</option>{filterOptions.institutions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <select value={teacherFilter} onChange={(e) => { setTeacherFilter(e.target.value); setGradeFilter(''); }} className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none"><option value="">全部老师</option>{filterOptions.teachers.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none"><option value="">全部年级</option>{gradeOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <select
                value={serviceStatusFilter}
                onChange={(e) => setServiceStatusFilter(e.target.value)}
                className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none cursor-pointer font-bold focus:border-[#16B45B]"
              >
                <option value="">全部服务状态</option>
                <option value="active">服务中 (已激活)</option>
                <option value="none">待配包 / 待激活</option>
                <option value="expired">已到期</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-3"><span className="text-[12px] text-[#64748B]">当前显示 {filteredStudents.length} / {students.length} 名学生</span>{hasRosterFilters && <button onClick={() => { setSearchTerm(''); setServiceStatusFilter(''); setInstitutionFilter(''); setTeacherFilter(''); setGradeFilter(''); }} className="text-[12px] font-bold text-[#16B45B]">清除筛选</button>}</div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <tr>
                  <th className="py-3 px-4">学生姓名</th>
                  <th className="py-3 px-4">登录账号/微信绑定</th>
                  <th className="py-3 px-4">所属机构</th>
                  <th className="py-3 px-4">负责教师</th>
                  <th className="py-3 px-4">年级/开通内容包</th>
                  <th className="py-3 px-4 text-center">服务包状态</th>
                  <th className="py-3 px-4 text-center">到期时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredStudents.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">当前筛选条件下暂无学生</td></tr> : filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-bold text-[#0F172A]">{stu.name}</td>
                    <td className="py-3 px-4 font-mono text-[12px]">
                      <div>{stu.account}</div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">微信已绑</span>
                    </td>
                    <td className="py-3 px-4 font-bold">{stu.institutionName}</td>
                    <td className="py-3 px-4">{stu.teacherName}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#0F172A] mr-2">{stu.grade}</span>
                      <span className="text-[11px] text-[#16B45B] font-bold bg-[#E8F7EE] px-2 py-0.5 rounded">
                        {stu.subjects.map(s => s.includes('包') ? s : `${s}内容包`).join(' / ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        stu.serviceStatus === 'active' ? 'bg-green-100 text-green-700' : stu.serviceStatus === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {stu.serviceStatus === 'active' ? '服务中' : stu.serviceStatus === 'expired' ? '已到期' : '待激活配包'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-[#64748B] font-mono text-[12px]">
                      {stu.serviceExpireAt || '待定'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rights' && (
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs">
          <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4"><div><h3 className="text-[15px] font-bold">学生权益</h3><p className="mt-1 text-[12px] text-[#64748B]">按学生查看服务包权益，并直接生成学生授权码。</p></div><button onClick={() => onGenerateAuthCode('浙江大学附属中学', '张敏老师', '王小明', '全科高量包')} className="rounded-xl bg-[#16B45B] px-3.5 py-1.5 text-[12.5px] font-bold text-white hover:bg-[#139B4E]">生成授权码</button></div>
          <div className="overflow-x-auto custom-scrollbar"><table className="w-full min-w-[900px] text-left text-[13px]">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-4 py-3">授权码</th><th className="px-4 py-3">学生</th><th className="px-4 py-3">所属机构</th><th className="px-4 py-3">责任教师</th><th className="px-4 py-3">服务包权益</th><th className="px-4 py-3">到期时间</th><th className="px-4 py-3 text-center">状态</th><th className="px-4 py-3 text-right">操作</th></tr></thead>
            <tbody className="divide-y divide-[#E2E8F0]">{studentRights.length === 0 ? <tr><td colSpan={8} className="px-6 py-12 text-center text-[#64748B]">暂无学生权益记录</td></tr> : studentRights.map((right) => <tr key={right.id}><td className="px-4 py-3.5 font-mono font-bold text-[#16B45B]">{right.code}</td><td className="px-4 py-3.5 font-bold">{right.studentName}</td><td className="px-4 py-3.5">{right.institutionName}</td><td className="px-4 py-3.5">{right.teacherName}</td><td className="px-4 py-3.5 font-bold text-[#0E7D3E]">{right.packageName}</td><td className="px-4 py-3.5 text-[12px] text-[#64748B]">{right.expireAt}</td><td className="px-4 py-3.5 text-center"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${right.status === 'used' ? 'bg-green-100 text-green-700' : right.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{right.statusLabel}</span></td><td className="px-4 py-3.5 text-right">{right.status === 'pending' && <button onClick={() => onRevokeAuthCode(right.id)} className="text-[12px] font-bold text-red-500">作废</button>}</td></tr>)}</tbody>
          </table></div>
        </div>
      )}

      {/* Tab 2: WeChat Rebind Requests */}
      {activeTab === 'rebind' && (
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
      {activeTab === 'guardianship' && (
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
              <button onClick={handleGenerateGuardianBindingCode} className="flex items-center gap-1 rounded-xl bg-[#16B45B] px-3.5 py-1.5 text-[12.5px] font-bold text-white hover:bg-[#139B4E]"><span className="material-symbols-outlined text-[16px]">add_link</span>生成家长绑定码</button>
            </div>
            <div className="overflow-x-auto custom-scrollbar"><table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-4 py-3">家长绑定码</th><th className="px-4 py-3">目标学生</th><th className="px-4 py-3">所属机构</th><th className="px-4 py-3">生成时间</th><th className="px-4 py-3">到期时间</th><th className="px-4 py-3 text-center">状态</th></tr></thead>
              <tbody className="divide-y divide-[#E2E8F0]">{guardianBindingCodes.length === 0 ? <tr><td colSpan={6} className="px-6 py-10 text-center text-[#64748B]">暂无家长绑定码</td></tr> : guardianBindingCodes.map((item) => <tr key={item.id}><td className="px-4 py-3.5 font-mono font-bold text-[#16B45B]">{item.code}</td><td className="px-4 py-3.5 font-bold">{item.studentName}</td><td className="px-4 py-3.5">{item.institutionName}</td><td className="px-4 py-3.5 text-[12px] text-[#64748B]">{item.createdAt}</td><td className="px-4 py-3.5 text-[12px] text-[#64748B]">{item.expireAt}</td><td className="px-4 py-3.5 text-center"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.status === 'bound' ? 'bg-green-100 text-green-700' : item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{item.status === 'bound' ? '已绑定' : item.status === 'pending' ? '待绑定' : '已失效'}</span></td></tr>)}</tbody>
            </table></div>
          </div>
        </div>
      )}

      {/* Tab 4: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <DiagnosticsView students={students} onGenerateReport={onGenerateReport} />
      )}
    </div>
  );
};
