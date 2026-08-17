import type { AuditLogItem, AuthCode, ContentPackageItem, Institution, KnowledgePointNode, OrderLedgerRecord, QuestionItem, ServicePackage, StudentItem, TeacherItem } from './types';

export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  sourceLabel: string;
  definition: string;
  targetPath: string;
  tone?: 'default' | 'positive' | 'warning';
  icon?: 'domain' | 'layers' | 'group' | 'warning';
}

export interface DashboardSection {
  id: 'serviceProducts' | 'contentAssets' | 'userUsage' | 'institutions' | 'students' | 'learning';
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
  servicePackages: ServicePackage[];
  contentPackages: ContentPackageItem[];
  knowledgePoints: KnowledgePointNode[];
  questions: QuestionItem[];
}

const number = (value: number) => value.toLocaleString('zh-CN');

export const derivePlatformDashboardSnapshot = ({ authCodes, students, auditLogs, servicePackages, contentPackages, knowledgePoints, questions }: DashboardInput): PlatformDashboardSnapshot => {
  const activeServicePackages = servicePackages.filter((item) => item.status === 'active');
  const activeContentPackages = contentPackages.filter((item) => item.status === 'active');
  const activeKnowledgePoints = knowledgePoints.filter((item) => item.status === 'active');
  const activeQuestions = questions.filter((item) => item.status === 'active');
  const incompleteServices = activeServicePackages.filter((item) => !(item.selectableContentPackageIds?.length) || !item.selectableContentPackageCount);
  const incompleteContent = activeContentPackages.filter((item) => !(item.knowledgePointIds?.length));
  const activated = authCodes.filter((item) => item.status === 'used').length;
  const pending = authCodes.filter((item) => item.status === 'pending').length;
  const activeStudents = students.filter((item) => item.serviceStatus === 'active').length;
  const studyHours = students.reduce((sum, item) => sum + item.totalStudyHours, 0);
  const answeredQuestions = students.reduce((sum, item) => sum + item.totalQuestions, 0);

  const metric = (value: number, fields: Omit<DashboardMetric, 'value' | 'displayValue'> & { suffix?: string }): DashboardMetric => ({
    ...fields,
    value,
    displayValue: `${number(value)}${fields.suffix ?? ''}`,
  });

  return {
    updatedAt: auditLogs[0]?.timestamp ?? '暂无更新记录',
    sections: [
      {
        id: 'serviceProducts', title: '服务产品', description: '平台服务包及用户权益的配置与启用情况', metrics: [
          metric(activeServicePackages.length, { id: 'activeServicePackages', label: '启用服务包', sourceLabel: '服务包', definition: '当前可用于新开通的服务包', targetPath: '/platform/goods?tab=packages', tone: 'positive', icon: 'layers' }),
          metric(servicePackages.length, { id: 'servicePackages', label: '服务包总数', sourceLabel: '服务包', definition: '平台全部服务包数量', targetPath: '/platform/goods?tab=packages' }),
          metric(activated, { id: 'activatedRights', label: '已生效用户权益', suffix: ' 项', sourceLabel: '用户权益', definition: '已经激活并可使用的用户权益', targetPath: '/platform/students?service=active', tone: 'positive', icon: 'group' }),
          metric(incompleteServices.length, { id: 'incompleteServices', label: '待补充服务配置', sourceLabel: '服务包', definition: '未配置内容包范围或可选数量的启用服务包', targetPath: '/platform/goods?tab=packages', tone: 'warning', icon: 'warning' }),
        ],
      },
      {
        id: 'contentAssets', title: '内容资产', description: '内容包、知识点与精选题库的发布规模和完整度', metrics: [
          metric(activeContentPackages.length, { id: 'contentPackages', label: '启用内容包', sourceLabel: '内容包', definition: '当前可被服务包选择的内容包', targetPath: '/platform/content/packages', tone: 'positive', icon: 'layers' }),
          metric(activeKnowledgePoints.length, { id: 'knowledgePoints', label: '启用知识点', sourceLabel: '知识点', definition: '当前已启用的知识点数量', targetPath: '/platform/content/resources/knowledge-points' }),
          metric(activeQuestions.length, { id: 'questions', label: '启用精选题', sourceLabel: '精选题库', definition: '当前已启用的精选题目数量', targetPath: '/platform/content/resources/questions' }),
          metric(incompleteContent.length, { id: 'incompleteContent', label: '待补充内容包', sourceLabel: '内容包', definition: '尚未选择知识点的启用内容包', targetPath: '/platform/content/packages', tone: 'warning', icon: 'warning' }),
        ],
      },
      {
        id: 'userUsage', title: '用户与使用', description: '用户服务状态、激活结果与小程序使用情况', metrics: [
          metric(activeStudents, { id: 'activeUsers', label: '服务中用户', suffix: ' 人', sourceLabel: '用户服务', definition: '服务状态正常的用户', targetPath: '/platform/students?service=active', tone: 'positive', icon: 'group' }),
          metric(pending, { id: 'pendingActivation', label: '待激活用户', suffix: ' 人', sourceLabel: '用户权益', definition: '已开通但尚未激活的用户权益', targetPath: '/platform/students?service=pending', tone: 'warning' }),
          metric(studyHours, { id: 'studyHours', label: '累计使用时长', suffix: ' 小时', sourceLabel: '小程序使用记录', definition: '用户累计使用时长', targetPath: '/platform/students?tab=diagnostics' }),
          metric(answeredQuestions, { id: 'answeredQuestions', label: '累计答题', suffix: ' 题', sourceLabel: '小程序使用记录', definition: '用户累计答题数量', targetPath: '/platform/students?tab=diagnostics' }),
        ],
      },
    ],
    workItems: [
      ...(incompleteServices.length ? [{ id: 'incomplete-services', title: '服务包配置待补充', description: '补充内容包范围与可选数量后再启用', count: incompleteServices.length, targetPath: '/platform/goods?tab=packages', tone: 'danger' as const }] : []),
      ...(incompleteContent.length ? [{ id: 'incomplete-content', title: '内容包待补充', description: '为内容包选择知识点与精选题库', count: incompleteContent.length, targetPath: '/platform/content/packages', tone: 'danger' as const }] : []),
      ...(pending ? [{ id: 'pending-activation', title: '用户待激活', description: '查看用户服务与权益记录', count: pending, targetPath: '/platform/students?service=pending', tone: 'warning' as const }] : []),
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
