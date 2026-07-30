import React from 'react';

export type NavTab = 
  | 'dashboard' 
  | 'institutions' 
  | 'packages' 
  | 'quota' 
  | 'questionBank' 
  | 'diagnostics' 
  | 'guardianship' 
  | 'auditLogs';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems: { id: NavTab; label: string; icon: string; badge?: string }[] = [
    { id: 'dashboard', label: '工作台概览', icon: 'dashboard' },
    { id: 'institutions', label: '机构管理', icon: 'domain' },
    { id: 'packages', label: '服务包配置', icon: 'package_2' },
    { id: 'quota', label: '额度与授权码', icon: 'confirmation_number' },
    { id: 'questionBank', label: '精选题库', icon: 'quiz' },
    { id: 'diagnostics', label: '学习诊断', icon: 'analytics' },
    { id: 'guardianship', label: '家校监管', icon: 'supervisor_account' },
    { id: 'auditLogs', label: '审计日志', icon: 'receipt_long' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-[#E2E8F0] flex flex-col py-5 z-50 shadow-xs select-none">
      {/* Brand Header */}
      <div className="px-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-[#16B45B] to-[#0E7D3E] flex items-center justify-center shadow-xs shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18H15M10 21H14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 2C8.13401 2 5 5.13401 5 9C5 12.38 7.2 15.15 10 16.05V17H14V16.05C16.8 15.15 19 12.38 19 9C19 5.13401 15.866 2 12 2Z" stroke="white" strokeWidth="2" fill="#16B45B" fillOpacity="0.4"/>
              <circle cx="12" cy="7" r="2" fill="#F5B700"/>
            </svg>
          </div>

          <div>
            <h1 className="text-[16px] font-extrabold text-[#0F172A] leading-tight tracking-tight">
              开窍 AI 学伴
            </h1>
            <p className="text-[10px] font-bold text-[#16B45B] tracking-wider uppercase mt-0.5">
              超级管理员后台
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-150 text-[13px] font-medium text-left cursor-pointer group ${
                isActive
                  ? 'bg-[#E8F7EE] text-[#16B45B] font-bold'
                  : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#16B45B]'
              }`}
            >
              <span className={`material-symbols-outlined text-[19px] transition-colors ${
                isActive ? 'text-[#16B45B]' : 'text-[#64748B] group-hover:text-[#16B45B]'
              }`}>
                {item.icon}
              </span>
              
              <span className="flex-1 truncate">{item.label}</span>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#16B45B]"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="px-3 pt-3 border-t border-[#E2E8F0] mt-auto">
        <div className="bg-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E2E8F0] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
            <span className="w-2 h-2 rounded-full bg-[#16B45B] animate-pulse"></span>
            <span>系统运行正常</span>
          </div>
          <span className="font-mono text-[10px] text-[#64748B] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">
            v2.4.0
          </span>
        </div>
      </div>
    </aside>
  );
};
