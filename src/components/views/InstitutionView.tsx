import React, { useState, useMemo } from 'react';
import { Institution, RegionType } from '../../types';

interface InstitutionViewProps {
  institutions: Institution[];
  onAddInstitution: (inst: Omit<Institution, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateInstitution: (id: string, updates: Partial<Institution>) => void;
  onAdjustQuota: (id: string, amount: number, isIncrease: boolean, reason: string) => void;
  onBatchImport: (file: File) => void;
}

export const InstitutionView: React.FC<InstitutionViewProps> = ({
  institutions,
  onAddInstitution,
  onUpdateInstitution,
  onAdjustQuota,
  onBatchImport,
}) => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustQuotaOpen, setIsAdjustQuotaOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAccountPasswordModalOpen, setIsAccountPasswordModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({
    username: '',
    password: '',
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    region: 'huadong' as RegionType,
    regionName: '华东地区',
    contactPerson: '',
    phone: '',
    email: '',
    adminAccount: '',
    adminPassword: '123456',
    initialQuota: 50000,
    status: 'active' as 'active' | 'inactive',
  });

  // Quota Adjust Form
  const [quotaAdjustType, setQuotaAdjustType] = useState<'increase' | 'decrease'>('increase');
  const [quotaAdjustAmount, setQuotaAdjustAmount] = useState<number>(10000);
  const [quotaAdjustReason, setQuotaAdjustReason] = useState<string>('超级管理员例行采购额度划拨');

