import React, { useState } from 'react';
import { ParentGuardianship, GuardianshipStatus } from '../../types';

interface GuardianshipViewProps {
  guardianships: ParentGuardianship[];
  onUpdateStatus: (id: string, status: GuardianshipStatus) => void;
}

export const GuardianshipView: React.FC<GuardianshipViewProps> = ({
  guardianships,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'guardianship' | 'permissions'>('guardianship');

  // Permission Test Role State
  const [simulatedRole, setSimulatedRole] = useState<'teacher' | 'institutionAdmin' | 'superAdmin'>('teacher');
  const [permissionNotice, setPermissionNotice] = useState<string>('');

  const handleUpdateGuardianship = (id: string, newStatus: GuardianshipStatus) => {
    onUpdateStatus(id, newStatus);
  };

  const handleAttemptFieldEdit = (fieldName: string, isReadOnlyForRole: boolean) => {
    if (isReadOnlyForRole) {
      setPermissionNotice(`【权限拦截】当前角色【${simulatedRole === 'teacher' ? '普通教师' : '机构管理员'}】无权修改【${fieldName}】！系统已安全拦截。`);
    } else {
      setPermissionNotice(`【权限校验通过】当前角色具备修改【${fieldName}】的合规配置权限。`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-6">
        <button
          onClick={() => setActiveTab('guardianship')}
          className={`pb-2.5 text-[13.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'guardianship'
              ? 'text-[#16B45B] border-b-2 border-[#16B45B]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">family_restroom</span>
          监护关系列表
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-2.5 text-[13.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'permissions'
              ? 'text-[#16B45B] border-b-2 border-[#16B45B]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
          权限模拟测试
        </button>
      </div>

      {activeTab === 'guardianship' ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                <tr>
                  <th className="px-6 py-4 font-bold">家长姓名 (联系电话)</th>
                  <th className="px-6 py-4 font-bold">绑定学生 / 归属机构</th>
                  <th className="px-6 py-4 font-bold">监护关系类型</th>
                  <th className="px-6 py-4 font-bold">申请时间</th>
                  <th className="px-6 py-4 font-bold">关系状态</th>
                  <th className="px-6 py-4 font-bold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {guardianships.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0F172A]">{item.parentName}</div>
                      <div className="text-[11px] text-[#64748B] font-mono">{item.parentPhone}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0F172A]">{item.studentName}</div>
                      <div className="text-[11px] text-[#64748B]">{item.institutionName}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded bg-[#E8F7EE] text-[#0E7D3E] font-bold text-[12px]">
                        {item.relationType}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono text-[12px] text-[#64748B]">
                      {item.createdAt}
                    </td>

                    <td className="px-6 py-4">
                      {item.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F7EE] text-[#16B45B] font-bold text-[12px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16B45B]"></span>
                          已生效
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] font-bold text-[12px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F5B700]"></span>
                          待审核
                        </span>
                      )}
                      {item.status === 'frozen' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold text-[12px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                          已冻结
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] font-bold text-[12px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                          已拒绝
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateGuardianship(item.id, 'active')}
                              className="px-3 py-1 bg-[#16B45B] text-white rounded-lg font-bold text-[12px] hover:bg-[#139B4E] cursor-pointer shadow-2xs"
                            >
                              同意绑定
                            </button>
                            <button
                              onClick={() => handleUpdateGuardianship(item.id, 'rejected')}
                              className="px-3 py-1 bg-[#FEF2F2] text-[#DC2626] rounded-lg font-bold text-[12px] hover:bg-red-100 cursor-pointer"
                            >
                              拒绝
                            </button>
                          </>
                        )}

                        {item.status === 'active' && (
                          <button
                            onClick={() => handleUpdateGuardianship(item.id, 'frozen')}
                            className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-bold text-[12px] cursor-pointer"
                          >
                            冻结只读权限
                          </button>
                        )}

                        {item.status === 'frozen' && (
                          <button
                            onClick={() => handleUpdateGuardianship(item.id, 'active')}
                            className="px-3 py-1 bg-[#16B45B] text-white rounded-lg font-bold text-[12px] hover:bg-[#139B4E] cursor-pointer"
                          >
                            恢复解冻
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Permission Matrix Simulator */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-[#0F172A] text-[15px]">
                选择当前测试角色（验证系统字段级访问拦截机制）
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSimulatedRole('teacher');
                    setPermissionNotice('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all ${
                    simulatedRole === 'teacher'
                      ? 'bg-[#16B45B] text-white shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                  }`}
                >
                  普通教师角色
                </button>
                <button
                  onClick={() => {
                    setSimulatedRole('institutionAdmin');
                    setPermissionNotice('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all ${
                    simulatedRole === 'institutionAdmin'
                      ? 'bg-[#16B45B] text-white shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                  }`}
                >
                  机构管理员角色
                </button>
                <button
                  onClick={() => {
                    setSimulatedRole('superAdmin');
                    setPermissionNotice('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all ${
                    simulatedRole === 'superAdmin'
                      ? 'bg-[#16B45B] text-white shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                  }`}
                >
                  超级管理员角色
                </button>
              </div>
            </div>

            {permissionNotice && (
              <div
                className={`p-3.5 rounded-xl text-[13px] font-bold flex items-center gap-2 ${
                  permissionNotice.includes('拦截')
                    ? 'bg-[#FEF2F2] border border-[#DC2626]/30 text-[#DC2626]'
                    : 'bg-[#E8F7EE] border border-[#16B45B]/30 text-[#0E7D3E]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {permissionNotice.includes('拦截') ? 'block' : 'check_circle'}
                </span>
                <span>{permissionNotice}</span>
              </div>
            )}

            {/* Matrix Form Fields Simulator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              {/* Field 1 */}
              <div className="p-4 border border-[#E2E8F0] rounded-xl space-y-1 bg-[#F8FAFC]">
                <div className="flex justify-between font-bold">
                  <span className="text-[#0F172A]">学生姓名 / 年级 / 学科信息</span>
                  <span className="text-[#16B45B]">所有角色可编辑</span>
                </div>
                <button
                  onClick={() => handleAttemptFieldEdit('学生姓名/年级', false)}
                  className="w-full mt-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#16B45B] hover:text-[#16B45B] rounded-lg text-[12px] font-bold cursor-pointer transition-colors"
                >
                  尝试修改学生姓名/年级
                </button>
              </div>

              {/* Field 2 */}
              <div className="p-4 border border-[#E2E8F0] rounded-xl space-y-1 bg-[#F8FAFC]">
                <div className="flex justify-between font-bold">
                  <span className="text-[#0F172A]">学生登录密码与凭证</span>
                  <span className={simulatedRole === 'teacher' ? 'text-[#DC2626]' : 'text-[#16B45B]'}>
                    {simulatedRole === 'teacher' ? '普通教师禁止修改' : '允许修改'}
                  </span>
                </div>
                <button
                  onClick={() => handleAttemptFieldEdit('登录密码与凭证', simulatedRole === 'teacher')}
                  className="w-full mt-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#16B45B] hover:text-[#16B45B] rounded-lg text-[12px] font-bold cursor-pointer transition-colors"
                >
                  尝试重置学生密码
                </button>
              </div>

              {/* Field 3 */}
              <div className="p-4 border border-[#E2E8F0] rounded-xl space-y-1 bg-[#F8FAFC]">
                <div className="flex justify-between font-bold">
                  <span className="text-[#0F172A]">划拨额度与服务授权码</span>
                  <span className={simulatedRole !== 'superAdmin' ? 'text-[#DC2626]' : 'text-[#16B45B]'}>
                    {simulatedRole !== 'superAdmin' ? '仅超级管理员可用' : '允许划拨'}
                  </span>
                </div>
                <button
                  onClick={() => handleAttemptFieldEdit('划拨额度', simulatedRole !== 'superAdmin')}
                  className="w-full mt-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#16B45B] hover:text-[#16B45B] rounded-lg text-[12px] font-bold cursor-pointer transition-colors"
                >
                  尝试划拨额度
                </button>
              </div>

              {/* Field 4 */}
              <div className="p-4 border border-[#DC2626]/20 bg-[#FEF2F2]/40 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-[#DC2626]">
                  <span>历史答题记录与 AI 诊断结论</span>
                  <span>全角色只读 (不可改写)</span>
                </div>
                <button
                  onClick={() => handleAttemptFieldEdit('历史答题与诊断结论', true)}
                  className="w-full mt-3 py-2 bg-white border border-[#DC2626]/30 text-[#DC2626] hover:bg-red-50 rounded-lg text-[12px] font-bold cursor-pointer transition-colors"
                >
                  尝试手动改写诊断结论
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
