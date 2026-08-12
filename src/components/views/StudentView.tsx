import React, { useState, useMemo } from 'react';
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
} from '../../types';
import { DiagnosticsView } from './DiagnosticsView';
import { deriveStudentRights } from '../../utils/studentCodeManagement';
import { filterStudents, getStudentFilterOptions } from '../../utils/studentFilters';
import { useMasterData } from '../../masterData/MasterDataContext';
import { DialogShell } from '../ui/FormPrimitives';
import { ServiceFulfillmentPanel } from '../fulfillment/ServiceFulfillmentPanel';
import { mergeStudentServiceRights } from '../../domain/studentRights';

interface StudentViewProps {
  students: StudentItem[];
  guardianships: ParentGuardianship[];
  authCodes: AuthCode[];
  guardianBindingCodes: GuardianBindingCode[];
  serviceRights: StudentServiceRight[];
  packages: ServicePackage[];
  teachers: TeacherItem[];
  onFulfillService: (result: ServiceFulfillmentResult) => void;
  onRevokeAuthCode: (codeId: string) => void;
  onUpdateGuardianshipStatus: (id: string, status: GuardianshipStatus) => void;
  onGenerateReport: (studentId: string, subject: string, startDate: string, endDate: string) => void;
  initialTab?: 'roster' | 'diagnostics';
}

const hiddenRebindRequests: WeChatRebindRequest[] = [];

