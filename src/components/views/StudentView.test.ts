import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialAuthCodes, initialContentPackages, initialInstitutions, initialParentGuardianships, initialServicePackages, initialStudents, initialTeachers } from '../../mockData';
import { MasterDataProvider } from '../../masterData/MasterDataContext';
import { StudentServiceReminderCards, StudentView } from './StudentView';

test('总部用户页面以服务和使用为主，教师与机构只作为归属条件', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null,
    createElement(StudentView, {
      students: initialStudents,
      guardianships: initialParentGuardianships,
      authCodes: initialAuthCodes,
      guardianBindingCodes: [{
        id: 'GBC-1', code: 'JB-DEMO-1001', studentId: 'STU-001', studentName: '王小明',
        institutionName: '浙江大学附属中学', createdAt: '2026-08-12', expireAt: '2026-08-19', status: 'pending',
      }],
      serviceRights: [{
        id: 'RIGHT-1', studentId: 'STU-001', studentName: '王小明', institutionId: 'INS-2023001', institutionName: '浙江大学附属中学',
        teacherId: 'TCH-001', teacherName: '张敏老师', packageId: 'PKG-004', packageName: '全科高量包', authCodeId: 'AC-001',
        includedAiUsage: 5000000, quotaConsumed: 350, createdAt: '2026-08-12', serviceExpireAt: '2027-08-12', status: 'pending',
      }],
      packages: initialServicePackages,
      contentPackages: initialContentPackages,
      teachers: initialTeachers,
      institutions: [],
      onAddStudents: () => undefined,
      onFulfillService: () => undefined,
      onRevokeAuthCode: () => undefined,
      onUpdateGuardianshipStatus: () => undefined,
    })
  ));

  assert.match(markup, /学生总数/);
  assert.match(markup, /服务中/);
  assert.match(markup, /待激活/);
  assert.match(markup, /30 天内到期/);
  assert.doesNotMatch(markup, /学生配置/);
  assert.match(markup, /批量办理/);
  assert.match(markup, /导入学生/);
  assert.match(markup, /更多筛选/);
  assert.doesNotMatch(markup, /全部班级/);
  assert.doesNotMatch(markup, /使用情况/);
  assert.match(markup, /服务包 \/ 内容包/);
  assert.match(markup, /AI 用量/);
  assert.match(markup, />归属</);
  assert.doesNotMatch(markup, /微信重新绑定审核/);
  assert.doesNotMatch(markup, />服务权益 \(/);
  assert.doesNotMatch(markup, />家长监护关系 \(/);
});

test('批量开通已合并为用户服务列表操作，不再作为独立页签', () => {
  const source = readFileSync(new URL('./StudentView.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /setActiveTab\('bulk'\)/);
  assert.match(source, /退出批量/);
  assert.match(source, /选择内容包/);
  assert.match(source, /实际扣除/);
});

test('学生导入页平铺教师列表并从教师行发起导入', () => {
  const source = readFileSync(new URL('./StudentView.tsx', import.meta.url), 'utf8');
  assert.match(source, /选择负责教师/);
  assert.match(source, /teachers\.map\(\(teacher\)/);
  assert.match(source, /openImportDialog\(teacher\)/);
  assert.match(source, /setDetailTeacher\(teacher\)/);
  assert.match(source, />查看详情<\/button>/);
  assert.match(source, />导入学生<\/button>/);
  assert.match(source, /新增教师/);
  assert.doesNotMatch(source, /维护教师/);
});

test('学生配置筛选栏不显示重复人数，操作按钮与筛选同排', () => {
  const source = readFileSync(new URL('./StudentView.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /filteredStudents\.length} \/ \{students\.length/);
  assert.match(source, /全部服务状态[\s\S]*导入学生[\s\S]*批量办理/);
});

test('办理服务属于学生页弹窗，不跳转到商品页', () => {
  const source = readFileSync(new URL('./StudentView.tsx', import.meta.url), 'utf8');
  assert.match(source, /DialogShell/);
  assert.match(source, /ServiceFulfillmentPanel/);
  assert.doesNotMatch(source, /onStartService/);
});

test('学生详情集中承载服务权益、双码和家长关系', () => {
  const source = readFileSync(new URL('./StudentView.tsx', import.meta.url), 'utf8');
  assert.match(source, /基本资料/);
  assert.match(source, /每笔服务包、AI 用量、双码和有效期分别保留/);
  assert.match(source, /家长关系/);
  assert.doesNotMatch(source, /flex justify-end bg-black\/30/);
  assert.doesNotMatch(source, /<aside className="h-full/);
});

test('学生详情为命中规则的服务权益显示待跟进提醒', () => {
  const markup = renderToStaticMarkup(createElement(StudentServiceReminderCards, {
    reminders: [{
      id: 'RIGHT-1:activation', rightId: 'RIGHT-1', studentId: 'STU-001', packageName: '全科高量包',
      kind: 'activation' as const, title: '已办理服务尚未激活', description: '请联系学生完成激活。',
    }],
    onDismiss: () => undefined,
  }));

  assert.match(markup, /待跟进提醒/);
  assert.match(markup, /联系学生完成激活/);
  assert.match(markup, /标记已处理/);
});

test('没有学生时给出创建教师到导入学生的首次使用引导', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null, createElement(StudentView, {
    students: [], guardianships: [], authCodes: [], guardianBindingCodes: [], serviceRights: [], packages: initialServicePackages,
    teachers: initialTeachers, institutions: initialInstitutions, onAddStudents: () => undefined,
    onFulfillService: () => undefined, onRevokeAuthCode: () => undefined, onUpdateGuardianshipStatus: () => undefined,
  })));
  assert.match(markup, /还没有学生，先完成首次导入/);
  assert.match(markup, /选择教师并导入学生/);
  assert.match(markup, /步骤 1/);
});

test('加载学生数据时显示独立骨架状态', () => {
  const markup = renderToStaticMarkup(createElement(MasterDataProvider, null, createElement(StudentView, {
    students: [], guardianships: [], authCodes: [], guardianBindingCodes: [], serviceRights: [], packages: [], teachers: [],
    onFulfillService: () => undefined, onRevokeAuthCode: () => undefined, onUpdateGuardianshipStatus: () => undefined, isLoading: true,
  })));
  assert.match(markup, /学生数据加载中/);
  assert.doesNotMatch(markup, /还没有学生/);
});
