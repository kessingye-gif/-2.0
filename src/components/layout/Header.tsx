import React, { useState, useRef, useEffect } from 'react';
import { CurrentUser } from '../../types';
import type { GlobalSearchResult } from '../../types';
import type { NavTab } from '../../navigation';
import { GlobalSearchPanel } from './GlobalSearchPanel';
import type { Role } from '../../permissions/accessControl';

interface HeaderProps {
  currentUser: CurrentUser;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLogout: () => void;
  notificationAlerts?: HeaderNotificationAlert[];
  onSelectNotification?: (tab: NavTab, alertId: string) => void;
  onOpenSettings?: () => void;
  searchResults?: GlobalSearchResult[];
  onSelectSearchResult?: (tab: NavTab) => void;
  activeRole: Role;
  onRoleChange: (role: Role) => void;
}

export interface HeaderNotificationAlert {
  id: string;
  type: 'low_quota' | 'expiring' | 'student_transfer' | 'student_transfer_out';
  title: string;
  detail: string;
  targetTab: NavTab;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  onLogout,
  notificationAlerts = [],
  onSelectNotification,
  onOpenSettings,
  searchResults = [],
  onSelectSearchResult,
  activeRole,
  onRoleChange,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const hasBusinessNotification = notificationAlerts.some((alert) => alert.type === 'student_transfer' || alert.type === 'student_transfer_out');
  const hasWarningNotification = notificationAlerts.some((alert) => alert.type === 'low_quota' || alert.type === 'expiring');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 shrink-0 z-30 flex justify-between items-center px-6 w-full bg-white border-b border-[#E2E8F0] shadow-2xs">
      {/* Search Bar */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg py-1.5 pl-9 pr-3 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#16B45B] focus:ring-2 focus:ring-[#16B45B]/15 transition-all outline-none"
            placeholder="搜索机构、学生、开通码或订单"
          />
          {onSelectSearchResult && (
            <GlobalSearchPanel query={searchQuery} results={searchResults} onSelect={onSelectSearchResult} />
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <label className="relative hidden sm:block">
          <span className="sr-only">切换管理身份</span>
          <select value={activeRole} onChange={(event) => onRoleChange(event.target.value as Role)} className="appearance-none rounded-xl border border-[#DCE5E1] bg-white py-2 pl-3 pr-9 text-[12px] font-bold text-[#334155] outline-none hover:border-[#16B45B] focus:border-[#16B45B]">
            <option value="super_admin">平台超级管理员</option>
            <option value="institution_admin">机构管理员</option>
            <option value="teacher">教师</option>
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[17px] text-[#64748B]">expand_more</span>
        </label>
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setIsNotificationOpen((open) => !open)}
            aria-label={`通知${notificationAlerts.length ? `，${notificationAlerts.length} 条未读` : ''}`}
            aria-expanded={isNotificationOpen}
            className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] transition-all hover:bg-[#E8F7EE] hover:text-[#16B45B]"
            title="通知"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            {notificationAlerts.length > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#F5B700] px-1 text-[9px] font-bold leading-4 text-white">{notificationAlerts.length > 9 ? '9+' : notificationAlerts.length}</span>}
          </button>

          {isNotificationOpen && <section className="absolute right-0 top-11 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xl" aria-label="通知列表">
            <header className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
              <div><h3 className="text-[14px] font-bold text-[#0F172A]">{hasBusinessNotification && hasWarningNotification ? '通知与预警' : hasBusinessNotification ? '业务通知' : '待处理预警'}</h3><p className="mt-0.5 text-[10.5px] text-[#64748B]">{hasBusinessNotification ? '学生归属变更会同步通知相关教师' : '额度低于 15% / 30 天内到期'}</p></div>
              <span className="rounded-full bg-[#FFF4D6] px-2 py-1 text-[10px] font-bold text-[#B86608]">{notificationAlerts.length} 条</span>
            </header>
            <div className="max-h-[420px] overflow-y-auto p-2 custom-scrollbar">
              {notificationAlerts.length ? notificationAlerts.map((alert) => <button key={alert.id} type="button" onClick={() => { setIsNotificationOpen(false); onSelectNotification?.(alert.targetTab, alert.id); }} className="flex w-full gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#F8FAFC]">
                <span className={`material-symbols-outlined mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[18px] ${alert.type === 'low_quota' ? 'bg-[#FEF2F2] text-[#DC2626]' : alert.type === 'expiring' ? 'bg-[#FFF7E6] text-[#C46A05]' : 'bg-[#E8F7EE] text-[#0E7D3E]'}`}>{alert.type === 'low_quota' ? 'warning' : alert.type === 'expiring' ? 'event_upcoming' : alert.type === 'student_transfer' ? 'person_add' : 'person_remove'}</span>
                <span className="min-w-0"><strong className="block truncate text-[12.5px] text-[#0F172A]">{alert.title}</strong><span className="mt-1 block text-[11px] leading-4 text-[#64748B]">{alert.detail}</span></span>
              </button>) : <div className="px-4 py-8 text-center"><span className="material-symbols-outlined text-[28px] text-[#16B45B]">task_alt</span><p className="mt-2 text-[12px] font-bold text-[#334155]">当前没有待处理预警</p></div>}
            </div>
          </section>}
        </div>

        <div className="h-4 w-[1px] bg-[#E2E8F0]"></div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all cursor-pointer"
          >
            <div className="text-right hidden md:block">
              <p className="text-[12px] font-bold text-[#0F172A] leading-tight truncate max-w-[120px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-[#64748B] leading-none mt-0.5 truncate max-w-[120px]">
                {currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.institutionName}
              </p>
            </div>
            <img
              className="w-7 h-7 rounded-full border border-[#16B45B] object-cover"
              src={currentUser.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDwlJFf3rqYCHQdGUbnzIm6htn5M-2U5UiKb459aOQBJZvMuZadgZxKxWGD5YbBBg6370sr5V74N-b2qzfAeSrnCP22zzyr2NEz3RrTPirjEeoWwklqs6s4SkmZPOvC-cY_mtwVSC5EEC7qACcVVDAKRIBJDJIgARRv_ri26MDjLr-j3vbdqOd3kx0JaWD-qvv-sec8CoFp4G4E--g3DlodqLGt-PcEwzv9dbFgGrFVC-mMipoUSUs17A"}
              alt={currentUser.name}
            />
            <span className="material-symbols-outlined text-[16px] text-[#64748B]">
              expand_more
            </span>
          </button>

          {/* User Menu Popover */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] mb-2">
                <div className="flex items-center gap-2.5 mb-2">
                  <img
                    className="w-9 h-9 rounded-full border border-[#16B45B] object-cover"
                    src={currentUser.avatar}
                    alt={currentUser.name}
                  />
                  <div className="overflow-hidden">
                    <p className="text-[13px] font-bold text-[#0F172A] truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-[#64748B] font-mono truncate">@{currentUser.username}</p>
                  </div>
                </div>
                <div className="text-[11px] font-bold px-2 py-1 bg-[#E8F7EE] text-[#0E7D3E] rounded-lg inline-block">
                  {currentUser.role === 'super_admin' ? '🛡️ 系统超级管理员' : `🏫 ${currentUser.institutionName}`}
                </div>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-bold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    logout
                  </span>
                  <span>退出登录 / 切换账号</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
