import type { AuditLogItem, AuthCode, ContentPackageItem, Institution, KnowledgePointNode, OrderLedgerRecord, QuestionItem, ServicePackage, StudentItem, StudentServiceRight, TeacherItem } from './types';

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
  platformOverview?: {
    institutionMetrics: DashboardMetric[];
    serviceMetrics: DashboardMetric[];
    coreMetrics: DashboardMetric[];
    quota: { total: number; remaining: number; consumed: number };
    serviceSummary: { openings: number; renewals: number; pending: number; expiring: number; expired: number };
    packageDistribution: { name: string; count: number }[];
    subjectCoverage: { subject: string; knowledgePoints: number; coveredKnowledgePoints: number; questions: number; coverageRate: number }[];
    learningLoop: { answeredQuestions: number; wrongQuestions: number; reviewedWrongQuestions: number; reviewRate: number };
    usage: { learningStudents: number; totalStudyHours: number; answeredQuestions: number; averageAccuracy: number; wrongQuestions: number; reviewedWrongQuestions: number; unreviewedWrongQuestions: number; reviewRate: number };
    institutionUsage: { id: string; name: string; serviceStudents: number; learningStudents: number; answeredQuestions: number; attentionStudents: number }[];
    contentHealth: { label: string; value: number; description: string; targetPath: string; tone: 'default' | 'warning' }[];
  };
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
  serviceRights?: StudentServiceRight[];
}

const number = (value: number) => value.toLocaleString('zh-CN');
const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

