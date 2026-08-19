import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { deriveInstitutionDashboardSnapshot, derivePlatformDashboardSnapshot, deriveTeacherDashboardSnapshot } from '../../dashboardSnapshot';
import { initialAuditLogs, initialAuthCodes, initialContentPackages, initialInstitutions, initialKnowledgePoints, initialOrderLedger, initialQuestions, initialServicePackages, initialStudents, initialTeachers } from '../../mockData';
import { DashboardView, StudentLearningView } from './DashboardView';

test('平台运营首页将用户服务与学生学习合并为用户与使用', () => {
  const snapshot = derivePlatformDashboardSnapshot({ institutions: initialInstitutions, authCodes: initialAuthCodes, students: initialStudents, orders: initialOrderLedger, auditLogs: initialAuditLogs, servicePackages: initialServicePackages, contentPackages: initialContentPackages, knowledgePoints: initialKnowledgePoints, questions: initialQuestions });
  const markup = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(DashboardView, { snapshot })));
  ['平台运营总览', '机构运营', '用户与使用', '内容管理', '待办异常', '使用情况', '合作机构', '正常机构', '机构剩余额度', '累计服务消耗'].forEach((text) => assert.match(markup, new RegExp(text)));
  assert.doesNotMatch(markup, />用户服务</);
  assert.doesNotMatch(markup, />学生学习</);
  const source = readFileSync(new URL('./DashboardView.tsx', import.meta.url), 'utf8');
  ['机构用户与使用汇总', "activeTab === 'users' && institutionTable", 'DiagnosticsView'].forEach((text) => assert.match(source, new RegExp(text)));
  assert.doesNotMatch(source, /activeTab === 'services'|activeTab === 'learning'/);
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

test('机构工作台聚焦服务与人员配置，学习分析进入独立学生学情页', () => {
  const institutionId = initialInstitutions[0].id;
  const institutionStudents = initialStudents.filter((student) => student.institutionId === institutionId);
  const institutionSnapshot = deriveInstitutionDashboardSnapshot({ institutionId, institutions: initialInstitutions, teachers: initialTeachers, students: initialStudents, auditLogs: initialAuditLogs });
  const institutionMarkup = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(DashboardView, { snapshot: institutionSnapshot, students: institutionStudents })));
  ['机构运营首页', '现在需要处理', '小程序学习闭环', '已导入学生', '已开通服务', '已开始学习', '待教师跟进', '小程序使用摘要', '待教师跟进学生', '查看学生学情'].forEach((text) => assert.match(institutionMarkup, new RegExp(text)));
  ['学科与知识点情况', '薄弱知识点'].forEach((text) => assert.doesNotMatch(institutionMarkup, new RegExp(text)));
  assert.doesNotMatch(institutionMarkup, /520,100|89,450|高频易错考点 Top 5/);

  const teacher = initialTeachers[0];
  const teacherStudents = initialStudents.filter((student) => student.teacherId === teacher.id);
  const teacherSnapshot = deriveTeacherDashboardSnapshot({ teacherId: teacher.id, teachers: initialTeachers, students: initialStudents, auditLogs: initialAuditLogs });
  const teacherMarkup = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(DashboardView, { snapshot: teacherSnapshot, students: teacherStudents })));
  assert.match(teacherMarkup, /学生学情/);
  assert.match(teacherMarkup, /查看我负责学生的小程序学习表现、薄弱知识点和待复习问题/);
  assert.match(teacherMarkup, /数据口径：小程序智能诊断/);
  assert.match(teacherMarkup, /示例数据/);
  assert.match(teacherMarkup, /薄弱知识点/);
  assert.match(teacherMarkup, /学生诊断列表/);
});

test('机构和教师共用学生学情，机构额外提供教师筛选', () => {
  const institutionId = initialInstitutions[0].id;
  const students = initialStudents.filter((student) => student.institutionId === institutionId);
  const teachers = initialTeachers.filter((teacher) => teacher.institutionId === institutionId);
  const institutionMarkup = renderToStaticMarkup(createElement(StudentLearningView, { students, teachers, viewerRole: 'institution_admin' }));
  ['学生学情', '负责教师', '全部教师', '学生诊断列表', '查看学情', '共性薄弱知识点'].forEach((text) => assert.match(institutionMarkup, new RegExp(text)));

  const teacherMarkup = renderToStaticMarkup(createElement(StudentLearningView, { students: students.filter((student) => student.teacherId === teachers[0]?.id), teachers, viewerRole: 'teacher' }));
  assert.match(teacherMarkup, /学生学情/);
  assert.doesNotMatch(teacherMarkup, /按负责教师筛选|全部教师/);
  assert.match(teacherMarkup, /按负责班级筛选/);
  assert.match(teacherMarkup, /全部班级/);
  assert.match(teacherMarkup, /数据口径：小程序智能诊断/);
});
