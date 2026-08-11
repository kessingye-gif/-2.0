import React from 'react';
import type { NavTab } from '../../navigation';
import type { FulfillmentFunnelStep } from '../../types';

interface FulfillmentFunnelProps {
  steps: FulfillmentFunnelStep[];
  onNavigate: (tab: NavTab) => void;
}

export const FulfillmentFunnel: React.FC<FulfillmentFunnelProps> = ({ steps, onNavigate }) => (
  <div className="grid grid-cols-1 gap-2 lg:grid-cols-7">
    {steps.map((step, index) => (
      <React.Fragment key={step.id}>
        <button
          type="button"
          onClick={() => onNavigate(step.targetTab)}
          className="group relative min-w-0 rounded-xl border border-[#DDE7E1] bg-white px-3 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#16B45B] hover:shadow-md"
        >
          <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF7EF] text-[11px] font-bold text-[#0E7D3E]">{index + 1}</span>
          <span className="block text-[12px] font-semibold text-[#475569]">{step.label}</span>
          <span className="mt-1.5 block text-[20px] font-bold tabular-nums text-[#0F172A]">{step.displayValue}</span>
          <span className="mt-2 flex items-center gap-1 text-[10px] text-[#94A3B8]">
            {step.conversionRate !== undefined ? `上一环节转化 ${step.conversionRate}%` : '点击查看明细'}
          </span>
        </button>
      </React.Fragment>
    ))}
  </div>
);
