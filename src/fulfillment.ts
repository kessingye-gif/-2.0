import type {
  AuditLogItem,
  AuthCode,
  FulfillmentEvent,
  FulfillmentFunnelStep,
  FulfillmentMetric,
  FulfillmentSnapshot,
  FulfillmentWorkItem,
  GlobalSearchResult,
  Institution,
  OrderLedgerRecord,
  StudentItem,
} from './types';

interface FulfillmentData {
  institutions: Institution[];
  authCodes: AuthCode[];
  students: StudentItem[];
  orders: OrderLedgerRecord[];
  auditLogs: AuditLogItem[];
}

type SearchData = Pick<FulfillmentData, 'institutions' | 'authCodes' | 'students' | 'orders'>;

const formatCurrency = (value: number) => `¥${value.toLocaleString('zh-CN')}`;

const rate = (value: number, base: number) => (base > 0 ? Math.round((value / base) * 1000) / 10 : 0);

export const deriveFulfillmentSnapshot = ({
  institutions,
  authCodes,
  students,
  orders,
  auditLogs,
}: FulfillmentData): FulfillmentSnapshot => {
  const contracted = institutions.filter((item) => item.contractStatus === 'active' || item.contractStatus === 'expiring').length;
  const fundedOrders = orders.filter((item) => item.type === 'credit_inflow' && item.status === 'completed');
  const configured = institutions.filter((item) =>
    (item.contractStatus === 'active' || item.contractStatus === 'expiring')
    && (item.availableServicePackageIds?.length ?? 0) > 0
  ).length;
  const issued = authCodes.length;
  const activated = authCodes.filter((item) => item.status === 'used').length;
  const servicing = students.filter((item) => item.serviceStatus === 'active').length;
  const renewalOrders = orders.filter((item) => item.type === 'ai_usage_pack_buy' || item.type === 'refund');
  const contractAmount = institutions.reduce((sum, item) => sum + (item.contractAmount ?? 0), 0);
  const fundedAmount = fundedOrders.reduce((sum, item) => sum + Math.max(item.paymentAmount, 0), 0);
  const revenue = orders
    .filter((item) => item.status === 'completed' && item.type !== 'credit_inflow')
    .reduce((sum, item) => sum + Math.max(item.paymentAmount, 0), 0);
  const refundAmount = Math.abs(orders
    .filter((item) => item.type === 'refund')
    .reduce((sum, item) => sum + item.paymentAmount, 0));

  const metrics: FulfillmentMetric[] = [
    { id: 'contractAmount', label: '本期签约额', value: contractAmount, displayValue: formatCurrency(contractAmount) },
    { id: 'fundedAmount', label: '额度已到账', value: fundedAmount, displayValue: formatCurrency(fundedAmount), tone: 'positive' },
    { id: 'activatedStudents', label: '已激活学生', value: activated, displayValue: `${activated.toLocaleString('zh-CN')} 人` },
    { id: 'revenue', label: '履约收入', value: revenue, displayValue: formatCurrency(revenue), tone: 'positive' },
    { id: 'refundAmount', label: '退款金额', value: refundAmount, displayValue: formatCurrency(refundAmount), tone: 'warning' },
  ];

  const funnel: FulfillmentFunnelStep[] = [
    { id: 'contracted', label: '机构签约', value: contracted, displayValue: `${contracted} 家`, targetTab: 'institutions' },
    { id: 'funded', label: '额度到账', value: fundedOrders.length, displayValue: `${fundedOrders.length} 笔`, conversionRate: rate(fundedOrders.length, contracted), targetTab: 'goods' },
    { id: 'configured', label: '服务配置', value: configured, displayValue: `${configured} 家`, conversionRate: rate(configured, contracted), targetTab: 'institutions' },
    { id: 'issued', label: '开通码生成', value: issued, displayValue: `${issued} 个`, targetTab: 'goods' },
    { id: 'activated', label: '学生激活', value: activated, displayValue: `${activated} 人`, conversionRate: rate(activated, issued), targetTab: 'students' },
    { id: 'servicing', label: '服务履约', value: servicing, displayValue: `${servicing} 人`, conversionRate: rate(servicing, activated), targetTab: 'students' },
    { id: 'renewal', label: '续费 / 退款', value: renewalOrders.length, displayValue: `${renewalOrders.length} 笔`, targetTab: 'goods' },
  ];

  const lowCreditItems: FulfillmentWorkItem[] = institutions
    .filter((item) => item.totalQuota > 0 && item.remainingQuota / item.totalQuota <= 0.12)
    .map((item) => ({
      id: `low-credit-${item.id}`,
      type: 'low_credit',
      title: '机构额度不足',
      description: `剩余 ${item.remainingQuota.toLocaleString('zh-CN')} 点，需跟进续费或补充额度`,
      institutionName: item.name,
      severity: item.remainingQuota === 0 ? 'high' : 'medium',
      targetTab: 'system',
    }));

  const expiringCodeItems: FulfillmentWorkItem[] = authCodes
    .filter((item) => item.status === 'pending')
    .map((item) => ({
      id: `code-expiring-${item.id}`,
      type: 'code_expiring',
      title: '开通码待激活',
      description: `${item.studentName ?? '未绑定学生'}的 ${item.packageName} 将于 ${item.expireAt} 到期`,
      institutionName: item.institutionName,
      severity: 'medium',
      targetTab: 'goods',
    }));

  const workItems = [...lowCreditItems, ...expiringCodeItems].slice(0, 6);
  const recentEvents: FulfillmentEvent[] = auditLogs.slice(0, 6).map((log) => ({
    id: log.id,
    title: log.action,
    description: log.target,
    timestamp: log.timestamp,
    status: log.action.includes('作废') || log.action.includes('退款') ? 'warning' : 'success',
  }));

  const exceptionInstitutionCount = institutions.filter((item) => item.status === 'inactive' || item.remainingQuota === 0).length;
  const warningInstitutionCount = institutions.filter((item) => item.status === 'active' && item.totalQuota > 0 && item.remainingQuota / item.totalQuota <= 0.2).length;

  return {
    metrics,
    funnel,
    workItems,
    recentEvents,
    healthyInstitutionCount: Math.max(0, institutions.length - warningInstitutionCount - exceptionInstitutionCount),
    warningInstitutionCount,
    exceptionInstitutionCount,
  };
};

