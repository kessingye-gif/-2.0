import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialAuthCodes, initialParentGuardianships, initialServicePackages, initialStudents, initialTeachers } from '../../mockData';
import { MasterDataProvider } from '../../masterData/MasterDataContext';
import { StudentView } from './StudentView';

test('学生列表合并展示服务与家长状态，顶部只保留两个视图', () => {
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
      teachers: initialTeachers,
      onFulfillService: () => undefined,
      onRevokeAuthCode: () => undefined,
      onUpdateGuardianshipStatus: () => undefined,
      onGenerateReport: () => undefined,
    })
  ));

  assert.match(markup, /学生列表/);
  assert.match(markup, /学情报告/);
  assert.match(markup, /家长关系/);
  assert.match(markup, /已绑定/);
  assert.doesNotMatch(markup, /微信重新绑定审核/);
  assert.doesNotMatch(markup, />服务权益 \(/);
  assert.doesNotMatch(markup, />家长监护关系 \(/);
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
