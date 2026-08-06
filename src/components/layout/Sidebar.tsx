import React from 'react';

export type NavTab = 
  | 'dashboard' 
  | 'goods'
  | 'questionBank' 
  | 'institutions' 
  | 'teacherClass'
  | 'students' 
  | 'system'
  | 'auditLogs';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navGroups: {
    title: string;
    items: { id: NavTab; label: string; icon: string; badge?: string }[];
  }[] = [
    {
      title: '工作台',
      items: [
        { id: 'dashboard', label: '工作台概览', icon: 'dashboard' },
      ],
    },
    {
      title: '机构与教务',
      items: [
        { id: 'institutions', label: '机构管理', icon: 'domain', badge: '138' },
        { id: 'teacherClass', label: '教师与班级', icon: 'groups' },
        { id: 'students', label: '学生与诊断', icon: 'analytics' },
      ],
    },
    {
      title: '资源与权益',
      items: [
        { id: 'questionBank', label: '内容管理', icon: 'menu_book' },
        { id: 'goods', label: '商品与权益', icon: 'package_2' },
      ],
    },
    {
      title: '系统与审计',
      items: [
        { id: 'system', label: '系统管理', icon: 'settings' },
        { id: 'auditLogs', label: '操作日志', icon: 'receipt_long' },
      ],
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-[#E2E8F0] flex flex-col py-4 z-50 shadow-xs select-none">
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
      <nav className="flex-1 space-y-4 px-3 overflow-y-auto custom-scrollbar">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="px-3 text-[10.5px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
              {group.title}
            </div>
            {group.items.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-[13px] font-medium text-left cursor-pointer group ${
                    isActive
                      ? 'bg-[#E8F7EE] text-[#16B45B] font-bold shadow-2xs'
                      : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#16B45B]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] transition-colors ${
                    isActive ? 'text-[#16B45B]' : 'text-[#64748B] group-hover:text-[#16B45B]'
                  }`}>
                    {item.icon}
                  </span>
                  
                  <span className="flex-1 truncate">{item.label}</span>

                  {item.badge && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-[#16B45B] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {isActive && !item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16B45B]"></span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
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

