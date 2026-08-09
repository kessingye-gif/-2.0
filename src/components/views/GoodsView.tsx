import React, { useState, useMemo } from 'react';
import {
  ServicePackage,
  TokenTopUpPack,
  CreditEntryRecord,
  AuthCode,
  OrderLedgerRecord,
  Institution,
  PackageType,
} from '../../types';

interface GoodsViewProps {
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
}

const initialTokenPacks: TokenTopUpPack[] = [
  { id: 'TP-01', code: 'TP-1M', name: '100万 Token 超值加油包', tokenAmount: 1000000, price: 500, status: 'active', description: '适用于重度 AI 问答与大篇幅诊断报告生成', createdAt: '2026-06-01' },
  { id: 'TP-02', code: 'TP-5M', name: '500万 Token 机构专属包', tokenAmount: 5000000, price: 2200, status: 'active', description: '适合中大型机构全学期 AI 高频使用', createdAt: '2026-06-15' },
  { id: 'TP-03', code: 'TP-10M', name: '1000万 Token 旗舰算力包', tokenAmount: 10000000, price: 4000, status: 'active', description: '旗舰级算力配额，无时间限制直至消耗完毕', createdAt: '2026-07-01' },
];

const initialCreditEntries: CreditEntryRecord[] = [
  { id: 'CE-20260701', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', paymentAmount: 50000, allocatedCredits: 50000, entryDate: '2026-07-01', voucherNo: 'P-20260701-001', operatorName: '超级管理员', notes: '对公转账 5 万元已到账，划拨 5 万采购点数', createdAt: '2026-07-01 10:30' },
  { id: 'CE-20260715', institutionId: 'INS-2023045', institutionName: '上海青葱教育培训中心', paymentAmount: 20000, allocatedCredits: 20000, entryDate: '2026-07-15', voucherNo: 'P-20260715-082', operatorName: '超级管理员', notes: '支票结算，充值 2 万点', createdAt: '2026-07-15 14:20' },
];

const initialLedgers: OrderLedgerRecord[] = [
  { id: 'ORD-1001', orderNo: 'ORD-20260728-001', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', type: 'credit_inflow', typeName: '机构点数入账', paymentAmount: 50000, creditChange: 50000, status: 'completed', operatorName: '超级管理员', timestamp: '2026-07-28 11:20', reason: '线下对公充值' },
  { id: 'ORD-1002', orderNo: 'ORD-20260729-014', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学', type: 'package_redeem', typeName: '授权码服务包兑换', paymentAmount: 0, creditChange: -350, status: 'completed', operatorName: '王教师', timestamp: '2026-07-29 09:15', reason: '兑换高三全科冲刺包' },
  { id: 'ORD-1003', orderNo: 'ORD-20260730-008', institutionId: 'INS-2023045', institutionName: '上海青葱教育培训中心', type: 'token_pack_buy', typeName: 'Token加油包购买', paymentAmount: 500, creditChange: -500, status: 'completed', operatorName: '张管理员', timestamp: '2026-07-30 16:40', reason: '购买100万 Token加油包' },
  { id: 'ORD-1004', orderNo: 'ORD-20260731-002', institutionId: 'INS-2022091', institutionName: '博雅语言学院', type: 'reversal', typeName: '点数误冲正冲销', paymentAmount: 0, creditChange: -2000, status: 'reversed', operatorName: '超级管理员', timestamp: '2026-07-31 18:00', originalOrderNo: 'ORD-20260720-005', reason: '充值金额核算纠错冲正' },
];

const initialStudentTokenOrders = [
  { id: 'PAY-20260808-0192', student: '张伟强', institution: '浙江大学附属中学', pack: '标准加油包', channel: '微信支付', amount: 39.9, token: 1000000, status: '已到账', time: '2026-08-08 19:32' },
  { id: 'PAY-20260808-0186', student: '李思思', institution: '上海青葱教育培训中心', pack: '轻量加油包', channel: '支付宝', amount: 9.9, token: 200000, status: '已到账', time: '2026-08-08 18:46' },
  { id: 'PAY-20260807-0163', student: '王浩然', institution: '博雅语言学院', pack: '畅用加油包', channel: '微信支付', amount: 99, token: 3000000, status: '已退款', time: '2026-08-07 16:03' },
];

export const GoodsView: React.FC<GoodsViewProps> = ({
  packages,
  authCodes,
  institutions,
  onAddPackage,
  onUpdatePackage,
  onRevokeAuthCode,
  onGenerateCodeForTest,
  onAdjustQuota,
}) => {
  const [activeTab, setActiveTab] = useState<'packages' | 'tokenPacks' | 'creditEntry' | 'authCodes' | 'ledger' | 'tokenOrders'>('tokenOrders');

  // Token Packs State
  const [tokenPacks, setTokenPacks] = useState<TokenTopUpPack[]>(initialTokenPacks);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    name: '',
    code: '',
    tokenAmount: 1000000,
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

  const handleAddTokenPack = (e: React.FormEvent) => {
    e.preventDefault();
    const newPack: TokenTopUpPack = {
      id: `TP-${Date.now().toString().slice(-4)}`,
      code: tokenForm.code || `TP-${Date.now().toString().slice(-4)}`,
      name: tokenForm.name,
      tokenAmount: Number(tokenForm.tokenAmount),
      price: Number(tokenForm.price),
      description: tokenForm.description,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTokenPacks((prev) => [newPack, ...prev]);
    setIsTokenModalOpen(false);
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[13px] text-[#64748B]">运营</p>
        <h2 className="mt-1 text-[24px] font-semibold tracking-tight text-[#0F172A]">开通监管</h2>
      </div>
      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-6 text-[13.5px] font-semibold">
        <button
          onClick={() => setActiveTab('tokenOrders')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'tokenOrders' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Token 订单 ({initialStudentTokenOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('authCodes')}
          className={`pb-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'authCodes' ? 'text-[#16B45B] border-b-2 border-[#16B45B]' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          服务开通记录 ({authCodes.length})
        </button>
      </div>

      {activeTab === 'tokenOrders' && (
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
            <div><h3 className="text-[15px] font-semibold text-[#0F172A]">学生 Token 加油包订单</h3><p className="mt-1 text-[12px] text-[#64748B]">微信、支付宝支付与 Token 到账状态</p></div>
            <input className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-[12px] outline-none" placeholder="搜索订单或学生" />
          </div>
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-4 py-3">订单号</th><th className="px-4 py-3">学生 / 机构</th><th className="px-4 py-3">加油包</th><th className="px-4 py-3">支付方式</th><th className="px-4 py-3">实付</th><th className="px-4 py-3">到账 Token</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">时间</th></tr></thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {initialStudentTokenOrders.map((order) => (
                <tr key={order.id}><td className="px-4 py-3.5 font-mono text-[12px]">{order.id}</td><td className="px-4 py-3.5"><div className="font-medium">{order.student}</div><div className="text-[11px] text-[#94A3B8]">{order.institution}</div></td><td className="px-4 py-3.5">{order.pack}</td><td className="px-4 py-3.5">{order.channel}</td><td className="px-4 py-3.5 tabular-nums">¥{order.amount}</td><td className="px-4 py-3.5 tabular-nums">{order.token.toLocaleString()}</td><td className={`px-4 py-3.5 font-medium ${order.status === '已退款' ? 'text-[#94A3B8]' : 'text-[#0E7D3E]'}`}>{order.status}</td><td className="px-4 py-3.5 text-[12px] text-[#64748B]">{order.time}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* Tab 2: Token TopUp Packs */}
      {activeTab === 'tokenPacks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E2E8F0]">
            <span className="text-[13px] text-[#64748B]">
              Token 加油包供机构在基本额度消耗完后独立采购，直接充值至机构全局 Token 资金池
            </span>
            <button
              onClick={() => {
                setTokenForm({
                  name: '',
                  code: `TP-${Date.now().toString().slice(-4)}`,
                  tokenAmount: 1000000,
                  price: 500,
                  description: '',
                });
                setIsTokenModalOpen(true);
              }}
              className="bg-[#16B45B] text-white px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold flex items-center gap-1 shadow-xs hover:bg-[#139B4E] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              新建 Token 加油包
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tokenPacks.map((pack) => (
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
                      {(pack.tokenAmount / 10000).toFixed(0)}万 Token
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
              生成测试授权码
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
                <option value="token_pack_buy">Token加油包购买</option>
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

      {/* Token Pack Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#0F172A] border-b pb-3 mb-4">新建 Token 加油包</h3>
            <form onSubmit={handleAddTokenPack} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">加油包名称</label>
                <input
                  type="text"
                  required
                  value={tokenForm.name}
                  onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                  placeholder="如：200万 Token 专项加油包"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">包含 Token 数</label>
                  <input
                    type="number"
                    required
                    value={tokenForm.tokenAmount}
                    onChange={(e) => setTokenForm({ ...tokenForm, tokenAmount: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">售价 (元)</label>
                  <input
                    type="number"
                    required
                    value={tokenForm.price}
                    onChange={(e) => setTokenForm({ ...tokenForm, price: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">说明描述</label>
                <textarea
                  rows={2}
                  value={tokenForm.description}
                  onChange={(e) => setTokenForm({ ...tokenForm, description: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsTokenModalOpen(false)}
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
