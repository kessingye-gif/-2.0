import type { DashboardSection as DashboardSectionModel } from '../../dashboardSnapshot';
import { MetricLink } from './MetricLink';

export const DashboardSection: React.FC<{ section: DashboardSectionModel }> = ({ section }) => (
  <section>
    <div className="mb-3"><h3 className="text-[15px] font-bold text-[#0F172A]">{section.title}</h3><p className="mt-1 text-[11px] text-[#64748B]">{section.description}</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{section.metrics.map((metric) => <MetricLink key={metric.id} metric={metric} />)}</div>
  </section>
);
import React from 'react';
