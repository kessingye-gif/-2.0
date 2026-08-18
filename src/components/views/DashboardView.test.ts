import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { deriveInstitutionDashboardSnapshot, derivePlatformDashboardSnapshot, deriveTeacherDashboardSnapshot } from '../../dashboardSnapshot';
import { initialAuditLogs, initialAuthCodes, initialContentPackages, initialInstitutions, initialKnowledgePoints, initialOrderLedger, initialQuestions, initialServicePackages, initialStudents, initialTeachers } from '../../mockData';
import { DashboardView } from './DashboardView';

test('平台运营首页按机构、服务、学习、内容和待办分类展示', () => {
  const snapshot = derivePlatformDashboardSnapshot({ institutions: initialInstitutions, authCodes: initialAuthCodes, students: initialStudents, orders: initialOrderLedger, auditLogs: initialAuditLogs, servicePackages: initialServicePackages, contentPackages: initialContentPackages, knowledgePoints: initialKnowledgePoints, questions: initialQuestions });
  const markup = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(DashboardView, { snapshot })));
  ['平台运营总览', '机构运营', '用户服务', '学生学习', '内容管理', '待办异常', '使用情况', '合作机构', '正常机构', '机构剩余额度', '累计服务消耗', '机构用户与使用汇总'].forEach((text) => assert.match(markup, new RegExp(text)));
  const source = readFileSync(new URL('./DashboardView.tsx', import.meta.url), 'utf8');
  ['开通与续费', '服务包分布', '精选题学习闭环', 'DiagnosticsView'].forEach((text) => assert.match(source, new RegExp(text)));
  const usageSource = readFileSync(new URL('./DiagnosticsView.tsx', import.meta.url), 'utf8');
  ['小程序累积刷题量', '平台整体正确率', '高频易错考点 Top 5', 'AI 学伴提问类型分布', '学生个体 AI 智能诊断档案'].forEach((text) => assert.match(usageSource, new RegExp(text)));
  const overviewJson = JSON.stringify(snapshot.platformOverview);
  ['服务中用户', '待激活用户', '7天内到期', '已到期用户', '无精选题知识点'].forEach((text) => assert.match(overviewJson, new RegExp(text)));
  assert.doesNotMatch(markup, /学情总览|人员管理|交易管理/);
  assert.match(markup, /role="tablist"/);
  assert.doesNotMatch(markup, /rounded-\[24px\]|shadow-inner/);
  assert.doesNotMatch(markup, /平台剩余额度|运行中机构数|低额度预警机构/);
  assert.doesNotMatch(markup, /平台总部 · 全局监管|平台经营驾驶舱/);
  assert.equal(/商业履约驾驶舱|七段履约漏斗|签约|合同|回款/.test(markup), false);
  assert.match(markup, /href="\/platform\/institutions"/);
});

test('机构与教师工作台先展示待办和真实范围学习摘要', () => {
  const institutionId = initialInstitutions[0].id;
  const institutionStudents = initialStudents.filter((student) => student.institutionId === institutionId);
  const institutionSnapshot = deriveInstitutionDashboardSnapshot({ institutionId, institutions: initialInstitutions, teachers: initialTeachers, students: initialStudents, auditLogs: initialAuditLogs });
  const institutionMarkup = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(DashboardView, { snapshot: institutionSnapshot, students: institutionStudents })));
  ['本机构运营工作台', '现在需要处理', '核心情况', '小程序学习摘要', '学科与知识点情况'].forEach((text) => assert.match(institutionMarkup, new RegExp(text)));
  assert.doesNotMatch(institutionMarkup, /520,100|89,450|高频易错考点 Top 5/);

  const teacher = initialTeachers[0];
  const teacherStudents = initialStudents.filter((student) => student.teacherId === teacher.id);
  const teacherSnapshot = deriveTeacherDashboardSnapshot({ teacherId: teacher.id, teachers: initialTeachers, students: initialStudents, auditLogs: initialAuditLogs });
  const teacherMarkup = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(DashboardView, { snapshot: teacherSnapshot, students: teacherStudents })));
  assert.match(teacherMarkup, /我的教学工作台/);
  assert.match(teacherMarkup, new RegExp(`${teacher.name}负责范围`));
});
