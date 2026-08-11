import React from 'react';
import { NavLink } from 'react-router-dom';
import { navGroups } from '../../navigation';

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-[#E2E8F0] flex flex-col py-5 z-50 select-none">
      {/* Brand Header */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#16B45B] to-[#0E7D3E] flex items-center justify-center shadow-xs shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18H15M10 21H14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 2C8.13401 2 5 5.13401 5 9C5 12.38 7.2 15.15 10 16.05V17H14V16.05C16.8 15.15 19 12.38 19 9C19 5.13401 15.866 2 12 2Z" stroke="white" strokeWidth="2" fill="#16B45B" fillOpacity="0.4"/>
              <circle cx="12" cy="7" r="2" fill="#F5B700"/>
            </svg>
          </div>

          <div>
            <h1 className="text-[15px] font-extrabold text-[#0F172A] leading-tight tracking-tight">
              开窍 AI 学伴
            </h1>
            <p className="text-[10px] font-bold text-[#16B45B] tracking-wider uppercase mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16B45B]"></span>
              超级管理员后台
            </p>
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 space-y-6 px-3 overflow-y-auto custom-scrollbar">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {group.title && <div className="px-3 text-[11px] font-medium text-[#94A3B8] mb-2">{group.title}</div>}
            {group.items.map((item) => {
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-[14px] font-medium text-left cursor-pointer group ${
                    isActive
                      ? 'bg-[#EAF7EF] text-[#0E7D3E] font-semibold'
                      : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[19px] text-[#64748B] transition-colors group-hover:text-[#16B45B]">
                    {item.icon}
                  </span>
                  
                  <span className="flex-1 truncate">{item.label}</span>

                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-5 pt-4 border-t border-[#E2E8F0] text-[11px] text-[#94A3B8]">平台总部运营</div>
    </aside>
  );
};
