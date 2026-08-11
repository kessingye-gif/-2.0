import React from 'react';
import type { FulfillmentEvent } from '../../types';

export const FulfillmentTimeline: React.FC<{ events: FulfillmentEvent[] }> = ({ events }) => (
  <div className="divide-y divide-[#EEF2F0]">
    {events.map((event) => (
      <div key={event.id} className="flex gap-3 px-5 py-3.5">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${event.status === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#16B45B]'}`} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="truncate text-[12.5px] font-semibold text-[#0F172A]">{event.title}</span>
            <span className="shrink-0 text-[10px] tabular-nums text-[#94A3B8]">{event.timestamp.slice(5, 16)}</span>
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-[#64748B]">{event.description}</span>
        </span>
      </div>
    ))}
  </div>
);
