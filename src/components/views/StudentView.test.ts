import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialAuthCodes, initialContentPackages, initialParentGuardianships, initialServicePackages, initialStudents, initialTeachers } from '../../mockData';
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
      onFulfillService: () => undefined,
      onRevokeAuthCode: () => undefined,
      onUpdateGuardianshipStatus: () => undefined,
      onGenerateReport: () => undefined,
    })
  ));

  assert.match(markup, /用户服务/);
  assert.match(markup, /组织分组/);
  assert.match(markup, /批量开通/);
  assert.match(markup, /使用情况/);
  assert.match(markup, /当前服务包/);
  assert.match(markup, /已选内容包/);
  assert.match(markup, /AI 用量/);
  assert.match(markup, /归属信息/);
  assert.match(markup, /负责教师/);
  assert.doesNotMatch(markup, /微信重新绑定审核/);
  assert.doesNotMatch(markup, />服务权益 \(/);
  assert.doesNotMatch(markup, />家长监护关系 \(/);
});

test('批量开通已合并为用户服务列表操作，不再作为独立页签', () => {
  const source = readFileSync(new URL('./StudentView.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /setActiveTab\('bulk'\)/);
  assert.match(source, /退出批量开通/);
  assert.match(source, /选择内容包/);
  assert.match(source, /实际扣除/);
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