export const derivePlatformDashboardSnapshot = ({ institutions, authCodes, students, orders, auditLogs, servicePackages, contentPackages, knowledgePoints, questions, serviceRights = [] }: DashboardInput): PlatformDashboardSnapshot => {
  const activeServicePackages = servicePackages.filter((item) => item.status === 'active');
  const activeContentPackages = contentPackages.filter((item) => item.status === 'active');
  const activeKnowledgePoints = knowledgePoints.filter((item) => item.status === 'active');
  const activeQuestions = questions.filter((item) => item.status === 'active');
  const incompleteServices = activeServicePackages.filter((item) => !item.selectableContentPackageCount);
  const incompleteContent = activeContentPackages.filter((item) => !(item.knowledgePointIds?.length));
  const activated = authCodes.filter((item) => item.status === 'used').length;
  const pending = authCodes.filter((item) => item.status === 'pending').length;
  const activeStudents = students.filter((item) => item.serviceStatus === 'active').length;
  const studyHours = students.reduce((sum, item) => sum + item.totalStudyHours, 0);
  const answeredQuestions = students.reduce((sum, item) => sum + item.totalQuestions, 0);
  const learningStudents = students.filter((item) => item.totalStudyHours > 0 || item.totalQuestions > 0).length;
  const wrongQuestions = students.reduce((sum, item) => sum + item.errorCount, 0);
  const unreviewedQuestions = students.reduce((sum, item) => sum + item.unreviewedErrorCount, 0);
  const reviewedWrongQuestions = Math.max(0, wrongQuestions - unreviewedQuestions);
  const averageAccuracy = students.length ? Math.round(students.reduce((sum, item) => sum + item.accuracyRate, 0) / students.length * 10) / 10 : 0;
  const totalStudyHours = students.reduce((sum, item) => sum + item.totalStudyHours, 0);
  const levelThreeKnowledgePoints = activeKnowledgePoints.filter((item) => item.level === 3);
  const knowledgePointPool = levelThreeKnowledgePoints.length > 0 ? levelThreeKnowledgePoints : activeKnowledgePoints;
  const activeQuestionKnowledgePointIds = new Set(activeQuestions.map((item) => item.knowledgePointLevel3Id));
  const coveredKnowledgePoints = knowledgePointPool.filter((item) => activeQuestionKnowledgePointIds.has(item.id) || item.questionCount > 0);
  const knowledgeCoverageRate = knowledgePointPool.length ? Math.round(coveredKnowledgePoints.length / knowledgePointPool.length * 100) : 0;
  const totalInstitutionQuota = institutions.reduce((sum, item) => sum + item.totalQuota, 0);
  const remainingInstitutionQuota = institutions.reduce((sum, item) => sum + item.remainingQuota, 0);
  const consumedInstitutionQuota = orders.filter((item) => item.status === 'completed' && item.type === 'package_redeem').reduce((sum, item) => sum + Math.abs(Math.min(0, item.creditChange)), 0);
  const rightPool = serviceRights.length > 0 ? serviceRights : authCodes.flatMap((item) => item.studentId ? [{ packageName: item.packageName, status: item.status === 'used' ? 'active' as const : item.status === 'pending' ? 'pending' as const : item.status === 'expired' ? 'expired' as const : 'revoked' as const, fulfillmentKind: 'activation' as const, serviceExpireAt: null }] : []);
  const activeRights = rightPool.filter((item) => item.status === 'active');
  const pendingRights = rightPool.filter((item) => item.status === 'pending');
  const expiredRights = rightPool.filter((item) => item.status === 'expired');
  const today = dateOnly(new Date());
  const inSevenDays = dateOnly(new Date(Date.now() + 7 * 86400000));
  const expiringRights = activeRights.filter((item) => item.serviceExpireAt && item.serviceExpireAt >= today && item.serviceExpireAt <= inSevenDays);
  const packageDistribution = [...new Set(rightPool.map((item) => item.packageName))].map((name) => ({ name, count: rightPool.filter((item) => item.packageName === name && item.status !== 'revoked').length })).sort((a, b) => b.count - a.count);
  const subjects = [...new Set([...knowledgePointPool.map((item) => item.subject), ...activeQuestions.map((item) => item.subject)])];
  const subjectCoverage = subjects.map((subject) => {
    const subjectKnowledgePoints = knowledgePointPool.filter((item) => item.subject === subject);
    const subjectCovered = subjectKnowledgePoints.filter((item) => activeQuestionKnowledgePointIds.has(item.id) || item.questionCount > 0);
    return {
      subject,
      knowledgePoints: subjectKnowledgePoints.length,
      coveredKnowledgePoints: subjectCovered.length,
      questions: activeQuestions.filter((item) => item.subject === subject).length,
      coverageRate: subjectKnowledgePoints.length ? Math.round(subjectCovered.length / subjectKnowledgePoints.length * 100) : 0,
    };
  }).sort((a, b) => b.knowledgePoints - a.knowledgePoints);

  const metric = (value: number, fields: Omit<DashboardMetric, 'value' | 'displayValue'> & { suffix?: string }): DashboardMetric => ({
    ...fields,
    value,
    displayValue: `${number(value)}${fields.suffix ?? ''}`,
  });

  return {
    updatedAt: auditLogs[0]?.timestamp ?? '暂无更新记录',
    platformOverview: {
      institutionMetrics: [
        metric(institutions.length, { id: 'institutions', label: '合作机构', suffix: ' 家', sourceLabel: '机构档案', definition: '平台全部合作机构', targetPath: '/platform/institutions', icon: 'domain' }),
        metric(institutions.filter((item) => item.status === 'active').length, { id: 'activeInstitutions', label: '正常机构', suffix: ' 家', sourceLabel: '机构档案', definition: '当前状态正常的合作机构', targetPath: '/platform/institutions?status=active', tone: 'positive', icon: 'domain' }),
        metric(remainingInstitutionQuota, { id: 'remainingQuota', label: '机构剩余额度', suffix: ' 点', sourceLabel: '机构额度账户', definition: '全部机构当前可用点数之和', targetPath: '/platform/institutions?view=quota', icon: 'layers' }),
        metric(consumedInstitutionQuota, { id: 'consumedQuota', label: '累计服务消耗', suffix: ' 点', sourceLabel: '服务办理流水', definition: '已完成服务办理实际扣除的机构点数', targetPath: '/platform/goods?tab=orders', icon: 'layers' }),
      ],
      serviceMetrics: [
        metric(activeRights.length, { id: 'activeRights', label: '服务中用户', suffix: ' 人', sourceLabel: '用户权益', definition: '当前状态为服务中的用户权益', targetPath: '/platform/students?service=active', tone: 'positive', icon: 'group' }),
        metric(pendingRights.length, { id: 'pendingRights', label: '待激活用户', suffix: ' 人', sourceLabel: '用户权益', definition: '已经办理但尚未首次激活的用户', targetPath: '/platform/students?service=pending', tone: pendingRights.length ? 'warning' : 'default', icon: pendingRights.length ? 'warning' : 'group' }),
        metric(expiringRights.length, { id: 'expiringRights', label: '7天内到期', suffix: ' 人', sourceLabel: '用户权益', definition: '服务有效期将在7天内结束的用户', targetPath: '/platform/students?service=expiring', tone: expiringRights.length ? 'warning' : 'default', icon: expiringRights.length ? 'warning' : 'group' }),
        metric(expiredRights.length, { id: 'expiredRights', label: '已到期用户', suffix: ' 人', sourceLabel: '用户权益', definition: '服务权益已经到期的用户', targetPath: '/platform/students?service=expired', tone: expiredRights.length ? 'warning' : 'default', icon: expiredRights.length ? 'warning' : 'group' }),
      ],
      coreMetrics: [
        metric(activeStudents, { id: 'activeUsers', label: '服务中学生', suffix: ' 人', sourceLabel: '用户服务', definition: '当前拥有有效服务的学生', targetPath: '/platform/students?service=active', tone: 'positive', icon: 'group' }),
        metric(learningStudents, { id: 'learningUsers', label: '已有学习记录', suffix: ' 人', sourceLabel: '小程序学习记录', definition: '已经产生学习时长或答题记录的学生', targetPath: '/platform/students?tab=diagnostics', icon: 'domain' }),
        metric(answeredQuestions, { id: 'answeredQuestions', label: '精选题练习', suffix: ' 题', sourceLabel: '小程序答题记录', definition: '学生累计完成的练习题量', targetPath: '/platform/students?tab=diagnostics', icon: 'layers' }),
        metric(knowledgeCoverageRate, { id: 'knowledgeCoverage', label: '知识点题目覆盖', suffix: '%', sourceLabel: '知识点与精选题库', definition: '已绑定精选题的启用三级知识点比例', targetPath: '/platform/content/resources/knowledge-points', tone: knowledgeCoverageRate < 80 ? 'warning' : 'positive', icon: knowledgeCoverageRate < 80 ? 'warning' : 'layers' }),
      ],
      quota: { total: totalInstitutionQuota, remaining: remainingInstitutionQuota, consumed: consumedInstitutionQuota },
      serviceSummary: {
        openings: rightPool.filter((item) => item.fulfillmentKind !== 'renewal').length,
        renewals: rightPool.filter((item) => item.fulfillmentKind === 'renewal').length,
        pending: pendingRights.length,
        expiring: expiringRights.length,
        expired: expiredRights.length,
      },
      packageDistribution,
      subjectCoverage,
      learningLoop: {
        answeredQuestions,
        wrongQuestions,
        reviewedWrongQuestions,
        reviewRate: wrongQuestions ? Math.round(reviewedWrongQuestions / wrongQuestions * 100) : 0,
      },
      usage: { learningStudents, totalStudyHours, answeredQuestions, averageAccuracy, wrongQuestions, reviewedWrongQuestions, unreviewedWrongQuestions: unreviewedQuestions, reviewRate: wrongQuestions ? Math.round(reviewedWrongQuestions / wrongQuestions * 1000) / 10 : 0 },
      institutionUsage: institutions.map((institution) => {
        const scopedStudents = students.filter((item) => item.institutionId === institution.id);
        return {
          id: institution.id,
          name: institution.name,
          serviceStudents: scopedStudents.filter((item) => item.serviceStatus === 'active').length,
          learningStudents: scopedStudents.filter((item) => item.totalStudyHours > 0 || item.totalQuestions > 0).length,
          answeredQuestions: scopedStudents.reduce((sum, item) => sum + item.totalQuestions, 0),
          attentionStudents: scopedStudents.filter((item) => item.serviceStatus !== 'active' || item.unreviewedErrorCount > 0).length,
        };
      }).sort((a, b) => b.attentionStudents - a.attentionStudents),
      contentHealth: [
        { label: '无精选题知识点', value: Math.max(0, knowledgePointPool.length - coveredKnowledgePoints.length), description: '启用但尚未绑定精选题的三级知识点', targetPath: '/platform/content/resources/knowledge-points', tone: knowledgePointPool.length > coveredKnowledgePoints.length ? 'warning' : 'default' },
        { label: '待补充内容包', value: incompleteContent.length, description: '尚未选择知识点的启用内容包', targetPath: '/platform/content/packages', tone: incompleteContent.length ? 'warning' : 'default' },
        { label: '停用精选题', value: questions.length - activeQuestions.length, description: '当前不能进入学生练习的精选题', targetPath: '/platform/content/resources/questions', tone: 'default' },
      ],
    },
    sections: [
      {
        id: 'serviceProducts', title: '服务产品', description: '平台服务包及用户权益的配置与启用情况', metrics: [
          metric(activeServicePackages.length, { id: 'activeServicePackages', label: '启用服务包', sourceLabel: '服务包', definition: '当前可用于新开通的服务包', targetPath: '/platform/goods?tab=packages', tone: 'positive', icon: 'layers' }),
          metric(servicePackages.length, { id: 'servicePackages', label: '服务包总数', sourceLabel: '服务包', definition: '平台全部服务包数量', targetPath: '/platform/goods?tab=packages' }),
          metric(activated, { id: 'activatedRights', label: '已生效用户权益', suffix: ' 项', sourceLabel: '用户权益', definition: '已经激活并可使用的用户权益', targetPath: '/platform/students?service=active', tone: 'positive', icon: 'group' }),
          metric(incompleteServices.length, { id: 'incompleteServices', label: '待补充服务配置', sourceLabel: '服务包', definition: '未配置可选内容包数量的启用服务包', targetPath: '/platform/goods?tab=packages', tone: 'warning', icon: 'warning' }),
        ],
      },
      {
        id: 'contentAssets', title: '内容管理', description: '内容包、知识点与精选题库的发布规模和完整度', metrics: [
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
      ...(incompleteServices.length ? [{ id: 'incomplete-services', title: '服务包配置待补充', description: '补充可选内容包数量后再启用', count: incompleteServices.length, targetPath: '/platform/goods?tab=packages', tone: 'danger' as const }] : []),
      ...(incompleteContent.length ? [{ id: 'incomplete-content', title: '内容包待补充', description: '为内容包选择知识点与精选题库', count: incompleteContent.length, targetPath: '/platform/content/packages', tone: 'danger' as const }] : []),
      ...(pending ? [{ id: 'pending-activation', title: '用户待激活', description: '查看用户服务与权益记录', count: pending, targetPath: '/platform/students?service=pending', tone: 'warning' as const }] : []),
      ...(expiringRights.length ? [{ id: 'expiring-rights', title: '用户服务即将到期', description: '7天内到期，请及时跟进续费', count: expiringRights.length, targetPath: '/platform/students?service=expiring', tone: 'warning' as const }] : []),
      ...(expiredRights.length ? [{ id: 'expired-rights', title: '用户服务已到期', description: '查看到期用户并决定是否重新办理', count: expiredRights.length, targetPath: '/platform/students?service=expired', tone: 'warning' as const }] : []),
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
  const assignedStudents = scopedStudents.filter((item) => scopedTeachers.some((teacher) => teacher.id === item.teacherId));
  const averageStudentsPerTeacher = activeTeachers.length ? Math.round(assignedStudents.length / activeTeachers.length * 10) / 10 : 0;
  const studyHours = scopedStudents.reduce((sum, item) => sum + item.totalStudyHours, 0);
  const questions = scopedStudents.reduce((sum, item) => sum + item.totalQuestions, 0);
  const metric = (value: number, fields: Omit<DashboardMetric, 'value' | 'displayValue'> & { suffix?: string }): DashboardMetric => ({ ...fields, value, displayValue: `${number(value)}${fields.suffix ?? ''}` });

  return {
    updatedAt: auditLogs[0]?.timestamp ?? '暂无更新记录',
    sections: [
      { id: 'institutions', title: '教师与学生', description: `${institution?.name ?? '当前机构'}的教师及负责学生情况`, metrics: [
        metric(scopedTeachers.length, { id: 'teachers', label: '老师总数', suffix: ' 人', sourceLabel: '学生导入', definition: '当前机构全部老师', targetPath: '/platform/students' }),
        metric(activeTeachers.length, { id: 'activeTeachers', label: '在职老师', suffix: ' 人', sourceLabel: '学生导入', definition: '状态为正常的老师', targetPath: '/platform/students', tone: 'positive' }),
        metric(assignedStudents.length, { id: 'assignedStudents', label: '已归属学生', suffix: ' 人', sourceLabel: '学生配置', definition: '已关联负责教师的学生', targetPath: '/platform/students' }),
        metric(averageStudentsPerTeacher, { id: 'averageStudentsPerTeacher', label: '人均负责学生', suffix: ' 人', sourceLabel: '学生配置', definition: '已归属学生数除以在职教师数', targetPath: '/platform/students' }),
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
    workItems: pendingStudents.length ? [{ id: 'pending-students', title: '学生待办理服务', description: '进入学生管理统一办理服务', count: pendingStudents.length, targetPath: '/platform/students', tone: 'warning' }] : [],
  };
};

export const deriveTeacherDashboardSnapshot = ({ teacherId, teachers, students, auditLogs }: {
  teacherId: string;
  teachers: TeacherItem[];
  students: StudentItem[];
  auditLogs: AuditLogItem[];
}): PlatformDashboardSnapshot => {
  const teacher = teachers.find((item) => item.id === teacherId);
  const ownStudents = students.filter((item) => item.teacherId === teacherId || item.teacherAssignments?.some((assignment) => assignment.teacherId === teacherId));
  const activeStudents = ownStudents.filter((item) => item.serviceStatus === 'active');
  const pendingStudents = ownStudents.filter((item) => item.serviceStatus === 'none');
  const learningStudents = ownStudents.filter((item) => item.totalQuestions > 0 || item.totalStudyHours > 0);
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
        metric(pendingStudents.length, { id: 'pendingStudents', label: '待办理学生', suffix: ' 人', sourceLabel: '学生服务档案', definition: '尚未办理服务的学生', targetPath: '/platform/students?service=pending', tone: 'warning' }),
        metric(unreviewed, { id: 'attentionStudents', label: '待复习错题', suffix: ' 题', sourceLabel: '学生错题档案', definition: '负责学生尚未完成复习的错题', targetPath: '/platform/students?tab=diagnostics', tone: unreviewed ? 'warning' : 'default' }),
      ]},
      { id: 'students', title: '学生学情', description: '负责学生的学习与答题汇总', metrics: [
        metric(learningStudents.length, { id: 'learningStudents', label: '已有诊断学生', suffix: ' 人', sourceLabel: '小程序智能诊断', definition: '已在小程序产生练习或诊断数据的负责学生', targetPath: '/platform/students?tab=diagnostics', tone: 'positive' }),
        metric(studyHours, { id: 'studyHours', label: '累计学习时长', suffix: ' 小时', sourceLabel: '学生学习档案', definition: '负责学生累计学习时长', targetPath: '/platform/students?tab=diagnostics' }),
        metric(questions, { id: 'questions', label: '累计答题', suffix: ' 题', sourceLabel: '小程序智能诊断', definition: '负责学生在小程序中的累计答题数', targetPath: '/platform/students?tab=diagnostics' }),
        metric(averageAccuracy, { id: 'accuracy', label: '平均正确率', suffix: '%', sourceLabel: '小程序智能诊断', definition: '负责学生诊断报告的平均答题正确率', targetPath: '/platform/students?tab=diagnostics' }),
      ]},
      { id: 'learning', title: '错题与复习', description: '需要老师关注的学习问题', metrics: [
        metric(errors, { id: 'errors', label: '累计错题', suffix: ' 题', sourceLabel: '学生错题档案', definition: '负责学生累计错题数', targetPath: '/platform/students?tab=diagnostics' }),
        metric(unreviewed, { id: 'unreviewed', label: '待复习错题', suffix: ' 题', sourceLabel: '学生错题档案', definition: '尚未完成复习的错题', targetPath: '/platform/students?tab=diagnostics', tone: 'warning' }),
      ]},
    ],
    workItems: [
      ...(unreviewed ? [{ id: 'unreviewed-errors', title: '学生错题待复习', description: '进入学生学情查看需关注学生', count: unreviewed, targetPath: '/platform/students?tab=diagnostics', tone: 'danger' as const }] : []),
    ],
  };
};
