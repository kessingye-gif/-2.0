import React, { useState, useMemo } from 'react';
import {
  ServicePackage,
  AiUsagePack,
  CreditEntryRecord,
  AuthCode,
  OrderLedgerRecord,
  Institution,
  PackageType,
} from '../../types';
import { StudentAddOnOrdersPanel } from '../goods/StudentAddOnOrdersPanel';
import type { RefundAuditEvent } from '../../domain/studentAddOnOrder';

interface GoodsViewProps {
  mode: 'catalog' | 'fulfillment' | 'finance';
  packages: ServicePackage[];
  authCodes: AuthCode[];
  institutions: Institution[];
  onAddPackage: (pkg: Omit<ServicePackage, 'id'>) => void;
  onUpdatePackage: (id: string, updates: Partial<ServicePackage>) => void;
  onRevokeAuthCode: (codeId: string) => void;
  onGenerateCodeForTest: (
    institutionName: string,
    teacherName: string,
    studentName: string,
    packageName: string
  ) => void;
  onAdjustQuota: (id: string, amount: number, isIncrease: boolean, reason: string) => void;
  onAudit: (event: RefundAuditEvent) => void;
  onNotify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
}

const initialAiUsagePacks: AiUsagePack[] = [
  { id: 'AUP-01', code: 'AUP-1M', name: '100万 AI 用量超值加油包', usageAmount: 1000000, price: 500, status: 'active', description: '适用于重度 AI 问答与大篇幅诊断报告生成', createdAt: '2026-06-01' },
  { id: 'AUP-02', code: 'AUP-5M', name: '500万 AI 用量机构专属包', usageAmount: 5000000, price: 2200, status: 'active', description: '适合中大型机构全学期 AI 高频使用', createdAt: '2026-06-15' },
  { id: 'AUP-03', code: 'AUP-10M', name: '1000万 AI 用量旗舰包', usageAmount: 10000000, price: 4000, status: 'active', description: '旗舰级 AI 用量，无时间限制直至消耗完毕', createdAt: '2026-07-01' },
];

