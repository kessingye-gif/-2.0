import assert from 'node:assert/strict';
import test from 'node:test';
import { initialAuditLogs, initialAuthCodes, initialInstitutions, initialOrderLedger, initialStudents, initialTeachers } from './mockData';
import { deriveInstitutionDashboardSnapshot, derivePlatformDashboardSnapshot, deriveTeacherDashboardSnapshot } from './dashboardSnapshot';

const snapshot = derivePlatformDashboardSnapshot({
  institutions: initialInstitutions,
  authCodes: initialAuthCodes,
  students: initialStudents,
  orders: initialOrderLedger,
  auditLogs: initialAuditLogs,
});

test('运营总览指标由机构记录求和得到', () => {
  const metrics = snapshot.sections.find((section) => section.id === 'institutions')!.metrics;
  assert.equal(metrics.find((metric) => metric.id === 'remainingQuota')?.value, initialInstitutions.reduce((sum, item) => sum + item.remainingQuota, 0));
  assert.equal(metrics.find((metric) => metric.id === 'activeInstitutions')?.value, initialInstitutions.filter((item) => item.status === 'active').length);
});

test('低额度和激活指标从共享记录推导', () => {
  const institutionMetrics = snapshot.sections.find((section) => section.id === 'institutions')!.metrics;
  const studentMetrics = snapshot.sections.find((section) => section.id === 'students')!.metrics;
  const expectedLow = initialInstitutions.filter((item) => item.status === 'active' && item.totalQuota > 0 && item.remainingQuota / item.totalQuota <= 0.15).length;
  assert.equal(institutionMetrics.find((metric) => metric.id === 'lowQuota')?.value, expectedLow);
  assert.equal(institutionMetrics.find((metric) => metric.id === 'serviceStudents')?.value, initialInstitutions.reduce((sum, item) => sum + item.studentCount, 0));
  assert.equal(studentMetrics.find((metric) => metric.id === 'activated')?.value, initialAuthCodes.filter((item) => item.status === 'used').length);
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
