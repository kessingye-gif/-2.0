import type { AuditLogItem, AuthCode, Institution, OrderLedgerRecord, StudentItem, TeacherItem } from './types';

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
      ...(unconfigured.length ? [{ id: 'unconfigured', title: '机构未配置使用范围', description: '进入机构详情，分别配置内容包范围和服务包范围', count: unconfigured.length, targetPath: '/platform/institutions?scope=missing', tone: 'danger' as const }] : []),
      ...(pending ? [{ id: 'pending-activation', title: '学生待激活', description: '查看对应机构、老师、学生和权益记录', count: pending, targetPath: '/platform/goods?tab=authCodes&status=pending', tone: 'warning' as const }] : []),
    ],
  };
};

export const deriveInstitutionDashboardSnapshot = ({
  institutionId,
  institutions,
  teachers,
  students,
  auditLogs,
}: {
  institutionId: string;
  institutions: Institution[];
  teachers: TeacherItem[];
  students: StudentItem[];
  auditLogs: AuditLogItem[];
}): PlatformDashboardSnapshot => {
  const institution = institutions.find((item) => item.id === institutionId);
  const scopedTeachers = teachers.filter((item) => item.institutionId === institutionId);
  const scopedStudents = students.filter((item) => item.institutionId === institutionId);
  const activeTeachers = scopedTeachers.filter((item) => item.status === 'active');
  const activeStudents = scopedStudents.filter((item) => item.serviceStatus === 'active');
  const pendingStudents = scopedStudents.filter((item) => item.serviceStatus === 'none');
  const allocatedTeacherQuota = scopedTeachers.reduce((sum, item) => sum + item.allocatedQuota, 0);
  const remainingTeacherQuota = scopedTeachers.reduce((sum, item) => sum + item.remainingQuota, 0);
  const studyHours = scopedStudents.reduce((sum, item) => sum + item.totalStudyHours, 0);
  const questions = scopedStudents.reduce((sum, item) => sum + item.totalQuestions, 0);
  const metric = (value: number, fields: Omit<DashboardMetric, 'value' | 'displayValue'> & { suffix?: string }): DashboardMetric => ({ ...fields, value, displayValue: `${number(value)}${fields.suffix ?? ''}` });

  return {
    updatedAt: auditLogs[0]?.timestamp ?? '暂无更新记录',
    sections: [
      { id: 'institutions', title: '老师与额度', description: `${institution?.name ?? '当前机构'}的老师账户及额度使用`, metrics: [
        metric(scopedTeachers.length, { id: 'teachers', label: '老师总数', suffix: ' 人', sourceLabel: '老师档案', definition: '当前机构全部老师', targetPath: '/platform/teachers' }),
        metric(activeTeachers.length, { id: 'activeTeachers', label: '在职老师', suffix: ' 人', sourceLabel: '老师档案', definition: '状态为正常的老师', targetPath: '/platform/teachers?status=active', tone: 'positive' }),
        metric(allocatedTeacherQuota, { id: 'allocatedTeacherQuota', label: '已分配额度', suffix: ' 点', sourceLabel: '老师额度账户', definition: '机构已分配给老师的额度', targetPath: '/platform/teachers?view=quota' }),
        metric(remainingTeacherQuota, { id: 'remainingTeacherQuota', label: '老师剩余额度', suffix: ' 点', sourceLabel: '老师额度账户', definition: '老师当前可用额度之和', targetPath: '/platform/teachers?view=quota' }),
      ]},
      { id: 'students', title: '学生与服务', description: '当前机构学生归属与服务状态', metrics: [
        metric(scopedStudents.length, { id: 'students', label: '学生总数', suffix: ' 人', sourceLabel: '学生档案', definition: '当前机构全部学生', targetPath: '/platform/students' }),
        metric(activeStudents.length, { id: 'activeStudents', label: '服务中学生', suffix: ' 人', sourceLabel: '学生服务档案', definition: '服务状态正常的学生', targetPath: '/platform/students?service=active', tone: 'positive' }),
        metric(pendingStudents.length, { id: 'pendingStudents', label: '待办理学生', suffix: ' 人', sourceLabel: '学生服务档案', definition: '尚未完成服务办理的学生', targetPath: '/platform/students?service=pending', tone: 'warning' }),
      ]},
      { id: 'learning', title: '学习情况', description: '当前机构学生累计学习数据', metrics: [
        metric(studyHours, { id: 'studyHours', label: '累计学习时长', suffix: ' 小时', sourceLabel: '学生学习档案', definition: '当前机构学生学习时长总和', targetPath: '/platform/students?tab=diagnostics' }),
        metric(questions, { id: 'questions', label: '累计答题', suffix: ' 题', sourceLabel: '学生学习档案', definition: '当前机构学生累计答题数', targetPath: '/platform/students?tab=diagnostics' }),
      ]},
    ],
    workItems: pendingStudents.length ? [{ id: 'pending-students', title: '学生待办理服务', description: '由负责老师进入班级处理', count: pendingStudents.length, targetPath: '/platform/classes', tone: 'warning' }] : [],
  };
};

