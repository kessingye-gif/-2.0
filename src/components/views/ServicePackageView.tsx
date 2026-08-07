import React, { useState } from 'react';
import { ServicePackage, PackageType } from '../../types';

interface ServicePackageViewProps {
  packages: ServicePackage[];
  onAddPackage: (pkg: Omit<ServicePackage, 'id'>) => void;
  onUpdatePackage: (id: string, updates: Partial<ServicePackage>) => void;
}

const ALL_SYSTEM_CONTENT_PACKAGES = [
  '人教版初中数学全套内容包',
  '人教版初中物理精选内容包',
  '人教版初中化学核心内容包',
  '人教版初中生物精选内容包',
  '初中英语词汇与阅读包',
  '人教版高中数学必修与选修包',
  '人教版高中物理竞赛包',
  '初中全科中考提分通关内容包',
];

export const ServicePackageView: React.FC<ServicePackageViewProps> = ({
  packages,
  onAddPackage,
  onUpdatePackage,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ServicePackage | null>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'single_low' as PackageType,
    quotaCost: 50,
    dailyAiLimit: 15,
    durationDays: 365,
    description: '',
    status: 'active' as 'active' | 'inactive',
    subjectRequirement: 'single' as 'single' | 'all',
    contentPackageMode: 'single' as 'single' | 'multiple',
    selectedContentPackages: ALL_SYSTEM_CONTENT_PACKAGES.slice(0, 4),
  });

  const handleOpenAdd = () => {
    setEditingPkg(null);
    setForm({
      name: '',
      code: `SP-${Date.now().toString().slice(-6)}`,
      type: 'single_low',
      quotaCost: 50,
      dailyAiLimit: 15,
      durationDays: 365,
      description: '',
      status: 'active',
      subjectRequirement: 'single',
      contentPackageMode: 'single',
      selectedContentPackages: ALL_SYSTEM_CONTENT_PACKAGES.slice(0, 4),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: ServicePackage) => {
    setEditingPkg(pkg);
    const isSingleType = pkg.type.startsWith('single');
    setForm({
      name: pkg.name,
      code: pkg.code,
      type: pkg.type,
      quotaCost: pkg.quotaCost,
      dailyAiLimit: pkg.dailyAiLimit,
      durationDays: pkg.durationDays || 365,
      description: pkg.description,
      status: pkg.status,
      subjectRequirement: pkg.subjectRequirement,
      contentPackageMode: pkg.contentPackageMode || (isSingleType ? 'single' : 'multiple'),
      selectedContentPackages: pkg.includedContentPackages && pkg.includedContentPackages.length > 0
        ? pkg.includedContentPackages
        : ALL_SYSTEM_CONTENT_PACKAGES.slice(0, 4),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const typeNameMap: Record<PackageType, string> = {
      single_low: '单科低量包',
      single_high: '单科高量包',
      all_low: '全科低量包',
      all_high: '全科高量包',
    };

    const isSingle = form.type.startsWith('single');
    const mode = form.contentPackageMode;

    if (editingPkg) {
      onUpdatePackage(editingPkg.id, {
        name: form.name,
        type: form.type,
        typeName: typeNameMap[form.type],
        quotaCost: Number(form.quotaCost),
        dailyAiLimit: Number(form.dailyAiLimit),
        durationDays: form.durationDays ? Number(form.durationDays) : null,
        description: form.description,
        status: form.status,
        subjectRequirement: isSingle ? 'single' : 'all',
        contentPackageMode: mode,
        includedContentPackages: form.selectedContentPackages,
      });
    } else {
      onAddPackage({
        code: form.code || `SP-${Date.now().toString().slice(-6)}`,
        name: form.name,
        type: form.type,
        typeName: typeNameMap[form.type],
        quotaCost: Number(form.quotaCost),
        dailyAiLimit: Number(form.dailyAiLimit),
        durationDays: form.durationDays ? Number(form.durationDays) : null,
        description: form.description,
        status: form.status,
        subjectRequirement: isSingle ? 'single' : 'all',
        contentPackageMode: mode,
        includedContentPackages: form.selectedContentPackages,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-2xs">
        <div>
          <span className="text-[14px] font-bold text-[#0F172A] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#16B45B] text-[20px]">inventory_2</span>
            服务包与内容包关联配置
          </span>
          <p className="text-[11.5px] text-[#64748B] mt-0.5">
            服务包定义额度扣减与 AI 限制，支持为服务包关联单个或多个【内容包】资源
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1 bg-[#16B45B] text-white px-3.5 py-1.5 rounded-lg font-bold text-[12.5px] shadow-xs hover:bg-[#139B4E] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>新建服务包</span>
        </button>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => {
          const isSingle = pkg.type.startsWith('single');
          const isHigh = pkg.type.endsWith('high');
          const mode = pkg.contentPackageMode || (isSingle ? 'single' : 'multiple');
          const contentPacks = pkg.includedContentPackages || ALL_SYSTEM_CONTENT_PACKAGES.slice(0, 3);

          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-2xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                pkg.status === 'active'
                  ? 'border-[#E2E8F0] hover:border-[#16B45B]'
                  : 'border-gray-200 opacity-60 bg-gray-50'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                      isHigh
                        ? 'bg-[#FFFBEB] text-[#D97706]'
                        : 'bg-[#E8F7EE] text-[#0E7D3E]'
                    }`}
                  >
                    {pkg.typeName}
                  </span>

                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      pkg.status === 'active'
                        ? 'bg-[#E8F7EE] text-[#16B45B]'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {pkg.status === 'active' ? '销售中' : '已停售'}
                  </span>
                </div>

                <h3 className="text-[15px] font-bold text-[#0F172A]">
                  {pkg.name}
                </h3>
                <p className="text-[10.5px] font-mono text-[#94A3B8]">编码: {pkg.code}</p>

                <p className="text-[12px] text-[#475569] mt-2 line-clamp-2 min-h-[36px]">
                  {pkg.description}
                </p>

                {/* Content Package Scope Section */}
                <div className="mt-3 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#334155] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#16B45B]">
                        {mode === 'single' ? 'looks_one' : 'auto_awesome_motion'}
                      </span>
                      {mode === 'single' ? '单内容包模式 (任选1包)' : '多内容包模式 (包含多包)'}
                    </span>
                    <span className="text-[10.5px] font-bold text-[#64748B]">
                      {contentPacks.length} 个备选
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {contentPacks.slice(0, 3).map((cpName) => (
                      <span
                        key={cpName}
                        className="bg-white border border-[#CBD5E1] text-[#334155] text-[10.5px] px-1.5 py-0.5 rounded-md font-medium truncate max-w-full"
                        title={cpName}
                      >
                        📦 {cpName.replace(/人教版|全套|核心|精选|内容包/g, '')}
                      </span>
                    ))}
                    {contentPacks.length > 3 && (
                      <span className="text-[10px] text-[#64748B] font-bold px-1 py-0.5">
                        +{contentPacks.length - 3} More
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="mt-3 pt-3 border-t border-[#E2E8F0] space-y-1.5 text-[12px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">扣减额度:</span>
                    <span className="font-bold text-[#0F172A] font-mono text-[14px]">
                      {pkg.quotaCost} 点/生
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">每日 AI 限制:</span>
                    <span className="font-bold text-[#16B45B] font-mono text-[14px]">
                      {pkg.dailyAiLimit} 次/天
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11.5px]">
                    <span className="text-[#64748B]">有效期:</span>
                    <span className="font-mono text-[#0F172A]">
                      {pkg.durationDays ? `${pkg.durationDays} 天` : '长期'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-2.5 border-t border-[#E2E8F0] flex justify-between items-center">
                <button
                  onClick={() =>
                    onUpdatePackage(pkg.id, {
                      status: pkg.status === 'active' ? 'inactive' : 'active',
                    })
                  }
                  className={`text-[11.5px] font-bold cursor-pointer hover:underline ${
                    pkg.status === 'active' ? 'text-[#DC2626]' : 'text-[#16B45B]'
                  }`}
                >
                  {pkg.status === 'active' ? '下架' : '上架'}
                </button>

                <button
                  onClick={() => handleOpenEdit(pkg)}
                  className="flex items-center gap-0.5 text-[12px] text-[#16B45B] font-bold hover:underline cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  编辑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-[17px] font-bold text-[#0F172A]">
                {editingPkg ? '编辑服务包与内容包关联' : '新建 AI 服务包'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  服务包名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="如：单科低量包"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#16B45B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">
                    服务包编码
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] font-mono bg-[#F8FAFC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">
                    标准包类型
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const newType = e.target.value as PackageType;
                      const isSingle = newType.startsWith('single');
                      setForm({
                        ...form,
                        type: newType,
                        contentPackageMode: isSingle ? 'single' : 'multiple',
                      });
                    }}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none cursor-pointer focus:border-[#16B45B]"
                  >
                    <option value="single_low">单科低量包</option>
                    <option value="single_high">单科高量包</option>
                    <option value="all_low">全科低量包</option>
                    <option value="all_high">全科高量包</option>
                  </select>
                </div>
              </div>

              {/* Content Packages Configuration Section */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-[12.5px] font-bold text-[#0F172A] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#16B45B]">folder_zip</span>
                    内容包包含模式
                  </label>
                  <div className="flex bg-[#E2E8F0] p-0.5 rounded-lg text-[11.5px]">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, contentPackageMode: 'single' })}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        form.contentPackageMode === 'single'
                          ? 'bg-white text-[#16B45B] shadow-2xs'
                          : 'text-[#64748B]'
                      }`}
                    >
                      任选1个内容包
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, contentPackageMode: 'multiple' })}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        form.contentPackageMode === 'multiple'
                          ? 'bg-white text-[#16B45B] shadow-2xs'
                          : 'text-[#64748B]'
                      }`}
                    >
                      包含多个内容包
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#64748B]">
                  {form.contentPackageMode === 'single'
                    ? '【单内容包模式】：激活时学生可在勾选的内容包池中选择 1 个指定内容包使用。'
                    : '【多内容包模式】：激活后学生可直接同时开通并使用勾选的全部内容包。'}
                </p>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-bold text-[#334155]">
                      关联/可选的内容包列表 ({form.selectedContentPackages.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (form.selectedContentPackages.length === ALL_SYSTEM_CONTENT_PACKAGES.length) {
                          setForm({ ...form, selectedContentPackages: [] });
                        } else {
                          setForm({ ...form, selectedContentPackages: [...ALL_SYSTEM_CONTENT_PACKAGES] });
                        }
                      }}
                      className="text-[11px] font-bold text-[#16B45B] hover:underline cursor-pointer"
                    >
                      {form.selectedContentPackages.length === ALL_SYSTEM_CONTENT_PACKAGES.length ? '取消全选' : '全选内容包'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto p-2 bg-white border border-[#E2E8F0] rounded-lg">
                    {ALL_SYSTEM_CONTENT_PACKAGES.map((cpName) => {
                      const isChecked = form.selectedContentPackages.includes(cpName);
                      return (
                        <label
                          key={cpName}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-[#F1F5F9] text-[12px] cursor-pointer text-[#334155]"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({
                                  ...form,
                                  selectedContentPackages: [...form.selectedContentPackages, cpName],
                                });
                              } else {
                                setForm({
                                  ...form,
                                  selectedContentPackages: form.selectedContentPackages.filter((p) => p !== cpName),
                                });
                              }
                            }}
                            className="rounded accent-[#16B45B]"
                          />
                          <span className="font-medium truncate">{cpName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">
                    扣减采购额度 (点)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.quotaCost}
                    onChange={(e) => setForm({ ...form, quotaCost: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] font-mono outline-none focus:border-[#16B45B]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] mb-1">
                    每日 AI 限制 (次/天)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.dailyAiLimit}
                    onChange={(e) => setForm({ ...form, dailyAiLimit: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] font-mono outline-none focus:border-[#16B45B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  服务天数 (天，留空为长期有效)
                </label>
                <input
                  type="number"
                  placeholder="365"
                  value={form.durationDays || ''}
                  onChange={(e) =>
                    setForm({ ...form, durationDays: e.target.value ? Number(e.target.value) : 365 })
                  }
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] font-mono outline-none focus:border-[#16B45B]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] mb-1">
                  描述与权益说明
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="说明适用年级与权益细节..."
                  className="w-full border border-[#E2E8F0] rounded-lg p-2.5 text-[13px] outline-none focus:border-[#16B45B]"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[14px] text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#16B45B] text-white rounded-lg text-[14px] font-bold hover:bg-[#139B4E] cursor-pointer shadow-2xs"
                >
                  保存配置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