const initialCreditEntries: CreditEntryRecord[] = [
  { id: 'CE-20260701', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', paymentAmount: 50000, allocatedCredits: 50000, entryDate: '2026-07-01', voucherNo: 'P-20260701-001', operatorName: '超级管理员', notes: '对公转账 5 万元已到账，划拨 5 万采购点数', createdAt: '2026-07-01 10:30' },
  { id: 'CE-20260715', institutionId: 'INS-2023045', institutionName: '上海青葱教育培训中心', paymentAmount: 20000, allocatedCredits: 20000, entryDate: '2026-07-15', voucherNo: 'P-20260715-082', operatorName: '超级管理员', notes: '支票结算，充值 2 万点', createdAt: '2026-07-15 14:20' },
];

const initialLedgers: OrderLedgerRecord[] = [
  { id: 'ORD-1001', orderNo: 'ORD-20260728-001', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', type: 'credit_inflow', typeName: '机构点数入账', paymentAmount: 50000, creditChange: 50000, status: 'completed', operatorName: '超级管理员', timestamp: '2026-07-28 11:20', reason: '线下对公充值' },
  { id: 'ORD-1002', orderNo: 'ORD-20260729-014', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', type: 'package_redeem', typeName: '授权码服务包兑换', paymentAmount: 0, creditChange: -350, status: 'completed', operatorName: '王教师', timestamp: '2026-07-29 09:15', reason: '兑换高三全科冲刺包' },
  { id: 'ORD-1003', orderNo: 'ORD-20260730-008', institutionId: 'INS-2023045', institutionName: '上海青葱教育培训中心', type: 'ai_usage_pack_buy', typeName: 'AI 加油包购买', paymentAmount: 500, creditChange: -500, status: 'completed', operatorName: '张管理员', timestamp: '2026-07-30 16:40', reason: '购买100万 AI 用量加油包' },
  { id: 'ORD-1004', orderNo: 'ORD-20260731-002', institutionId: 'INS-2022091', institutionName: '博雅语言学院', type: 'reversal', typeName: '点数误冲正冲销', paymentAmount: 0, creditChange: -2000, status: 'reversed', operatorName: '超级管理员', timestamp: '2026-07-31 18:00', originalOrderNo: 'ORD-20260720-005', reason: '充值金额核算纠错冲正' },
];

export const GoodsView: React.FC<GoodsViewProps> = ({
  mode,
  packages,
  authCodes,
  institutions,
  onAddPackage,
  onUpdatePackage,
  onRevokeAuthCode,
  onGenerateCodeForTest,
  onAdjustQuota,
  onAudit,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'packages' | 'aiUsagePacks' | 'creditEntry' | 'authCodes' | 'ledger' | 'addOnOrders'>(
    mode === 'catalog' ? 'packages' : mode === 'fulfillment' ? 'authCodes' : 'creditEntry',
  );

  // AI usage packs state
  const [aiUsagePacks, setAiUsagePacks] = useState<AiUsagePack[]>(initialAiUsagePacks);
  const [isAiUsageModalOpen, setIsAiUsageModalOpen] = useState(false);
  const [aiUsageForm, setAiUsageForm] = useState({
    name: '',
    code: '',
    usageAmount: 1000000,
    price: 500,
    description: '',
  });

  // Credit Entry State
  const [creditEntries, setCreditEntries] = useState<CreditEntryRecord[]>(initialCreditEntries);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditForm, setCreditForm] = useState({
    institutionId: institutions[0]?.id || '',
    paymentAmount: 10000,
    allocatedCredits: 10000,
    entryDate: new Date().toISOString().slice(0, 10),
    voucherNo: '',
    notes: '',
  });

  // Service Package Modal
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ServicePackage | null>(null);
  const [pkgForm, setPkgForm] = useState({
    name: '',
    code: '',
    type: 'single_low' as PackageType,
    quotaCost: 50,
    dailyAiLimit: 15,
    durationDays: 365,
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Auth Code State
  const [codeSearch, setCodeSearch] = useState('');
  const [codeStatusFilter, setCodeStatusFilter] = useState('');

  // Ledger State
  const [ledgers, setLedgers] = useState<OrderLedgerRecord[]>(initialLedgers);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('');

  // Handlers
  const handleOpenAddPkg = () => {
    setEditingPkg(null);
    setPkgForm({
      name: '',
      code: `SP-${Date.now().toString().slice(-6)}`,
      type: 'single_low',
      quotaCost: 50,
      dailyAiLimit: 15,
      durationDays: 365,
      description: '',
      status: 'active',
    });
    setIsPkgModalOpen(true);
  };

  const handleOpenEditPkg = (pkg: ServicePackage) => {
    setEditingPkg(pkg);
    setPkgForm({
      name: pkg.name,
      code: pkg.code,
      type: pkg.type,
      quotaCost: pkg.quotaCost,
      dailyAiLimit: pkg.dailyAiLimit,
      durationDays: pkg.durationDays || 365,
      description: pkg.description,
      status: pkg.status,
    });
    setIsPkgModalOpen(true);
  };

  const handleSavePkg = (e: React.FormEvent) => {
    e.preventDefault();
    const typeNameMap: Record<PackageType, string> = {
      single_low: '单科低量包',
      single_high: '单科高量包',
      all_low: '全科低量包',
      all_high: '全科高量包',
    };

    if (editingPkg) {
      onUpdatePackage(editingPkg.id, {
        name: pkgForm.name,
        type: pkgForm.type,
        typeName: typeNameMap[pkgForm.type],
        quotaCost: Number(pkgForm.quotaCost),
        dailyAiLimit: Number(pkgForm.dailyAiLimit),
        durationDays: Number(pkgForm.durationDays),
        description: pkgForm.description,
        status: pkgForm.status,
      });
    } else {
      onAddPackage({
        code: pkgForm.code || `SP-${Date.now().toString().slice(-6)}`,
        name: pkgForm.name,
        type: pkgForm.type,
        typeName: typeNameMap[pkgForm.type],
        quotaCost: Number(pkgForm.quotaCost),
        dailyAiLimit: Number(pkgForm.dailyAiLimit),
        durationDays: Number(pkgForm.durationDays),
        description: pkgForm.description,
        status: pkgForm.status,
        subjectRequirement: pkgForm.type.startsWith('single') ? 'single' : 'all',
      });
    }
    setIsPkgModalOpen(false);
  };

  const handleAddAiUsagePack = (e: React.FormEvent) => {
    e.preventDefault();
    const newPack: AiUsagePack = {
      id: `AUP-${Date.now().toString().slice(-4)}`,
      code: aiUsageForm.code || `AUP-${Date.now().toString().slice(-4)}`,
      name: aiUsageForm.name,
      usageAmount: Number(aiUsageForm.usageAmount),
      price: Number(aiUsageForm.price),
      description: aiUsageForm.description,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setAiUsagePacks((prev) => [newPack, ...prev]);
    setIsAiUsageModalOpen(false);
  };

  const handleAddCreditEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const inst = institutions.find((i) => i.id === creditForm.institutionId);
    if (!inst) return;

    const newRecord: CreditEntryRecord = {
      id: `CE-${Date.now().toString().slice(-6)}`,
      institutionId: inst.id,
      institutionName: inst.name,
      paymentAmount: Number(creditForm.paymentAmount),
      allocatedCredits: Number(creditForm.allocatedCredits),
      entryDate: creditForm.entryDate,
      voucherNo: creditForm.voucherNo || `P-${Date.now().toString().slice(-8)}`,
      operatorName: '超级管理员',
      notes: creditForm.notes,
      createdAt: new Date().toLocaleString().slice(0, 16),
    };

    setCreditEntries((prev) => [newRecord, ...prev]);

    // Update institution quota & log ledger
    onAdjustQuota(inst.id, Number(creditForm.allocatedCredits), true, `线下入账充值 (${newRecord.voucherNo})`);

    const newLedger: OrderLedgerRecord = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      orderNo: `ORD-${Date.now().toString().slice(-8)}`,
      institutionId: inst.id,
      institutionName: inst.name,
      type: 'credit_inflow',
      typeName: '机构点数入账',
      paymentAmount: Number(creditForm.paymentAmount),
      creditChange: Number(creditForm.allocatedCredits),
      status: 'completed',
      operatorName: '超级管理员',
      timestamp: new Date().toLocaleString().slice(0, 16),
      reason: `线下入账凭证: ${newRecord.voucherNo}`,
    };
    setLedgers((prev) => [newLedger, ...prev]);

    setIsCreditModalOpen(false);
  };

  const filteredAuthCodes = useMemo(() => {
    return authCodes.filter((item) => {
      const matchSearch =
        !codeSearch ||
        item.code.toLowerCase().includes(codeSearch.toLowerCase()) ||
        item.institutionName.includes(codeSearch) ||
        (item.studentName && item.studentName.includes(codeSearch));
      const matchStatus = !codeStatusFilter || item.status === codeStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [authCodes, codeSearch, codeStatusFilter]);

  const filteredLedgers = useMemo(() => {
    return ledgers.filter((item) => {
      const matchSearch =
        !ledgerSearch ||
        item.orderNo.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        item.institutionName.includes(ledgerSearch) ||
        item.operatorName.includes(ledgerSearch);
      const matchType = !ledgerTypeFilter || item.type === ledgerTypeFilter;
      return matchSearch && matchType;
    });
  }, [ledgers, ledgerSearch, ledgerTypeFilter]);

  const pageMeta = {
    catalog: { eyebrow: '商品、额度与权益', title: '商品与权益管理', description: '从商品配置、机构额度入账到学生权益开通和流水追溯，统一在此闭环。' },
    fulfillment: { eyebrow: '商业履约 · 学生开通', title: '开通与履约', description: '跟踪学生开通码的生成、激活、过期与作废状态。' },
    finance: { eyebrow: '商业履约 · 资金结算', title: '订单与资金', description: '统一查看机构入账、服务兑换、AI 加油包购买与退款流水。' },
  }[mode];

  const tabs = mode === 'catalog'
    ? [
        { id: 'packages' as const, label: '服务包' },
        { id: 'aiUsagePacks' as const, label: 'AI 加油包' },
        { id: 'creditEntry' as const, label: '机构额度入账' },
        { id: 'authCodes' as const, label: `学生权益开通 (${authCodes.length})` },
        { id: 'ledger' as const, label: '权益流水' },
        { id: 'addOnOrders' as const, label: '学生加油包订单' },
      ]
    : mode === 'fulfillment'
      ? [{ id: 'authCodes' as const, label: `学生开通记录 (${authCodes.length})` }]
      : [{ id: 'creditEntry' as const, label: '机构额度入账' }, { id: 'ledger' as const, label: '订单流水' }, { id: 'addOnOrders' as const, label: '学生加油包订单' }];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[12px] font-medium text-[#0E7D3E]">{pageMeta.eyebrow}</p>
        <h2 className="mt-1 text-[24px] font-bold tracking-tight text-[#0F172A]">{pageMeta.title}</h2>
        <p className="mt-1 text-[12px] text-[#64748B]">{pageMeta.description}</p>
      </div>
      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-6 text-[13.5px] font-semibold">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === tab.id ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'addOnOrders' && (
        <StudentAddOnOrdersPanel onAudit={onAudit} onNotify={onNotify} />
      )}

      {/* Tab 1: Service Packages */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E2E8F0]">
            <span className="text-[13px] text-[#64748B]">
              服务包对应学员实际消费的 AI 功能额度与服务有效期，支持单科/全科及高低量配置
            </span>
            <button
              onClick={handleOpenAddPkg}
              className="bg-[#16B45B] text-white px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold flex items-center gap-1 shadow-xs hover:bg-[#139B4E] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              新增服务包
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-4 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E8F7EE] text-[#16B45B]">
                      {pkg.typeName}
                    </span>
                    <h3 className="text-[16px] font-bold text-[#0F172A] mt-1.5">{pkg.name}</h3>
                    <p className="text-[11px] font-mono text-[#94A3B8]">{pkg.code}</p>
                  </div>
                  <button
                    onClick={() => handleOpenEditPkg(pkg)}
                    className="text-[#16B45B] hover:underline font-bold text-[12px] cursor-pointer"
                  >
                    编辑
                  </button>
                </div>

                <div className="bg-[#F8FAFC] rounded-xl p-3 grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <span className="text-[#64748B] block">消耗采购点数</span>
                    <strong className="text-[#0F172A] text-[14px] font-mono">{pkg.quotaCost} 点</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">每日 AI 上限</span>
                    <strong className="text-[#16B45B] text-[14px] font-mono">{pkg.dailyAiLimit} 次/天</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">服务有效期</span>
                    <strong className="text-[#0F172A]">{pkg.durationDays ? `${pkg.durationDays} 天` : '长期有效'}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">状态</span>
                    <span className={`font-bold ${pkg.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                      {pkg.status === 'active' ? '可采购兑换' : '已停用'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#F1F5F9] rounded-xl text-[11.5px] border border-[#E2E8F0] flex items-center justify-between gap-3">
                  <span className="font-bold text-[#334155] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#16B45B]">folder_zip</span>
                    {pkg.contentPackageMode === 'single' ? '激活时任选 1 个内容包' : '激活后包含多个内容包'}
                  </span>
                  <span className="shrink-0 text-[#64748B] font-bold">覆盖 {(pkg.includedContentPackages || []).length} 个内容包</span>
                </div>

                <p className="text-[12px] text-[#64748B]">{pkg.description || '无详细配置说明'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI usage packs */}
      {activeTab === 'aiUsagePacks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E2E8F0]">
            <span className="text-[13px] text-[#64748B]">
              AI 加油包用于补充学生端 AI 用量，与机构点数和学生权益分别记账
            </span>
            <button
              onClick={() => {
                setAiUsageForm({
                  name: '',
                  code: `TP-${Date.now().toString().slice(-4)}`,
                  usageAmount: 1000000,
                  price: 500,
                  description: '',
                });
                setIsAiUsageModalOpen(true);
              }}
              className="bg-[#16B45B] text-white px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold flex items-center gap-1 shadow-xs hover:bg-[#139B4E] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              新建 AI 加油包
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiUsagePacks.map((pack) => (
              <div key={pack.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-3">
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E8F7EE] text-[#16B45B]">
                    {pack.status === 'active' ? '已上架' : '已停用'}
                  </span>
                </div>

                <h3 className="text-[15px] font-bold text-[#0F172A]">{pack.name}</h3>
                <p className="text-[12px] text-[#64748B]">{pack.description}</p>

                <div className="border-t border-[#E2E8F0] pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-[11px] text-[#64748B] block">包含算力</span>
                    <span className="text-[16px] font-extrabold font-mono text-[#0F172A]">
                      {(pack.usageAmount / 10000).toFixed(0)}万 AI 用量
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#64748B] block">统一售价</span>
                    <span className="text-[18px] font-extrabold text-[#16B45B] font-mono">¥{pack.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Credit Entry */}
      {activeTab === 'creditEntry' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E2E8F0]">
            <span className="text-[13px] text-[#64748B]">
              确认机构线下对公汇款到账后，在此录入入账凭证并自动触发采购点数划拨
            </span>
            <button
              onClick={() => setIsCreditModalOpen(true)}
              className="bg-[#16B45B] text-white px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold flex items-center gap-1 shadow-xs hover:bg-[#139B4E] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              录入线下入账
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <tr>
                  <th className="py-3 px-4">凭证/流水号</th>
                  <th className="py-3 px-4">收款机构</th>
                  <th className="py-3 px-4 text-right">实收金额 (元)</th>
                  <th className="py-3 px-4 text-right">划拨点数 (点)</th>
                  <th className="py-3 px-4">入账日期</th>
                  <th className="py-3 px-4">经办人</th>
                  <th className="py-3 px-4">备注与说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {creditEntries.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{rec.voucherNo}</td>
                    <td className="py-3 px-4 font-bold">{rec.institutionName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">¥{rec.paymentAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#16B45B]">+{rec.allocatedCredits.toLocaleString()}</td>
                    <td className="py-3 px-4 text-[#64748B]">{rec.entryDate}</td>
                    <td className="py-3 px-4 font-bold">{rec.operatorName}</td>
                    <td className="py-3 px-4 text-[#64748B] text-[12px]">{rec.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Auth Codes */}
      {activeTab === 'authCodes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <input
                type="text"
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
                placeholder="搜索授权码、机构或学生..."
                className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none w-64 focus:border-[#16B45B]"
              />
              <select
                value={codeStatusFilter}
                onChange={(e) => setCodeStatusFilter(e.target.value)}
                className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none cursor-pointer font-bold focus:border-[#16B45B]"
              >
                <option value="">全部状态</option>
                <option value="pending">待领用/待激活</option>
                <option value="used">已激活领用</option>
                <option value="revoked">已作废</option>
              </select>
            </div>

            <button
              onClick={() => onGenerateCodeForTest('浙江大学附属中学', '李老师', '张三小学生', '高三全科冲刺包')}
              className="bg-[#16B45B] text-white px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold flex items-center gap-1 cursor-pointer hover:bg-[#139B4E]"
            >
              <span className="material-symbols-outlined text-[16px]">key</span>
              生成学生开通码
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <tr>
                  <th className="py-3 px-4">授权码</th>
                  <th className="py-3 px-4">对应机构</th>
                  <th className="py-3 px-4">对应教师</th>
                  <th className="py-3 px-4">指定学生</th>
                  <th className="py-3 px-4">服务包名称</th>
                  <th className="py-3 px-4">生成 / 激活 / 到期</th>
                  <th className="py-3 px-4 text-center">状态</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredAuthCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-mono font-bold text-[#16B45B]">{code.code}</td>
                    <td className="py-3 px-4 font-bold">{code.institutionName}</td>
                    <td className="py-3 px-4">{code.teacherName}</td>
                    <td className="py-3 px-4 font-bold">{code.studentName || '暂未绑定'}</td>
                    <td className="py-3 px-4">{code.packageName}</td>
                    <td className="py-3 px-4 text-[10px] leading-5 text-[#64748B]">
                      <div>生成 {code.createdAt}</div>
                      <div>激活 {code.activatedAt ?? '尚未激活'}</div>
                      <div>到期 {code.expireAt}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        code.status === 'used' ? 'bg-green-100 text-green-700' : code.status === 'revoked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {code.status === 'used' ? '已激活' : code.status === 'revoked' ? '已作废' : '待激活'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {code.status === 'pending' && (
                        <button
                          onClick={() => onRevokeAuthCode(code.id)}
                          className="text-red-500 hover:underline font-bold text-[12px] cursor-pointer"
                        >
                          作废
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Order Ledgers */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="搜索订单号、机构或操作人..."
                className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none w-64 focus:border-[#16B45B]"
              />
              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[13px] outline-none cursor-pointer font-bold focus:border-[#16B45B]"
              >
                <option value="">全部流水类型</option>
                <option value="credit_inflow">机构点数入账</option>
                <option value="package_redeem">服务包兑换</option>
                <option value="ai_usage_pack_buy">AI 加油包购买</option>
                <option value="reversal">冲正/退款流水</option>
              </select>
            </div>
            <span className="text-[12px] text-[#64748B]">
              不可覆盖订单流水：所有变更均生成新的冲正或逆向订单
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <tr>
                  <th className="py-3 px-4">订单编号</th>
                  <th className="py-3 px-4">机构名称</th>
                  <th className="py-3 px-4">业务类型</th>
                  <th className="py-3 px-4 text-right">金额 (元)</th>
                  <th className="py-3 px-4 text-right">点数变动</th>
                  <th className="py-3 px-4">操作人</th>
                  <th className="py-3 px-4">交易时间</th>
                  <th className="py-3 px-4">状态/原因</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredLedgers.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{ord.orderNo}</td>
                    <td className="py-3 px-4 font-bold">{ord.institutionName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold">
                        {ord.typeName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">¥{ord.paymentAmount}</td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${ord.creditChange >= 0 ? 'text-[#16B45B]' : 'text-amber-600'}`}>
                      {ord.creditChange > 0 ? `+${ord.creditChange}` : ord.creditChange}
                    </td>
                    <td className="py-3 px-4 font-bold">{ord.operatorName}</td>
                    <td className="py-3 px-4 text-[#64748B] text-[12px]">{ord.timestamp}</td>
                    <td className="py-3 px-4 text-[12px]">
                      {ord.status === 'reversed' ? (
                        <span className="text-red-500 font-bold">已冲正 ({ord.reason})</span>
                      ) : (
                        <span className="text-gray-600">{ord.reason || '正常交易'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credit Entry Modal */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3 mb-4">录入机构线下点数入账</h3>
            <form onSubmit={handleAddCreditEntry} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">入账机构</label>
                <select
                  value={creditForm.institutionId}
                  onChange={(e) => setCreditForm({ ...creditForm, institutionId: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-bold"
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">实收金额 (元)</label>
                  <input
                    type="number"
                    required
                    value={creditForm.paymentAmount}
                    onChange={(e) => setCreditForm({ ...creditForm, paymentAmount: Number(e.target.value), allocatedCredits: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">划拨点数 (点)</label>
                  <input
                    type="number"
                    required
                    value={creditForm.allocatedCredits}
                    onChange={(e) => setCreditForm({ ...creditForm, allocatedCredits: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">打款凭证/流水号</label>
                <input
                  type="text"
                  value={creditForm.voucherNo}
                  onChange={(e) => setCreditForm({ ...creditForm, voucherNo: e.target.value })}
                  placeholder="如：P-20260805-001"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">备注说明</label>
                <textarea
                  rows={2}
                  value={creditForm.notes}
                  onChange={(e) => setCreditForm({ ...creditForm, notes: e.target.value })}
                  placeholder="输入打款与审核情况..."
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCreditModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E]"
                >
                  确认充值入账
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI usage pack modal */}
      {isAiUsageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3 mb-4">新建 AI 加油包</h3>
            <form onSubmit={handleAddAiUsagePack} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">加油包名称</label>
                <input
                  type="text"
                  required
                  value={aiUsageForm.name}
                  onChange={(e) => setAiUsageForm({ ...aiUsageForm, name: e.target.value })}
                  placeholder="如：200万 AI 用量专项加油包"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">包含 AI 用量</label>
                  <input
                    type="number"
                    required
                    value={aiUsageForm.usageAmount}
                    onChange={(e) => setAiUsageForm({ ...aiUsageForm, usageAmount: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">售价 (元)</label>
                  <input
                    type="number"
                    required
                    value={aiUsageForm.price}
                    onChange={(e) => setAiUsageForm({ ...aiUsageForm, price: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">说明描述</label>
                <textarea
                  rows={2}
                  value={aiUsageForm.description}
                  onChange={(e) => setAiUsageForm({ ...aiUsageForm, description: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAiUsageModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E]"
                >
                  保存并上架
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Package Modal */}
      {isPkgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3 mb-4">
              {editingPkg ? '编辑服务包' : '新增服务包'}
            </h3>
            <form onSubmit={handleSavePkg} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">服务包名称</label>
                <input
                  type="text"
                  required
                  value={pkgForm.name}
                  onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                  placeholder="如：初中数学单科提升包"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">服务包类型</label>
                  <select
                    value={pkgForm.type}
                    onChange={(e) => setPkgForm({ ...pkgForm, type: e.target.value as PackageType })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none cursor-pointer"
                  >
                    <option value="single_low">单科低量包</option>
                    <option value="single_high">单科高量包</option>
                    <option value="all_low">全科低量包</option>
                    <option value="all_high">全科高量包</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">消耗点数</label>
                  <input
                    type="number"
                    required
                    value={pkgForm.quotaCost}
                    onChange={(e) => setPkgForm({ ...pkgForm, quotaCost: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">每日 AI 上限 (次)</label>
                  <input
                    type="number"
                    required
                    value={pkgForm.dailyAiLimit}
                    onChange={(e) => setPkgForm({ ...pkgForm, dailyAiLimit: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">有效天数</label>
                  <input
                    type="number"
                    value={pkgForm.durationDays}
                    onChange={(e) => setPkgForm({ ...pkgForm, durationDays: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">说明描述</label>
                <textarea
                  rows={2}
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsPkgModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] text-[13px] font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16B45B] text-white rounded-xl text-[13px] font-bold hover:bg-[#139B4E]"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
