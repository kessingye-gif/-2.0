import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E5E7EB] max-h-[85vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-4 border-b border-[#E5E7EB] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#006948] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#111827] font-headline">
                开窍 AI 学伴 · 系统帮助与 PRD V2.0 规范说明
              </h3>
              <p className="text-[11px] text-[#4B5563]">超级管理员平台管理指南 & Gap 闭环解法</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#3d4a42] hover:text-[#111827] p-1 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 text-[13px] text-[#3d4a42] leading-relaxed">
          <div className="bg-[#f8f9fa] border border-[#E5E7EB] p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-[#111827] text-[14px] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006948] text-[18px]">workspace_premium</span>
              1. 超级管理员 (Super Admin) 核心职责
            </h4>
            <p>· <strong>机构管理</strong>：创建/停用机构，配置与调整机构采购总额度，监管额度告急风险。</p>
            <p>· <strong>服务包管理</strong>：配置单科低量、单科高量、全科低量、全科高量 4 类标准服务包。</p>
            <p>· <strong>额度与授权码履约</strong>：监管向下流转链路，对未激活授权码实施作废或导出。</p>
            <p>· <strong>题库与考点树</strong>：独家维护三级考点树（1级-2级-3级考点）与精选题库，监控缺题预警。</p>
          </div>

          <div className="border border-[#E5E7EB] p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-[#111827] text-[14px] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006948] text-[18px]">account_tree</span>
              2. PRD 额度与授权码向下流转层级
            </h4>
            <p className="font-mono text-[12px] bg-[#f3f4f5] p-2 rounded text-[#111827]">
              超级管理员 (拨付机构额度) &rarr; 机构管理员 (分配教师额度) &rarr; 责任教师 (开通学生服务) &rarr; 12 位授权码 (学生微信激活)
            </p>
            <p className="text-[12px] text-[#4B5563]">
              注：机构管理员不得越过教师直接为学生开通或生成授权码。已激活的授权码不可作废。
            </p>
          </div>

          <div className="border border-[#E5E7EB] p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-[#111827] text-[14px] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006948] text-[18px]">quiz</span>
              3. PRD 题库与难度字典规范
            </h4>
            <p>· <strong>题目难度 (唯一标准)</strong>：仅统一为 <strong>基础题、提升题、压轴题</strong> 三种。</p>
            <p>· <strong>最小考点绑定</strong>：精选题必须且只能绑定至三级知识考点。无可练题考点触发覆盖预警。</p>
          </div>
        </div>

        <div className="pt-4 mt-6 border-t border-[#E5E7EB] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#006948] text-white rounded-lg font-bold text-[14px] hover:bg-[#006948]/90 cursor-pointer shadow-xs"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
