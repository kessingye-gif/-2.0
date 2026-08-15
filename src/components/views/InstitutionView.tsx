import React, { useState, useMemo } from 'react';
import { AuthCode, ContentPackageItem, CooperationPlan, Institution, OrderLedgerRecord, RegionType, ServicePackage } from '../../types';
import { CooperationAuthorizationSummary } from '../cooperation/CooperationAuthorizationSummary';
import { ChoiceCard, DialogShell } from '../ui/FormPrimitives';
import { generateRandomPassword, getPasswordValidationMessage } from '../../utils/password';

interface InstitutionViewProps {
  institutions: Institution[];
  servicePackages: ServicePackage[];
  authCodes: AuthCode[];
  orders: OrderLedgerRecord[];
  onAddInstitution: (inst: Omit<Institution, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateInstitution: (id: string, updates: Partial<Institution>) => void;
  onAdjustQuota: (id: string, amount: number, isIncrease: boolean, reason: string) => void;
  onBatchImport: (file: File) => void;
  onCreditEntry: (institutionId: string) => void;
  contentPackages?: ContentPackageItem[];
  cooperationPlans?: CooperationPlan[];
}

export const InstitutionView: React.FC<InstitutionViewProps> = ({
  institutions,
  servicePackages,
  authCodes,
  orders,
  onAddInstitution,
  onUpdateInstitution,
  onAdjustQuota,
  onBatchImport,
  onCreditEntry,
  contentPackages = [],
  cooperationPlans = [],
}) => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustQuotaOpen, setIsAdjustQuotaOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAccountPasswordModalOpen, setIsAccountPasswordModalOpen] = useState(false);
  const [isAuthorizationModalOpen, setIsAuthorizationModalOpen] = useState(false);
  const [authorizationContentIds, setAuthorizationContentIds] = useState<string[]>([]);
  const [authorizationServiceIds, setAuthorizationServiceIds] = useState<string[]>([]);
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
    adminPassword: generateRandomPassword(),
    initialQuota: 50000,
    status: 'active' as 'active' | 'inactive',
  });

  // Quota Adjust Form
  const [quotaAdjustType, setQuotaAdjustType] = useState<'increase' | 'decrease'>('increase');
  const [quotaAdjustAmount, setQuotaAdjustAmount] = useState<number>(10000);
  const [quotaAdjustReason, setQuotaAdjustReason] = useState<string>('超级管理员例行采购额度划拨');

  const getScopeSummary = (institution: Institution) => {
    const contentPackageNames = institution.availableContentPackages || [];
    const servicePackagesInScope = servicePackages.filter((pkg) =>
      (institution.availableServicePackageIds || []).includes(pkg.id)
    );

    return { contentPackageNames, servicePackagesInScope };
  };

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
      adminPassword: generateRandomPassword(),
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
      adminPassword: inst.adminPassword || generateRandomPassword(),
      initialQuota: inst.totalQuota,
      status: inst.status,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenAccountModal = (inst: Institution) => {
    setSelectedInstitution(inst);
    setAccountForm({
      username: inst.adminAccount,
      password: inst.adminPassword || generateRandomPassword(),
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
    const passwordMessage = getPasswordValidationMessage(accountForm.password);
    if (passwordMessage) {
      alert(passwordMessage);
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
    if (!selectedInstitution || formData.adminPassword !== selectedInstitution.adminPassword) {
      const passwordMessage = getPasswordValidationMessage(formData.adminPassword);
      if (passwordMessage) {
        alert(`机构管理员${passwordMessage}`);
        return;
      }
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
        adminPassword: formData.adminPassword || generateRandomPassword(),
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

  const openAuthorizationModal = (inst: Institution) => {
    const contentIds = contentPackages
      .filter((item) => (inst.availableContentPackages || []).includes(item.id) || (inst.availableContentPackages || []).includes(item.name))
      .map((item) => item.id);
    setSelectedInstitution(inst);
    setAuthorizationContentIds(contentIds);
    setAuthorizationServiceIds(inst.availableServicePackageIds || []);
    setIsAuthorizationModalOpen(true);
  };

  const saveAuthorizationScope = () => {
    if (!selectedInstitution) return;
    onUpdateInstitution(selectedInstitution.id, {
      availableContentPackages: authorizationContentIds,
      availableServicePackageIds: authorizationServiceIds,
    });
    setIsAuthorizationModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索机构名称、负责人或账号..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-1.5 pl-9 pr-3 text-[13px] text-[#0F172A] focus:border-[#16B45B] focus:bg-white outline-none"
            />
          </div>

          {/* Region */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-1.5 px-3 text-[13px] text-[#334155] focus:border-[#16B45B] outline-none cursor-pointer"
          >
            <option value="">全部区域</option>
            <option value="huadong">华东地区</option>
            <option value="huabei">华北地区</option>
            <option value="huanan">华南地区</option>
            <option value="central">华中地区</option>
            <option value="xinan">西南地区</option>
          </select>

          {/* Status Tabs */}
          <div className="flex bg-[#F1F5F9] rounded-xl p-0.5 border border-[#E2E8F0]/50">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-[12px] font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#16B45B] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              全部
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-[12px] font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white shadow-2xs text-[#16B45B]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              正常
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 text-[12px] font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-white shadow-2xs text-[#EF4444]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              已停用
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSearchTerm('');
              setRegionFilter('');
              setStatusFilter('all');
            }}
            className="w-8 h-8 rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
            title="重置"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#16B45B] text-white font-medium text-[13px] shadow-xs hover:bg-[#139B4E] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
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
                <th className="px-5 py-3 text-[12.5px] font-medium text-[#64748B] whitespace-nowrap">机构与状态</th>
                <th className="px-5 py-3 text-[12.5px] font-medium text-[#64748B] whitespace-nowrap">负责人</th>
                <th className="px-5 py-3 text-[12.5px] font-medium text-[#64748B] whitespace-nowrap">额度健康度</th>
                <th className="px-5 py-3 text-[12.5px] font-medium text-[#64748B] whitespace-nowrap">机构授权范围</th>
                <th className="px-5 py-3 text-[12.5px] font-medium text-[#64748B] text-right whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
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
                  const scope = getScopeSummary(inst);

                  return (
                    <tr
                      key={inst.id}
                      className={`hover:bg-[#F8FAFC]/80 transition-colors group ${
                        isInactive ? 'bg-[#F8FAFC]/50' : ''
                      }`}
                    >
                      {/* 机构名称 */}
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        <div>
                          <div className="flex items-center gap-2">
                            {!isInactive && <span className="h-1.5 w-1.5 rounded-full bg-[#16B45B]" aria-label="正常服务" />}
                            <span
                              onClick={() => {
                                setSelectedInstitution(inst);
                                setIsDetailDrawerOpen(true);
                              }}
                              className={`text-[13.5px] font-bold cursor-pointer hover:text-[#16B45B] transition-colors ${
                                isInactive ? 'text-[#64748B]' : 'text-[#0F172A]'
                              }`}
                            >
                              {inst.name}
                            </span>
                            {isInactive && <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10.5px] font-medium text-[#64748B]">已停用</span>}
                          </div>
                          <p className="mt-0.5 text-[10.5px] text-[#94A3B8] font-mono">{inst.code} · {inst.regionName}</p>
                        </div>
                      </td>

                      {/* 负责人 */}
                      <td className={`px-5 py-2.5 whitespace-nowrap ${isInactive ? 'opacity-60' : ''}`}>
                        <div className="text-[13px] font-medium text-[#334155]">
                          {inst.contactPerson}
                        </div>
                      </td>

                      {/* 额度使用情况 */}
                      <td className={`px-5 py-2.5 whitespace-nowrap ${isInactive ? 'opacity-60' : ''}`}>
                        <div>
                          <div className={`mb-1.5 text-[12px] font-medium ${isWarning ? 'text-[#DC2626]' : isInactive ? 'text-[#64748B]' : 'text-[#334155]'}`}>
                            剩余 <span className="font-mono font-bold">{inst.remainingQuota.toLocaleString()}</span> 点
                          </div>
                          <div className="h-1 w-24 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 rounded-full ${
                                  isInactive
                                    ? 'bg-gray-300'
                                    : isWarning
                                    ? 'bg-[#EF4444]'
                                    : 'bg-[#16B45B]'
                                }`}
                                style={{ width: `${isInactive ? 0 : remainingPct}%` }}
                              ></div>
                          </div>
                        </div>
                      </td>

                      <td className={`px-5 py-2.5 ${isInactive ? 'opacity-60' : ''}`}>
                        {scope.contentPackageNames.length === 0 && scope.servicePackagesInScope.length === 0 ? (
                          <div className="text-[12px] text-[#94A3B8]">尚未配置可用范围</div>
                        ) : (
                          <div className="text-[12px] font-medium text-[#475569]">{scope.contentPackageNames.length} 内容包 · {scope.servicePackagesInScope.length} 服务包</div>
                        )}
                      </td>

                      {/* 操作 */}
                      <td className="px-5 py-2.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3 text-[12px]">
                          <button onClick={() => { setSelectedInstitution(inst); setIsDetailDrawerOpen(true); }} className="font-medium text-[#475569] hover:text-[#0E7D3E] cursor-pointer">查看详情</button>
                          <button onClick={() => { setSelectedInstitution(inst); setIsDetailDrawerOpen(true); }} className="rounded-lg bg-[#16B45B] px-3 py-1.5 font-bold text-white hover:bg-[#139B4E] cursor-pointer">开通/配置</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between text-[13px] text-[#64748B]">
          <div>共 {filteredInstitutions.length} 条</div>
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC] cursor-pointer text-[#94A3B8]">
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <span className="w-7 h-7 rounded-lg bg-[#E8F7EE] text-[#16B45B] font-bold flex items-center justify-center border border-[#16B45B]/20">
              1
            </span>
            <button className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC] cursor-pointer text-[#94A3B8]">
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
            <select className="ml-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg py-1 px-2 text-[12px] outline-none text-[#334155]">
              <option>10 条/页</option>
              <option>20 条/页</option>
              <option>50 条/页</option>
            </select>
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
                      初始划拨采购点数 (机构点数)
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={formData.initialQuota}
                      onChange={(e) => setFormData({ ...formData, initialQuota: Number(e.target.value) })}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] font-mono outline-none focus:border-[#16B45B]"
                      placeholder="如: 100000"
                    />
                    <p className="text-[11px] text-[#64748B] mt-1">划拨给该机构使用的 AI 采购点数，机构可二次分发给旗下教师与班级</p>
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
                    <div className="flex items-center gap-2"><span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${selectedInstitution.status === 'active' ? 'bg-[#E8F7EE] text-[#16B45B]' : 'bg-gray-200 text-gray-600'}`}>{selectedInstitution.status === 'active' ? '正常服务' : '已停用'}</span><button onClick={() => { handleOpenAdjustQuota(selectedInstitution); setIsDetailDrawerOpen(false); }} className="rounded-lg border border-[#D8EDE1] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#0E7D3E]">调整额度</button></div>
                  </div>
                  <button onClick={() => { onCreditEntry(selectedInstitution.id); setIsDetailDrawerOpen(false); }} className="text-[12px] font-bold text-[#0E7D3E] hover:underline">录入线下入账 →</button>

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

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-[#0F172A] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-[#16B45B]">deployed_code</span>
                        机构授权范围
                      </h4>
                      <p className="mt-1 text-[11px] text-[#64748B]">内容包与服务包范围分别生效；模板只用于快速带入，不代替本机构已保存的权限。</p>
                    </div>
                    <button onClick={() => openAuthorizationModal(selectedInstitution)} className="shrink-0 rounded-xl border border-[#D8EDE1] bg-[#E8F7EE] px-3 py-2 text-[12px] font-bold text-[#0E7D3E]">修改范围</button>
                  </div>
                  <CooperationAuthorizationSummary
                    contentPackages={contentPackages}
                    servicePackages={servicePackages}
                    contentPackageIds={contentPackages.filter((item) => (selectedInstitution.availableContentPackages || []).includes(item.id) || (selectedInstitution.availableContentPackages || []).includes(item.name)).map((item) => item.id)}
                    servicePackageIds={selectedInstitution.availableServicePackageIds || []}
                  />
                </div>

                {/* Scale info */}
                <div className="border border-[#E2E8F0] rounded-2xl p-4 space-y-3 text-[13px]">
                  <h4 className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#16B45B]">groups</span>
                    师生规模统计
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                      <p className="text-[11px] text-[#64748B]">教师人数</p>
                      <p className="text-[18px] font-bold text-[#0F172A] font-mono">
                        {selectedInstitution.teacherCount} <span className="text-[11px] font-normal text-[#64748B]">人</span>
                      </p>
                    </div>
                    <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                      <p className="text-[11px] text-[#64748B]">学生人数</p>
                      <p className="text-[18px] font-bold text-[#0F172A] font-mono">
                        {selectedInstitution.studentCount.toLocaleString()} <span className="text-[11px] font-normal text-[#64748B]">人</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div className="border border-[#E2E8F0] rounded-2xl p-4 space-y-3 text-[13px]">
                  <h4 className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#16B45B]">badge</span>
                    机构基本信息与联系人
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[#64748B]">
                    <p>机构编码: <span className="text-[#0F172A] font-mono">{selectedInstitution.id}</span></p>
                    <p>管理员账号: <span className="text-[#0F172A] font-mono">@{selectedInstitution.adminAccount || '未设置'}</span></p>
                    <p>负责人姓名: <span className="text-[#0F172A] font-medium">{selectedInstitution.contactPerson}</span></p>
                    <p>联系电话: <span className="text-[#0F172A] font-mono">{selectedInstitution.phone}</span></p>
                    <p>电子邮箱: <span className="text-[#0F172A] font-mono">{selectedInstitution.email || '暂无'}</span></p>
                    <p>所属区域: <span className="text-[#0F172A] font-medium">{selectedInstitution.regionName}</span></p>
                  </div>
                  <div className="flex gap-2 pt-1"><button onClick={() => { handleOpenEditModal(selectedInstitution); setIsDetailDrawerOpen(false); }} className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-[12px] font-bold text-[#334155]">编辑资料</button><button onClick={() => { handleOpenAccountModal(selectedInstitution); setIsDetailDrawerOpen(false); }} className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-[12px] font-bold text-[#334155]">账号管理</button></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap justify-end gap-2">
              <button
                onClick={() => handleToggleStatus(selectedInstitution)}
                className={`px-4 py-2 rounded-xl text-[13px] font-bold cursor-pointer ${
                  selectedInstitution.status === 'active'
                    ? 'bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]'
                    : 'bg-[#E8F7EE] text-[#0E7D3E] hover:bg-[#D6F2E1]'
                }`}
              >
                {selectedInstitution.status === 'active' ? '停用机构' : '启用机构'}
              </button>
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
                      const newPass = generateRandomPassword();
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
                  placeholder="至少 12 位，含大小写、数字和特殊字符"
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

      {isAuthorizationModalOpen && selectedInstitution && (
        <DialogShell
          title={`配置授权范围 · ${selectedInstitution.name}`}
          description="内容包范围和服务包范围分别生效；任何新增商品都不会自动扩大机构权限。"
          onClose={() => setIsAuthorizationModalOpen(false)}
          footer={<>
            <button onClick={() => setIsAuthorizationModalOpen(false)} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-[13px] font-bold text-[#64748B]">取消</button>
            <button onClick={saveAuthorizationScope} className="rounded-xl bg-[#16B45B] px-4 py-2 text-[13px] font-bold text-white">保存授权范围</button>
          </>}
        >
          <div className="space-y-5">
            {cooperationPlans.filter((plan) => plan.status === 'active').length > 0 && (
              <section className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="mb-3"><h4 className="text-[13px] font-bold text-[#0F172A]">从授权模板快速带入</h4><p className="mt-1 text-[11px] text-[#64748B]">带入后仍可单独调整，最终以本弹窗保存的范围为准。</p></div>
                <div className="flex flex-wrap gap-2">{cooperationPlans.filter((plan) => plan.status === 'active').map((plan) => <button key={plan.id} onClick={() => { setAuthorizationContentIds(plan.contentPackageIds); setAuthorizationServiceIds(plan.servicePackageIds); }} className="rounded-lg border border-[#D8EDE1] bg-white px-3 py-2 text-[12px] font-bold text-[#0E7D3E] hover:bg-[#E8F7EE]">{plan.name}</button>)}</div>
              </section>
            )}
            <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
              <div className="mb-3 flex items-center justify-between"><div><h4 className="text-[13px] font-bold text-[#0F172A]">可用及可维护内容包</h4><p className="mt-1 text-[11px] text-[#64748B]">决定机构能访问哪些教学内容。</p></div><span className="text-[11px] font-bold text-[#16B45B]">已选 {authorizationContentIds.length} 个</span></div>
              <div className="grid gap-2 sm:grid-cols-2">{contentPackages.filter((item) => item.status === 'active').map((item) => <ChoiceCard key={item.id} checked={authorizationContentIds.includes(item.id)} title={item.name} meta={`${item.stage} · ${item.subject}`} onChange={() => setAuthorizationContentIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />)}</div>
            </section>
            <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
              <div className="mb-3 flex items-center justify-between"><div><h4 className="text-[13px] font-bold text-[#0F172A]">可兑换服务包</h4><p className="mt-1 text-[11px] text-[#64748B]">决定机构能为学生办理哪些服务。</p></div><span className="text-[11px] font-bold text-[#16B45B]">已选 {authorizationServiceIds.length} 个</span></div>
              <div className="grid gap-2 sm:grid-cols-2">{servicePackages.filter((item) => item.status === 'active').map((item) => <ChoiceCard key={item.id} checked={authorizationServiceIds.includes(item.id)} title={item.name} meta={`${item.quotaCost} 点 · ${item.durationDays || '长期'}${item.durationDays ? ' 天' : ''}`} onChange={() => setAuthorizationServiceIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />)}</div>
            </section>
          </div>
        </DialogShell>
      )}
    </div>
  );
};