  // Filtered institutions
  const filteredInstitutions = useMemo(() => {
    return institutions.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.includes(searchTerm);

      const matchesRegion = !regionFilter || item.region === regionFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.status === 'active') ||
        (statusFilter === 'inactive' && item.status === 'inactive');

      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [institutions, searchTerm, regionFilter, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const activeCount = institutions.filter((i) => i.status === 'active').length;
    const totalStudents = institutions.reduce((acc, curr) => acc + curr.studentCount, 0);
    const alertCount = institutions.filter((i) => {
      if (i.totalQuota === 0) return false;
      return i.remainingQuota / i.totalQuota <= 0.15 && i.status === 'active';
    }).length;
    const totalRemaining = institutions.reduce((acc, curr) => acc + curr.remainingQuota, 0);

    return {
      activeCount,
      totalStudents,
      alertCount,
      totalRemaining: totalRemaining > 1000000 ? `${(totalRemaining / 1000000).toFixed(1)}M` : `${totalRemaining.toLocaleString()}`,
    };
  }, [institutions]);

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      code: `INS-${Date.now().toString().slice(-6)}`,
      region: 'huadong',
      regionName: '华东地区',
      contactPerson: '',
      phone: '',
      email: '',
      adminAccount: '',
      adminPassword: '123456',
      initialQuota: 50000,
      status: 'active',
    });
    setSelectedInstitution(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (inst: Institution) => {
    setSelectedInstitution(inst);
    setFormData({
      name: inst.name,
      code: inst.code,
      region: inst.region,
      regionName: inst.regionName,
      contactPerson: inst.contactPerson,
      phone: inst.phone,
      email: inst.email,
      adminAccount: inst.adminAccount,
      adminPassword: inst.adminPassword || '123456',
      initialQuota: inst.totalQuota,
      status: inst.status,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenAccountModal = (inst: Institution) => {
    setSelectedInstitution(inst);
    setAccountForm({
      username: inst.adminAccount,
      password: inst.adminPassword || '123456',
    });
    setIsAccountPasswordModalOpen(true);
  };

  const handleSaveAccountCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitution) return;
    if (!accountForm.username.trim() || !accountForm.password.trim()) {
      alert('账号和密码不能为空！');
      return;
    }

    onUpdateInstitution(selectedInstitution.id, {
      adminAccount: accountForm.username.trim(),
      adminPassword: accountForm.password.trim(),
    });

    alert(`机构【${selectedInstitution.name}】账号与密码成功更新！\n账号：${accountForm.username.trim()}\n密码：${accountForm.password.trim()}`);
    setIsAccountPasswordModalOpen(false);
  };

  const handleSubmitInstitutionForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contactPerson.trim() || !formData.phone.trim()) {
      alert('请完整填写机构名称、负责人和联系电话！');
      return;
    }

    const regionMap: Record<RegionType, string> = {
      huadong: '华东地区',
      huabei: '华北地区',
      huanan: '华南地区',
      xinan: '西南地区',
      central: '华中地区',
    };

    if (selectedInstitution) {
      onUpdateInstitution(selectedInstitution.id, {
        name: formData.name,
        region: formData.region,
        regionName: regionMap[formData.region] || '华东地区',
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        adminAccount: formData.adminAccount,
        adminPassword: formData.adminPassword,
        status: formData.status,
      });
    } else {
      onAddInstitution({
        name: formData.name,
        code: formData.code || `INS-${Date.now().toString().slice(-6)}`,
        region: formData.region,
        regionName: regionMap[formData.region] || '华东地区',
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email || `${formData.adminAccount || 'admin'}@school.edu.cn`,
        adminAccount: formData.adminAccount || `admin_${Date.now().toString().slice(-4)}`,
        adminPassword: formData.adminPassword || '123456',
        totalQuota: Number(formData.initialQuota) || 50000,
        remainingQuota: Number(formData.initialQuota) || 50000,
        teacherCount: 0,
        studentCount: 0,
        status: formData.status,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleOpenAdjustQuota = (inst: Institution) => {
    setSelectedInstitution(inst);
    setQuotaAdjustAmount(10000);
    setQuotaAdjustType('increase');
    setQuotaAdjustReason('超级管理员划拨机构采购额度');
    setIsAdjustQuotaOpen(true);
  };

  const handleConfirmAdjustQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitution) return;
    if (quotaAdjustAmount <= 0) {
      alert('调整数量必须大于 0！');
      return;
    }

    if (quotaAdjustType === 'decrease') {
      const consumed = selectedInstitution.totalQuota - selectedInstitution.remainingQuota;
      const minAllowableTotal = consumed;
      if (selectedInstitution.totalQuota - quotaAdjustAmount < minAllowableTotal) {
        alert(`调减失败：调减后的总额度不能低于已被使用的额度 (${consumed.toLocaleString()} 点)！`);
        return;
      }
    }

    onAdjustQuota(selectedInstitution.id, quotaAdjustAmount, quotaAdjustType === 'increase', quotaAdjustReason);
    setIsAdjustQuotaOpen(false);
  };

  const handleToggleStatus = (inst: Institution) => {
    const newStatus = inst.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? '启用' : '停用';
    if (confirm(`确定要${actionText}机构【${inst.name}】吗？`)) {
      onUpdateInstitution(inst.id, { status: newStatus });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex flex-wrap items-center gap-3 shadow-2xs">
        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索机构名称、代码、负责人..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg py-1.5 pl-9 pr-3 text-[13px] focus:border-[#16B45B] focus:bg-white outline-none"
          />
        </div>

        <div className="w-40">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg py-1.5 px-2.5 text-[13px] focus:border-[#16B45B] focus:bg-white outline-none cursor-pointer"
          >
            <option value="">全部区域</option>
            <option value="huadong">华东地区</option>
            <option value="huabei">华北地区</option>
            <option value="huanan">华南地区</option>
            <option value="central">华中地区</option>
            <option value="xinan">西南地区</option>
          </select>
        </div>

        <div className="w-48 flex bg-[#F8FAFC] rounded-lg p-0.5 border border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1 text-[12px] font-bold rounded-md transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white shadow-xs text-[#16B45B]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            全部
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`flex-1 py-1 text-[12px] font-bold rounded-md transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white shadow-xs text-[#16B45B]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            正常
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`flex-1 py-1 text-[12px] font-bold rounded-md transition-all cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-white shadow-xs text-[#EF4444]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            停用
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSearchTerm('');
              setRegionFilter('');
              setStatusFilter('all');
            }}
            className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
            title="重置筛选项"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>

          <button
            onClick={() => setIsBatchImportOpen(true)}
            className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] px-2.5 py-1.5 rounded-lg font-bold text-[12.5px] hover:bg-gray-100 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">file_upload</span>
            <span>批量导入</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1 bg-[#16B45B] text-white px-3 py-1.5 rounded-lg font-bold text-[12.5px] shadow-xs hover:bg-[#139B4E] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>新增机构</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B]">机构名称 (ID)</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B]">负责人 (联系电话)</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B]">总额度 / 剩余可用</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B] text-center">师生规模</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B]">状态</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#64748B] text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                    <span className="material-symbols-outlined text-[48px] text-gray-300 mb-2 block">
                      domain_disabled
                    </span>
                    <p className="text-[14px] font-medium">未找到符合条件的机构记录</p>
                  </td>
                </tr>
              ) : (
                filteredInstitutions.map((inst) => {
                  const isInactive = inst.status === 'inactive';
                  const remainingPct = inst.totalQuota > 0 ? Math.round((inst.remainingQuota / inst.totalQuota) * 100) : 0;
                  const isWarning = !isInactive && remainingPct <= 15;

                  return (
                    <tr
                      key={inst.id}
                      className={`hover:bg-[#F8FAFC] transition-colors group ${
                        isInactive ? 'bg-[#F8FAFC]/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isInactive
                                ? 'bg-gray-100 text-gray-400'
                                : 'bg-[#E8F7EE] text-[#16B45B]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {isInactive ? 'domain_disabled' : 'school'}
                            </span>
                          </div>
                          <div>
                            <div
                              onClick={() => {
                                setSelectedInstitution(inst);
                                setIsDetailDrawerOpen(true);
                              }}
                              className={`text-[14px] font-bold cursor-pointer hover:underline ${
                                isInactive
                                  ? 'text-gray-400 line-through'
                                  : 'text-[#0F172A]'
                              }`}
                            >
                              {inst.name}
                            </div>
                            <div className="text-[11px] text-[#94A3B8] font-mono flex items-center gap-2">
                              <span>ID: {inst.id}</span>
                              <span className="text-[#16B45B] font-bold bg-[#E8F7EE] px-1.5 py-0.2 rounded text-[10px]">
                                @{inst.adminAccount || '未设账号'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className={`px-6 py-4 ${isInactive ? 'opacity-60' : ''}`}>
                        <div className="text-[14px] font-medium text-[#0F172A]">
                          {inst.contactPerson}
                        </div>
                        <div className="text-[12px] text-[#64748B] font-mono">
                          {inst.phone}
                        </div>
                      </td>

                      <td className={`px-6 py-4 ${isInactive ? 'opacity-60' : ''}`}>
                        <div className="w-44">
                          <div className="flex justify-between text-[11px] mb-1 font-mono">
                            <span className="font-bold text-[#0F172A]">
                              {inst.totalQuota.toLocaleString()}
                            </span>
                            <span
                              className={`font-bold ${
                                isInactive
                                  ? 'text-gray-400'
                                  : isWarning
                                  ? 'text-[#D97706]'
                                  : 'text-[#16B45B]'
                              }`}
                            >
                              {isInactive ? '0%' : `${remainingPct}%`}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isInactive
                                  ? 'bg-gray-300'
                                  : isWarning
                                  ? 'bg-[#F5B700]'
                                  : 'bg-[#16B45B]'
                              }`}
                              style={{ width: `${isInactive ? 0 : remainingPct}%` }}
                            ></div>
                          </div>
                          <div className="text-[10.5px] text-[#64748B] mt-1 text-right font-mono">
                            {isInactive
                              ? '已停用'
                              : `余 ${inst.remainingQuota.toLocaleString()} 点`}
                          </div>
                        </div>
                      </td>

                      <td className={`px-6 py-4 text-center ${isInactive ? 'opacity-60' : ''}`}>
                        <div className="inline-flex flex-col items-center">
                          <span className="text-[14px] font-bold text-[#0F172A] font-mono">
                            {inst.teacherCount} / {inst.studentCount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#64748B]">教师 / 学生</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {inst.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F7EE] text-[#16B45B] text-[12px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16B45B]"></span>
                            已启用
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[12px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            已停用
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleOpenAdjustQuota(inst)}
                            className="p-1.5 text-[#16B45B] hover:bg-[#E8F7EE] rounded-lg transition-all cursor-pointer"
                            title="划拨/调减额度"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              account_balance_wallet
                            </span>
                          </button>

                          <button
                            onClick={() => handleOpenAccountModal(inst)}
                            className="p-1.5 text-[#F5B700] hover:bg-[#FFFBEB] rounded-lg transition-all cursor-pointer"
                            title="设置/重置账号与密码"
                          >
                            <span className="material-symbols-outlined text-[20px]">key</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(inst)}
                            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-all cursor-pointer"
                            title="编辑资料"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(inst)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              inst.status === 'active'
                                ? 'text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2]'
                                : 'text-[#16B45B] hover:bg-[#E8F7EE]'
                            }`}
                            title={inst.status === 'active' ? '停用机构' : '启用机构'}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {inst.status === 'active' ? 'block' : 'play_circle'}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedInstitution(inst);
                              setIsDetailDrawerOpen(true);
                            }}
                            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-all cursor-pointer"
                            title="查看细节"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F7EE] flex items-center justify-center text-[#16B45B]">
            <span className="material-symbols-outlined text-[26px]">corporate_fare</span>
          </div>
          <div>
            <p className="text-[12px] text-[#64748B] font-bold mb-0.5">运行中机构数</p>
            <p className="text-[20px] font-bold text-[#0F172A]">
              {stats.activeCount}{' '}
              <span className="text-[12px] text-[#16B45B] font-bold ml-1">个</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
            <span className="material-symbols-outlined text-[26px]">token</span>
          </div>
          <div>
            <p className="text-[12px] text-[#64748B] font-bold mb-0.5">平台剩余额度</p>
            <p className="text-[20px] font-bold text-[#0F172A]">
              {stats.totalRemaining}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] flex items-center justify-center text-[#D97706]">
            <span className="material-symbols-outlined text-[26px]">group</span>
          </div>
          <div>
            <p className="text-[12px] text-[#64748B] font-bold mb-0.5">服务学生总数</p>
            <p className="text-[20px] font-bold text-[#0F172A]">
              {stats.totalStudents.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] flex items-center justify-center text-[#DC2626]">
            <span className="material-symbols-outlined text-[26px]">warning</span>
          </div>
          <div>
            <p className="text-[12px] text-[#64748B] font-bold mb-0.5">额度预警机构 (≤15%)</p>
            <p className="text-[20px] font-bold text-[#0F172A]">
              {stats.alertCount} <span className="text-[12px] text-[#DC2626] font-normal">需划拨</span>
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-[17px] font-bold text-[#0F172A]">
                {selectedInstitution ? '编辑机构资料' : '新增接入机构'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitInstitutionForm} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  机构名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="如：浙江大学附属中学"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#16B45B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">
                    机构编码
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] bg-[#F8FAFC] font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">
                    所属区域
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value as RegionType })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none cursor-pointer focus:border-[#16B45B]"
                  >
                    <option value="huadong">华东地区</option>
                    <option value="huabei">华北地区</option>
                    <option value="huanan">华南地区</option>
                    <option value="central">华中地区</option>
                    <option value="xinan">西南地区</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">
                    负责人姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="李明"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#16B45B]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="138-8888-0001"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] font-mono outline-none focus:border-[#16B45B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">
                    机构管理员账号
                  </label>
                  <input
                    type="text"
                    placeholder="admin_zjdfz"
                    value={formData.adminAccount}
                    disabled={!!selectedInstitution}
                    onChange={(e) => setFormData({ ...formData, adminAccount: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] bg-[#F8FAFC] font-mono outline-none"
                  />
                </div>

                {!selectedInstitution && (
                  <div>
                    <label className="block text-[12px] font-bold text-[#475569] mb-1">
                      初始采购额度
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={formData.initialQuota}
                      onChange={(e) => setFormData({ ...formData, initialQuota: Number(e.target.value) })}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] font-mono outline-none focus:border-[#16B45B]"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[14px] text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#16B45B] text-white rounded-lg text-[14px] font-bold hover:bg-[#139B4E] cursor-pointer shadow-2xs"
                >
                  保存信息
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Quota Modal */}
      {isAdjustQuotaOpen && selectedInstitution && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-[17px] font-bold text-[#0F172A]">
                划拨/调整机构采购额度
              </h3>
              <button
                onClick={() => setIsAdjustQuotaOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] mb-4 text-[13px] space-y-1">
              <p className="font-bold text-[#0F172A]">{selectedInstitution.name}</p>
              <div className="flex justify-between text-[#64748B] text-[12px]">
                <span>当前总额度: <strong className="text-[#0F172A]">{selectedInstitution.totalQuota.toLocaleString()}</strong> 点</span>
                <span>剩余可用: <strong className="text-[#16B45B]">{selectedInstitution.remainingQuota.toLocaleString()}</strong> 点</span>
              </div>
            </div>

            <form onSubmit={handleConfirmAdjustQuota} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1.5">
                  调整类型
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-[14px] cursor-pointer">
                    <input
                      type="radio"
                      name="quotaType"
                      checked={quotaAdjustType === 'increase'}
                      onChange={() => setQuotaAdjustType('increase')}
                      className="accent-[#16B45B]"
                    />
                    <span className="font-bold text-[#16B45B]">划拨新增额度 (+)</span>
                  </label>
                  <label className="flex items-center gap-2 text-[14px] cursor-pointer">
                    <input
                      type="radio"
                      name="quotaType"
                      checked={quotaAdjustType === 'decrease'}
                      onChange={() => setQuotaAdjustType('decrease')}
                      className="accent-[#DC2626]"
                    />
                    <span className="font-bold text-[#DC2626]">回收调减额度 (-)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  变动数量 (采购额度点数)
                </label>
                <input
                  type="number"
                  step={1000}
                  min={1}
                  required
                  value={quotaAdjustAmount}
                  onChange={(e) => setQuotaAdjustAmount(Number(e.target.value))}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] font-mono outline-none focus:border-[#16B45B]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  变动事由与说明
                </label>
                <textarea
                  rows={2}
                  required
                  value={quotaAdjustReason}
                  onChange={(e) => setQuotaAdjustReason(e.target.value)}
                  placeholder="说明变动原因，如：年度采购划拨或退费扣减..."
                  className="w-full border border-[#E2E8F0] rounded-lg p-2.5 text-[13px] outline-none focus:border-[#16B45B]"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAdjustQuotaOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[14px] text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#16B45B] text-white rounded-lg text-[14px] font-bold hover:bg-[#139B4E] cursor-pointer shadow-2xs"
                >
                  确认调整并记入日志
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {isBatchImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-[17px] font-bold text-[#0F172A]">
                批量导入机构
              </h3>
              <button
                onClick={() => setIsBatchImportOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-[#E2E8F0] rounded-2xl p-6 text-center hover:border-[#16B45B] bg-[#F8FAFC] cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-[40px] text-[#16B45B] mb-2">
                  cloud_upload
                </span>
                <p className="text-[14px] font-bold text-[#0F172A]">点击或拖拽 Excel / CSV 文件到此处</p>
                <p className="text-[12px] text-[#64748B] mt-1">支持 .xlsx, .xls, .csv 格式表格</p>
              </div>

              <div className="flex justify-between items-center text-[12px] text-[#64748B]">
                <span>还没下载模版？</span>
                <a href="#download" className="text-[#16B45B] font-bold hover:underline">
                  下载标准机构导入模版.xlsx
                </a>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsBatchImportOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[14px] text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Institution Detail Drawer */}
      {isDetailDrawerOpen && selectedInstitution && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl overflow-y-auto custom-scrollbar p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start pb-4 border-b border-[#E2E8F0] mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[20px] font-bold text-[#0F172A]">
                      {selectedInstitution.name}
                    </h3>
                    <span className="text-[11px] font-mono bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                      {selectedInstitution.id}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#64748B] mt-1">
                    管理员账号：{selectedInstitution.adminAccount} | 创建于 {selectedInstitution.createdAt}
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="p-1 rounded-lg text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* Quota Card */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[13.5px] font-bold text-[#0F172A]">采购额度总览</span>
                    <span
                      className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                        selectedInstitution.status === 'active'
                          ? 'bg-[#E8F7EE] text-[#16B45B]'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {selectedInstitution.status === 'active' ? '正常服务' : '已停用'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[13px]">
                    <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                      <p className="text-[11px] text-[#64748B]">总划拨额度</p>
                      <p className="text-[18px] font-bold text-[#0F172A] font-mono">
                        {selectedInstitution.totalQuota.toLocaleString()} <span className="text-[11px] font-normal text-[#64748B]">点</span>
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                      <p className="text-[11px] text-[#64748B]">剩余可用额度</p>
                      <p className="text-[18px] font-bold text-[#16B45B] font-mono">
                        {selectedInstitution.remainingQuota.toLocaleString()} <span className="text-[11px] font-normal text-[#64748B]">点</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div className="border border-[#E2E8F0] rounded-2xl p-4 space-y-2 text-[13px]">
                  <h4 className="font-bold text-[#0F172A] mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#16B45B]">badge</span>
                    机构负责人与联系信息
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[#64748B]">
                    <p>负责人: <span className="text-[#0F172A] font-medium">{selectedInstitution.contactPerson}</span></p>
                    <p>联系电话: <span className="text-[#0F172A] font-mono">{selectedInstitution.phone}</span></p>
                    <p>电子邮箱: <span className="text-[#0F172A] font-mono">{selectedInstitution.email}</span></p>
                    <p>所属区域: <span className="text-[#0F172A] font-medium">{selectedInstitution.regionName}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="px-5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl text-[13.5px] font-bold hover:bg-gray-100 cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Institution Account & Password Reset Modal */}
      {isAccountPasswordModalOpen && selectedInstitution && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">key</span>
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F172A]">
                    机构账号与登录密码设置
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    {selectedInstitution.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAccountPasswordModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAccountCredentials} className="space-y-4">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-[12px] text-[#64748B] space-y-1">
                <p className="font-bold text-[#0F172A]">提示：</p>
                <p>设置后的机构登录账号与密码可直接用于【机构管理员登录】门户入口，登录后即可进入专属机构后台。</p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  机构管理员登录账号
                </label>
                <input
                  type="text"
                  required
                  value={accountForm.username}
                  onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                  placeholder="如：admin_zjdfz"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13.5px] font-mono outline-none focus:border-[#16B45B]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[12px] font-bold text-[#475569]">
                    登录密码
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newPass = Math.random().toString(36).slice(-8);
                      setAccountForm({ ...accountForm, password: newPass });
                    }}
                    className="text-[11px] font-bold text-[#16B45B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    随机强密码
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={accountForm.password}
                  onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                  placeholder="如：123456"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13.5px] font-mono outline-none focus:border-[#16B45B]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAccountPasswordModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[13px] text-[#475569] hover:bg-[#F8FAFC] cursor-pointer font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E] cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  更新账号密码
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
