export type NavTab =
  | 'dashboard'
  | 'institutions'
  | 'content'
  | 'supervision'
  | 'exceptions'
  | 'settings'
  | 'audit';

export type LegacyView = 'dashboard' | 'institutions' | 'questionBank' | 'goods' | 'exceptions' | 'settings' | 'auditLogs';

export const navGroups: {
  title?: string;
  items: { id: NavTab; label: string; icon: string; badge?: string }[];
}[] = [
  {
    items: [
      { id: 'dashboard', label: '运营工作台', icon: 'space_dashboard' },
      { id: 'institutions', label: '机构运营', icon: 'domain' },
      { id: 'content', label: '内容中心', icon: 'library_books' },
      { id: 'supervision', label: '开通监管', icon: 'verified_user' },
      { id: 'exceptions', label: '异常处理', icon: 'error' },
    ],
  },
  {
    title: '系统',
    items: [
      { id: 'settings', label: '平台设置', icon: 'settings' },
      { id: 'audit', label: '操作审计', icon: 'history' },
    ],
  },
];

export const resolveLegacyView = (tab: NavTab): LegacyView => {
  const viewMap: Record<NavTab, LegacyView> = {
    dashboard: 'dashboard',
    institutions: 'institutions',
    content: 'questionBank',
    supervision: 'goods',
    exceptions: 'exceptions',
    settings: 'settings',
    audit: 'auditLogs',
  };

  return viewMap[tab];
};