export const buildGlobalSearchResults = (query: string, data: SearchData): GlobalSearchResult[] => {
  const needle = query.trim().toLocaleLowerCase('zh-CN');
  if (!needle) return [];

  const includes = (...values: Array<string | undefined>) => values.some((value) => value?.toLocaleLowerCase('zh-CN').includes(needle));
  const results: GlobalSearchResult[] = [];

  data.institutions.forEach((item) => {
    if (includes(item.name, item.code, item.contactPerson, item.adminAccount)) {
      results.push({ id: item.id, type: 'institution', title: item.name, subtitle: `${item.code} · ${item.contactPerson}`, targetTab: 'institutions' });
    }
  });
  data.students.forEach((item) => {
    if (includes(item.name, item.nickname, item.account, item.institutionName)) {
      results.push({ id: item.id, type: 'student', title: item.name, subtitle: `${item.institutionName} · ${item.account}`, targetTab: 'students' });
    }
  });
  data.authCodes.forEach((item) => {
    if (includes(item.code, item.institutionName, item.studentName, item.teacherName)) {
      results.push({ id: item.id, type: 'authCode', title: item.code, subtitle: `${item.institutionName} · ${item.studentName ?? '未绑定学生'}`, targetTab: 'goods' });
    }
  });
  data.orders.forEach((item) => {
    if (includes(item.orderNo, item.institutionName, item.operatorName)) {
      results.push({ id: item.id, type: 'order', title: item.orderNo, subtitle: `${item.institutionName} · ${item.typeName}`, targetTab: 'goods' });
    }
  });

  return results.slice(0, 8);
};