export const StudentView: React.FC<StudentViewProps> = ({
  students,
  guardianships,
  authCodes,
  guardianBindingCodes,
  serviceRights,
  packages,
  teachers,
  onFulfillService,
  onRevokeAuthCode,
  onUpdateGuardianshipStatus,
  onGenerateReport,
  initialTab = 'roster',
}) => {
  const { getActiveGrades } = useMasterData();
  const [activeTab, setActiveTab] = useState<'roster' | 'diagnostics'>(initialTab);

  // Roster Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [serviceStudent, setServiceStudent] = useState<StudentItem | null>(null);
  const [detailStudent, setDetailStudent] = useState<StudentItem | null>(null);
  const [rebindRequests, setRebindRequests] = useState<WeChatRebindRequest[]>(hiddenRebindRequests);
  const studentRights = useMemo(() => deriveStudentRights(authCodes), [authCodes]);
  const mergedServiceRights = useMemo(() => mergeStudentServiceRights(serviceRights, authCodes, packages), [serviceRights, authCodes, packages]);

  const handleReviewRebind = (id: string, isApproved: boolean) => {
    setRebindRequests((current) => current.map((item) => item.id === id ? { ...item, status: isApproved ? 'approved' : 'rejected' } : item));
  };

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
          学生列表 ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'diagnostics' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          学情报告
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
                  <th className="py-3 px-4 text-center">家长关系</th>
                  <th className="py-3 px-4 text-center">到期时间</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredStudents.length === 0 ? <tr><td colSpan={9} className="px-6 py-12 text-center text-[#64748B]">当前筛选条件下暂无学生</td></tr> : filteredStudents.map((stu) => {
                  const guardian = guardianships.find((item) => item.studentId === stu.id);
                  const bindingCode = guardianBindingCodes.find((item) => item.studentId === stu.id);
                  const guardianStatus = guardian?.status === 'active' ? '已绑定' : bindingCode?.status === 'pending' || guardian?.status === 'pending' ? '待绑定' : '未绑定';
                  const latestRight = mergedServiceRights.find((item) => item.studentId === stu.id);
                  const serviceStatus = latestRight?.status ?? (stu.serviceStatus === 'none' ? 'pending' : stu.serviceStatus);
                  const serviceStatusLabel = { pending: latestRight ? '待激活' : '待办理', active: '服务中', expired: '已到期', revoked: '已撤销' }[serviceStatus];
                  return (
                  <tr key={stu.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4"><button onClick={() => setDetailStudent(stu)} className="font-bold text-[#0F172A] hover:text-[#16B45B]">{stu.name}</button></td>
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
                        serviceStatus === 'active' ? 'bg-green-100 text-green-700' : serviceStatus === 'expired' || serviceStatus === 'revoked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {serviceStatusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${guardianStatus === '已绑定' ? 'bg-green-100 text-green-700' : guardianStatus === '待绑定' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{guardianStatus}</span></td>
                    <td className="py-3 px-4 text-center text-[#64748B] font-mono text-[12px]">
                      {latestRight?.serviceExpireAt || stu.serviceExpireAt || (serviceStatus === 'pending' ? '激活后计算' : '待定')}
                    </td>
                    <td className="py-3 px-4 text-right"><div className="flex justify-end gap-3"><button onClick={() => setDetailStudent(stu)} className="text-[12px] font-bold text-[#64748B] hover:text-[#0F172A]">详情</button><button onClick={() => setServiceStudent(stu)} className="rounded-lg border border-[#86D6A5] bg-[#F0FBF4] px-3 py-1.5 text-[12px] font-bold text-[#0E7D3E] hover:bg-[#E3F7EA]">办理服务</button></div></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {false && (
        <div className="space-y-4">
          {mergedServiceRights.map((right) => {
            const authCode = authCodes.find((item) => item.id === right.authCodeId);
            const guardianCode = guardianBindingCodes.find((item) => item.studentId === right.studentId);
            return <div key={right.id} className="rounded-2xl border border-[#A7E4BE] bg-white p-5 shadow-2xs">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-[16px] font-bold text-[#0F172A]">{right.studentName} · {right.packageName}</h3><p className="mt-1 text-[12px] text-[#64748B]">{right.institutionName} · {right.teacherName}</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">待激活</span></div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-[#F8FAFC] p-3"><div className="text-[11px] text-[#64748B]">AI 用量</div><div className="mt-1 font-bold">{right.includedAiUsage.toLocaleString()}</div></div>
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

      {/* Tab 4: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <DiagnosticsView students={students} onGenerateReport={onGenerateReport} />
      )}

      {detailStudent && (() => {
        const rights = mergedServiceRights.filter((item) => item.studentId === detailStudent.id);
        const guardian = guardianships.find((item) => item.studentId === detailStudent.id);
        const bindingCode = guardianBindingCodes.find((item) => item.studentId === detailStudent.id);
        const teacher = teachers.find((item) => item.id === detailStudent.teacherId);
        return <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-label={`学生详情 · ${detailStudent.name}`}>
          <button className="flex-1 cursor-default" aria-label="关闭学生详情" onClick={() => setDetailStudent(null)} />
          <aside className="h-full w-full max-w-[620px] overflow-y-auto bg-[#F8FAFC] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#E2E8F0] bg-white px-6 py-5">
              <div><h3 className="text-[18px] font-bold text-[#0F172A]">{detailStudent.name}</h3><p className="mt-1 text-[12px] text-[#64748B]">{detailStudent.institutionName} · {detailStudent.grade} · 负责教师 {detailStudent.teacherName}</p></div>
              <button onClick={() => setDetailStudent(null)} className="rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9]" aria-label="关闭"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4 p-5">
              <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                <h4 className="text-[14px] font-bold text-[#0F172A]">基本资料</h4>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]"><div><span className="text-[#94A3B8]">登录账号</span><p className="mt-1 font-mono font-bold">{detailStudent.account}</p></div><div><span className="text-[#94A3B8]">服务状态</span><p className="mt-1 font-bold">{detailStudent.serviceStatus === 'active' ? '服务中' : detailStudent.serviceStatus === 'expired' ? '已到期' : '待办理'}</p></div><div><span className="text-[#94A3B8]">负责教师可用点数</span><p className="mt-1 font-mono font-bold text-[#0E7D3E]">{teacher ? `${teacher.remainingQuota.toLocaleString()} 点` : '未找到教师账户'}</p></div></div>
              </section>
              <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                <div className="flex items-center justify-between"><div><h4 className="text-[14px] font-bold text-[#0F172A]">服务权益</h4><p className="mt-1 text-[11px] text-[#64748B]">每笔服务包、AI 用量、双码和有效期分别保留。</p></div><button onClick={() => { setDetailStudent(null); setServiceStudent(detailStudent); }} className="rounded-lg bg-[#E8F7EE] px-3 py-1.5 text-[12px] font-bold text-[#0E7D3E]">办理新服务</button></div>
                <div className="mt-3 space-y-2">{rights.length === 0 ? <div className="rounded-xl bg-[#F8FAFC] p-4 text-[12px] text-[#94A3B8]">暂无服务权益</div> : rights.map((right) => {
                  const authCode = authCodes.find((item) => item.id === right.authCodeId);
                  const rightStatus = { pending: '待激活', active: '服务中', expired: '已到期', revoked: '已撤销' }[right.status];
                  const authStatus = authCode ? { pending: '待激活', used: '已激活', expired: '已过期', revoked: '已作废' }[authCode.status] : '待生成';
                  const guardianStatus = bindingCode ? { pending: '待绑定', bound: '已绑定', expired: '已失效' }[bindingCode.status] : '待生成';
                  return <div key={right.id} className="rounded-xl border border-[#E2E8F0] p-3">
                    <div className="flex justify-between gap-3"><strong className="text-[13px]">{right.packageName}</strong><span className={`text-[11px] font-bold ${right.status === 'active' ? 'text-[#0E7D3E]' : right.status === 'pending' ? 'text-amber-700' : 'text-[#64748B]'}`}>{rightStatus}</span></div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[#64748B]"><span>AI 用量 {right.includedAiUsage.toLocaleString()}</span><span>到期 {right.serviceExpireAt || (right.status === 'pending' ? '激活后计算' : '长期有效')}</span><span className="font-mono text-[#0E7D3E]">学生授权码 {authCode?.code || '待生成'} · {authStatus}</span><span className="font-mono text-[#0E7D3E]">家长绑定码 {bindingCode?.code || '待生成'} · {guardianStatus}</span></div>
                  </div>;
                })}</div>
              </section>
              <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                <h4 className="text-[14px] font-bold text-[#0F172A]">家长关系</h4>
                {guardian ? <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F8FAFC] p-3"><div><div className="text-[13px] font-bold">{guardian.parentName}</div><div className="mt-1 text-[11px] text-[#64748B]">{guardian.relationType} · {guardian.parentPhone}</div></div><div className="flex items-center gap-3"><span className={`text-[11px] font-bold ${guardian.status === 'active' ? 'text-[#0E7D3E]' : 'text-amber-700'}`}>{guardian.status === 'active' ? '已绑定' : '待绑定'}</span>{guardian.status === 'active' && <button onClick={() => onUpdateGuardianshipStatus(guardian.id, 'released')} className="text-[11px] font-bold text-red-500">解除关系</button>}</div></div> : <div className="mt-3 rounded-xl bg-[#F8FAFC] p-3 text-[12px] text-[#64748B]">{bindingCode ? `家长绑定码 ${bindingCode.code} · 待绑定` : '暂无家长关系'}</div>}
              </section>
            </div>
          </aside>
        </div>;
      })()}

      {serviceStudent && (
        <DialogShell
          title={`办理学生服务 · ${serviceStudent.name}`}
          description={`${serviceStudent.institutionName} · 负责教师 ${serviceStudent.teacherName}`}
          onClose={() => setServiceStudent(null)}
        >
          <ServiceFulfillmentPanel student={serviceStudent} packages={packages} teacherRemainingQuota={teachers.find((item) => item.id === serviceStudent.teacherId)?.remainingQuota} onFulfill={onFulfillService} compact />
        </DialogShell>
      )}
    </div>
  );
};
