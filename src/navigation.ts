export type NavTab =
  | 'dashboard'
  | 'customers'
  | 'content'
  | 'catalog'
  | 'fulfillment'
  | 'finance'
  | 'afterSales'
  | 'audit'
  | 'settings';

export type LegacyView = 'dashboard' | 'institutions' | 'questionBank' | 'goods' | 'exceptions' | 'settings' | 'auditLogs';

export const navGroups: {
  title?: string;
  items: { id: NavTab; label: string; icon: string; badge?: string }[];
}[] = [
  {
    items: [
      { id: 'dashboard', label: '经营驾驶舱', icon: 'space_dashboard' },
      { id: 'customers', label: '客户与合同', icon: 'handshake' },
      { id: 'content', label: '内容中心', icon: 'library_books' },
      { id: 'catalog', label: '商品与定价', icon: 'sell' },
      { id: 'fulfillment', label: '开通与履约', icon: 'verified_user' },
      { id: 'finance', label: '订单与资金', icon: 'account_balance_wallet' },
      { id: 'afterSales', label: '售后与异常', icon: 'support_agent' },
    ],
  },
  {
    title: '系统',
    items: [
      { id: 'audit', label: '数据与审计', icon: 'history' },
      { id: 'settings', label: '平台设置', icon: 'settings' },
    ],
  },
];

export const resolveLegacyView = (tab: NavTab): LegacyView => {
  const viewMap: Record<NavTab, LegacyView> = {
    dashboard: 'dashboard',
    customers: 'institutions',
    content: 'questionBank',
    catalog: 'goods',
    fulfillment: 'goods',
    finance: 'goods',
    afterSales: 'exceptions',
    audit: 'auditLogs',
    settings: 'settings',
  };

  return viewMap[tab];
};
