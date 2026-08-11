import { Link } from 'react-router-dom';
import type { DashboardMetric } from '../../dashboardSnapshot';

export const MetricLink: React.FC<{ metric: DashboardMetric }> = ({ metric }) => (
  <Link to={metric.targetPath} className="block rounded-xl border border-[#E2E8F0] bg-white p-4 transition-colors hover:border-[#9AD8B5] hover:bg-[#FAFDFB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16B45B]">
    <p className="text-[12px] font-medium text-[#64748B]">{metric.label}</p>
    <p className={`mt-2 text-[22px] font-bold tabular-nums ${metric.tone === 'warning' ? 'text-[#B45309]' : metric.tone === 'positive' ? 'text-[#0E7D3E]' : 'text-[#0F172A]'}`}>{metric.displayValue}</p>
    <p className="mt-3 text-[10px] text-[#94A3B8]">数据来源：{metric.sourceLabel}</p>
    <p className="mt-1 text-[10px] leading-4 text-[#64748B]">{metric.definition}</p>
    <p className="mt-3 text-[11px] font-semibold text-[#0E7D3E]">查看明细 →</p>
  </Link>
);
import React from 'react';
