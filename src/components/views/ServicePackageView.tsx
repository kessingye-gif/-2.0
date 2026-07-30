import React, { useState } from 'react';
import { ServicePackage, PackageType } from '../../types';

interface ServicePackageViewProps {
  packages: ServicePackage[];
  onAddPackage: (pkg: Omit<ServicePackage, 'id'>) => void;
  onUpdatePackage: (id: string, updates: Partial<ServicePackage>) => void;
}

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
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: ServicePackage) => {
    setEditingPkg(pkg);
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
        subjectRequirement: form.type.startsWith('single') ? 'single' : 'all',
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
        subjectRequirement: form.type.startsWith('single') ? 'single' : 'all',
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-2xs">
        <span className="text-[13px] font-bold text-[#0F172A] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#16B45B] text-[18px]">inventory_2</span>
          四类标准服务包配置 (按使用额度扣减)
        </span>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1 bg-[#16B45B] text-white px-3 py-1.5 rounded-lg font-bold text-[12.5px] shadow-xs hover:bg-[#139B4E] transition-all cursor-pointer"
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

          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-[17px] font-bold text-[#0F172A]">
                {editingPkg ? '编辑服务包配置' : '新建 AI 服务包'}
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
                    onChange={(e) => setForm({ ...form, type: e.target.value as PackageType })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] outline-none cursor-pointer focus:border-[#16B45B]"
                  >
                    <option value="single_low">单科低量包</option>
                    <option value="single_high">单科高量包</option>
                    <option value="all_low">全科低量包</option>
                    <option value="all_high">全科高量包</option>
                  </select>
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
