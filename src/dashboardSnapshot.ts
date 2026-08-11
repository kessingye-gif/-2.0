import type { AuditLogItem, AuthCode, Institution, OrderLedgerRecord, StudentItem } from './types';

export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  sourceLabel: string;
  definition: string;
  targetPath: string;
  tone?: 'default' | 'positive' | 'warning';
}

export interface DashboardSection {
  id: 'institutions' | 'students' | 'learning';
  title: string;
  description: string;
  metrics: DashboardMetric[];
}

export interface DashboardWorkItem {
  id: string;
  title: string;
  description: string;
  count: number;
  targetPath: string;
  tone: 'warning' | 'danger';
}

export interface PlatformDashboardSnapshot {
  updatedAt: string;
  sections: DashboardSection[];
  workItems: DashboardWorkItem[];
}

interface DashboardInput {
  institutions: Institution[];
  authCodes: AuthCode[];
  students: StudentItem[];
  orders: OrderLedgerRecord[];
  auditLogs: AuditLogItem[];
}

const number = (value: number) => value.toLocaleString('zh-CN');

export const derivePlatformDashboardSnapshot = ({ institutions, authCodes, students, auditLogs }: DashboardInput): PlatformDashboardSnapshot => {
  const allocatedQuota = institutions.reduce((sum, item) => sum + item.totalQuota, 0);
  const remainingQuota = institutions.reduce((sum, item) => sum + item.remainingQuota, 0);
  const lowQuota = institutions.filter((item) => item.totalQuota > 0 && item.remainingQuota / item.totalQuota <= 0.2);
  const unconfigured = institutions.filter((item) => (item.availableServicePackageIds?.length ?? 0) === 0);
  const activated = authCodes.filter((item) => item.status === 'used').length;
  const pending = authCodes.filter((item) => item.status === 'pending').length;
  const activeStudents = students.filter((item) => item.serviceStatus === 'active').length;
  const studyHours = students.reduce((sum, item) => sum + item.totalStudyHours, 0);
  const questions = students.reduce((sum, item) => sum + item.totalQuestions, 0);

  const metric = (value: number, fields: Omit<DashboardMetric, 'value' | 'displayValue'> & { suffix?: string }): DashboardMetric => ({
    ...fields,
    value,
    displayValue: `${number(value)}${fields.suffix ?? ''}`,
  });

  return {
    updatedAt: auditLogs[0]?.timestamp ?? '暂无更新记录',
    sections: [
      {
        id: 'institutions', title: '机构与额度', description: '平台分配给机构的总额度与剩余情况', metrics: [
          metric(institutions.length, { id: 'institutions', label: '机构总数', suffix: ' 家', sourceLabel: '机构档案', definition: '平台已创建的全部机构', targetPath: '/platform/institutions' }),
          metric(allocatedQuota, { id: 'allocatedQuota', label: '已分配额度', suffix: ' 点', sourceLabel: '机构额度账户', definition: '各机构总额度之和', targetPath: '/platform/institutions?view=quota', tone: 'positive' }),
          metric(remainingQuota, { id: 'remainingQuota', label: '机构剩余额度', suffix: ' 点', sourceLabel: '机构额度账户', definition: '各机构当前可用额度之和', targetPath: '/platform/institutions?view=quota' }),
          metric(lowQuota.length, { id: 'lowQuota', label: '低额度机构', suffix: ' 家', sourceLabel: '机构额度账户', definition: '剩余额度不超过总额度 20%', targetPath: '/platform/institutions?quota=low', tone: 'warning' }),
        ],
      },
      {
        id: 'students', title: '学生与开通', description: '全平台学生的开通和激活结果', metrics: [
          metric(students.length, { id: 'students', label: '学生总数', suffix: ' 人', sourceLabel: '机构学生档案', definition: '所有机构学生数', targetPath: '/platform/students' }),
          metric(activated, { id: 'activated', label: '已激活', suffix: ' 人', sourceLabel: '学生权益记录', definition: '状态为已激活的权益记录', targetPath: '/platform/goods?tab=authCodes&status=used', tone: 'positive' }),
          metric(pending, { id: 'pending', label: '待激活', suffix: ' 人', sourceLabel: '学生权益记录', definition: '已创建但尚未激活的权益记录', targetPath: '/platform/goods?tab=authCodes&status=pending', tone: 'warning' }),
        ],
      },
      {
        id: 'learning', title: '学习与使用', description: '只展示学生档案中已有的学习累计数据', metrics: [
          metric(activeStudents, { id: 'activeStudents', label: '服务中学生', suffix: ' 人', sourceLabel: '学生服务档案', definition: '服务状态为正常的学生', targetPath: '/platform/students?service=active' }),
          metric(studyHours, { id: 'studyHours', label: '累计学习时长', suffix: ' 小时', sourceLabel: '学生学习档案', definition: '学生累计学习时长之和', targetPath: '/platform/students?tab=diagnostics' }),
          metric(questions, { id: 'questions', label: '累计答题', suffix: ' 题', sourceLabel: '学生学习档案', definition: '学生累计答题数之和', targetPath: '/platform/students?tab=diagnostics' }),
        ],
      },
    ],
    workItems: [
      ...(lowQuota.length ? [{ id: 'low-quota', title: '机构额度过低', description: '进入机构列表查看并追加额度', count: lowQuota.length, targetPath: '/platform/institutions?quota=low', tone: 'warning' as const }] : []),
      ...(unconfigured.length ? [{ id: 'unconfigured', title: '机构未配置服务范围', description: '进入机构详情配置内容包和服务包', count: unconfigured.length, targetPath: '/platform/institutions?scope=missing', tone: 'danger' as const }] : []),
      ...(pending ? [{ id: 'pending-activation', title: '学生待激活', description: '查看对应机构、老师、学生和权益记录', count: pending, targetPath: '/platform/goods?tab=authCodes&status=pending', tone: 'warning' as const }] : []),
    ],
  };
};
