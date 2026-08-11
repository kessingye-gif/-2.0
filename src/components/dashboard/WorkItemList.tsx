import React from 'react';
import type { NavTab } from '../../navigation';
import type { FulfillmentWorkItem } from '../../types';

interface WorkItemListProps {
  items: FulfillmentWorkItem[];
  onNavigate: (tab: NavTab) => void;
}

const severityStyles = {
  high: 'bg-[#FEF2F2] text-[#DC2626]',
  medium: 'bg-[#FFF7ED] text-[#B45309]',
  low: 'bg-[#F1F5F9] text-[#64748B]',
};

export const WorkItemList: React.FC<WorkItemListProps> = ({ items, onNavigate }) => (
  <div className="divide-y divide-[#EEF2F0]">
    {items.length === 0 ? (
      <div className="px-5 py-10 text-center text-[12px] text-[#94A3B8]">今日没有待处理履约事项</div>
    ) : items.map((item) => (
      <button key={item.id} type="button" onClick={() => onNavigate(item.targetTab)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-[#F8FAF9]">
        <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${severityStyles[item.severity]}`}>
          {item.severity === 'high' ? '紧急' : item.severity === 'medium' ? '待跟进' : '提醒'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold text-[#0F172A]">{item.title} · {item.institutionName}</span>
          <span className="mt-0.5 block truncate text-[11px] text-[#94A3B8]">{item.description}</span>
        </span>
        <span className="text-[11px] font-medium text-[#0E7D3E]">去处理</span>
      </button>
    ))}
  </div>
);