export const deriveTeacherDashboardSnapshot = ({ teacherId, teachers, students, auditLogs }: {
  teacherId: string;
  teachers: TeacherItem[];
  students: StudentItem[];
  auditLogs: AuditLogItem[];
}): PlatformDashboardSnapshot => {
  const teacher = teachers.find((item) => item.id === teacherId);
  const ownStudents = students.filter((item) => item.teacherId === teacherId);
  const activeStudents = ownStudents.filter((item) => item.serviceStatus === 'active');
  const pendingStudents = ownStudents.filter((item) => item.serviceStatus === 'none');
  const studyHours = ownStudents.reduce((sum, item) => sum + item.totalStudyHours, 0);
  const questions = ownStudents.reduce((sum, item) => sum + item.totalQuestions, 0);
  const errors = ownStudents.reduce((sum, item) => sum + item.errorCount, 0);
  const unreviewed = ownStudents.reduce((sum, item) => sum + item.unreviewedErrorCount, 0);
  const averageAccuracy = ownStudents.length ? Math.round(ownStudents.reduce((sum, item) => sum + item.accuracyRate, 0) / ownStudents.length) : 0;
  const metric = (value: number, fields: Omit<DashboardMetric, 'value' | 'displayValue'> & { suffix?: string }): DashboardMetric => ({ ...fields, value, displayValue: `${number(value)}${fields.suffix ?? ''}` });

  return {
    updatedAt: auditLogs[0]?.timestamp ?? '暂无更新记录',
    sections: [
      { id: 'institutions', title: '我的班级与学生', description: `${teacher?.name ?? '当前教师'}负责范围内的学生与服务状态`, metrics: [
        metric(ownStudents.length, { id: 'students', label: '负责学生', suffix: ' 人', sourceLabel: '班级花名册', definition: '当前老师负责的全部学生', targetPath: '/platform/students' }),
        metric(activeStudents.length, { id: 'activeStudents', label: '服务中学生', suffix: ' 人', sourceLabel: '学生服务档案', definition: '服务状态正常的学生', targetPath: '/platform/students?service=active', tone: 'positive' }),
        metric(pendingStudents.length, { id: 'pendingStudents', label: '待办理学生', suffix: ' 人', sourceLabel: '学生服务档案', definition: '尚未办理服务的学生', targetPath: '/platform/classes', tone: 'warning' }),
        metric(teacher?.remainingQuota ?? 0, { id: 'teacherQuota', label: '我的可用额度', suffix: ' 点', sourceLabel: '老师额度账户', definition: '机构管理员分配后的当前可用额度', targetPath: '/platform/classes' }),
      ]},
      { id: 'students', title: '学生学情', description: '负责学生的学习与答题汇总', metrics: [
        metric(studyHours, { id: 'studyHours', label: '累计学习时长', suffix: ' 小时', sourceLabel: '学生学习档案', definition: '负责学生累计学习时长', targetPath: '/platform/students?tab=diagnostics' }),
        metric(questions, { id: 'questions', label: '累计答题', suffix: ' 题', sourceLabel: '学生学习档案', definition: '负责学生累计答题数', targetPath: '/platform/students?tab=diagnostics' }),
        metric(averageAccuracy, { id: 'accuracy', label: '平均正确率', suffix: '%', sourceLabel: '学生学习档案', definition: '负责学生平均答题正确率', targetPath: '/platform/students?tab=diagnostics' }),
      ]},
      { id: 'learning', title: '错题与复习', description: '需要老师关注的学习问题', metrics: [
        metric(errors, { id: 'errors', label: '累计错题', suffix: ' 题', sourceLabel: '学生错题档案', definition: '负责学生累计错题数', targetPath: '/platform/students?tab=diagnostics' }),
        metric(unreviewed, { id: 'unreviewed', label: '待复习错题', suffix: ' 题', sourceLabel: '学生错题档案', definition: '尚未完成复习的错题', targetPath: '/platform/students?tab=diagnostics', tone: 'warning' }),
      ]},
    ],
    workItems: [
      ...(pendingStudents.length ? [{ id: 'pending-students', title: '学生待办理服务', description: '进入班级为学生办理服务', count: pendingStudents.length, targetPath: '/platform/classes', tone: 'warning' as const }] : []),
      ...(unreviewed ? [{ id: 'unreviewed-errors', title: '学生错题待复习', description: '进入学生学情查看需关注学生', count: unreviewed, targetPath: '/platform/students?tab=diagnostics', tone: 'danger' as const }] : []),
    ],
  };
};
