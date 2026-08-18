import assert from 'node:assert/strict';
import test from 'node:test';
import { initialAuditLogs, initialAuthCodes, initialContentPackages, initialInstitutions, initialKnowledgePoints, initialOrderLedger, initialQuestions, initialServicePackages, initialStudents, initialTeachers } from './mockData';
import { deriveInstitutionDashboardSnapshot, derivePlatformDashboardSnapshot, deriveTeacherDashboardSnapshot } from './dashboardSnapshot';

const snapshot = derivePlatformDashboardSnapshot({
  institutions: initialInstitutions,
  authCodes: initialAuthCodes,
  students: initialStudents,
  orders: initialOrderLedger,
  auditLogs: initialAuditLogs,
  servicePackages: initialServicePackages,
  contentPackages: initialContentPackages,
  knowledgePoints: initialKnowledgePoints,
  questions: initialQuestions,
});

test('平台首页优先展示服务产品、内容管理和用户使用', () => {
  assert.deepEqual(snapshot.sections.map((section) => section.title), ['服务产品', '内容管理', '用户与使用']);
  const ids = snapshot.sections.flatMap((section) => section.metrics.map((metric) => metric.id));
  assert.ok(ids.includes('activeServicePackages'));
  assert.ok(ids.includes('contentPackages'));
  assert.ok(ids.includes('knowledgePoints'));
  assert.equal(ids.includes('remainingQuota'), false);
});

test('服务内容指标从共享产品和内容记录推导', () => {
  const metrics = snapshot.sections.flatMap((section) => section.metrics);
  assert.equal(metrics.find((metric) => metric.id === 'activeServicePackages')?.value, initialServicePackages.filter((item) => item.status === 'active').length);
  assert.equal(metrics.find((metric) => metric.id === 'contentPackages')?.value, initialContentPackages.filter((item) => item.status === 'active').length);
  assert.equal(metrics.find((metric) => metric.id === 'knowledgePoints')?.value, initialKnowledgePoints.filter((item) => item.status === 'active').length);
  assert.equal(metrics.find((metric) => metric.id === 'questions')?.value, initialQuestions.filter((item) => item.status === 'active').length);
});

test('平台分类总览包含机构、额度、用户服务和学习数据', () => {
  assert.ok(snapshot.platformOverview);
  assert.equal(snapshot.platformOverview?.institutionMetrics.find((item) => item.id === 'institutions')?.value, initialInstitutions.length);
  assert.equal(snapshot.platformOverview?.institutionMetrics.find((item) => item.id === 'activeInstitutions')?.value, initialInstitutions.filter((item) => item.status === 'active').length);
  assert.ok(snapshot.platformOverview?.serviceMetrics.some((item) => item.id === 'pendingRights'));
  assert.ok(snapshot.platformOverview?.institutionUsage.length);
  assert.ok(snapshot.platformOverview?.contentHealth.some((item) => item.label === '无精选题知识点'));
  assert.equal(snapshot.platformOverview?.usage.answeredQuestions, initialStudents.reduce((sum, item) => sum + item.totalQuestions, 0));
});

test('每个指标都说明来源、口径和下钻去向', () => {
  const metrics = snapshot.sections.flatMap((section) => section.metrics);
  assert.ok(metrics.every((metric) => metric.sourceLabel && metric.definition && metric.targetPath.startsWith('/platform/')));
  assert.ok(snapshot.workItems.every((item) => item.targetPath.startsWith('/platform/')));
  assert.equal(JSON.stringify(snapshot).match(/合同|签约|回款/), null);
});

test('机构管理员大屏只汇总本机构老师和学生', () => {
  const institutionId = initialInstitutions[0].id;
  const result = deriveInstitutionDashboardSnapshot({ institutionId, institutions: initialInstitutions, teachers: initialTeachers, students: initialStudents, auditLogs: initialAuditLogs });
  const metrics = result.sections.flatMap((section) => section.metrics);
  assert.equal(metrics.find((item) => item.id === 'teachers')?.value, initialTeachers.filter((item) => item.institutionId === institutionId).length);
  assert.equal(metrics.find((item) => item.id === 'students')?.value, initialStudents.filter((item) => item.institutionId === institutionId).length);
  assert.equal(result.sections[0]?.title, '教师与学生');
  assert.equal(metrics.some((item) => item.id === 'allocatedTeacherQuota' || item.id === 'remainingTeacherQuota'), false);
  assert.equal(result.sections.some((section) => section.title.includes('全平台')), false);
});

test('教师大屏只汇总自己负责学生的学情', () => {
  const teacher = initialTeachers[0];
  const result = deriveTeacherDashboardSnapshot({ teacherId: teacher.id, teachers: initialTeachers, students: initialStudents, auditLogs: initialAuditLogs });
  const metrics = result.sections.flatMap((section) => section.metrics);
  const ownStudents = initialStudents.filter((item) => item.teacherId === teacher.id);
  assert.equal(metrics.find((item) => item.id === 'students')?.value, ownStudents.length);
  assert.equal(metrics.find((item) => item.id === 'questions')?.value, ownStudents.reduce((sum, item) => sum + item.totalQuestions, 0));
});
