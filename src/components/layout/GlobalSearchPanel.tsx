import React from 'react';
import type { NavTab } from '../../navigation';
import type { GlobalSearchResult } from '../../types';

interface GlobalSearchPanelProps {
  query: string;
  results: GlobalSearchResult[];
  onSelect: (tab: NavTab) => void;
}

const typeLabels: Record<GlobalSearchResult['type'], string> = {
  institution: '机构',
  student: '学生',
  authCode: '开通码',
  order: '订单',
};

export const GlobalSearchPanel: React.FC<GlobalSearchPanelProps> = ({ query, results, onSelect }) => {
  if (!query.trim()) return null;

  return (
    <div className="absolute left-0 top-[42px] z-50 w-full overflow-hidden rounded-xl border border-[#DCE4DF] bg-white shadow-[0_18px_42px_rgba(15,23,42,0.14)]">
      <div className="border-b border-[#EEF2F0] px-4 py-2.5 text-[11px] font-semibold text-[#64748B]">
        全局业务搜索
      </div>
      {results.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12px] text-[#94A3B8]">未找到相关机构、学生、开通码或订单</div>
      ) : (
        <div className="max-h-[360px] overflow-y-auto py-1.5">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              onClick={() => onSelect(result.targetTab)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#F5FAF7]"
            >
              <span className="rounded-md bg-[#EAF7EF] px-2 py-1 text-[10px] font-semibold text-[#0E7D3E]">{typeLabels[result.type]}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-[#0F172A]">{result.title}</span>
                <span className="mt-0.5 block truncate text-[11px] text-[#94A3B8]">{result.subtitle}</span>
              </span>
              <span className="material-symbols-outlined text-[17px] text-[#CBD5E1]">arrow_forward</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
